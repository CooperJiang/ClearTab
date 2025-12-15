import ChromeBookmarkService, { type ChromeBookmark } from './chromeBookmarkService';
import { useBookmarkMetadataStore, type BookmarkMetadata as StoredBookmarkMetadata } from '../stores/useBookmarkMetadataStore';
import type {
  BrowserBookmarkNodeSnapshot,
  BrowserBookmarkSnapshot,
  BrowserBookmarkMetadataPayload,
} from '../types/sync';

export type BrowserBookmarkRestoreStrategy = 'skip' | 'append' | 'replace';

interface FlatBookmarkEntry {
  key: string;
  type: 'folder' | 'bookmark';
  path: string;
  title: string;
  url?: string;
  metadataSignature?: string;
}

export interface BrowserBookmarksDiff {
  added: number;
  removed: number;
  changed: number;
  addedItems: FlatBookmarkEntry[];
  removedItems: FlatBookmarkEntry[];
  changedItems: Array<{ local: FlatBookmarkEntry; remote: FlatBookmarkEntry }>;
}

export interface BrowserBookmarkStats {
  totalBookmarks: number;
  totalFolders: number;
  branchCount: number;
}

type MetadataSetter = (chromeId: string, meta: Partial<StoredBookmarkMetadata>) => void;

const BACKUP_FOLDER_PREFIX = 'Cleartab 云备份';
const FALLBACK_FOLDER_NAME = '未命名文件夹';
const FALLBACK_BOOKMARK_NAME = '未命名书签';

export async function captureBrowserSnapshot(): Promise<BrowserBookmarkSnapshot | null> {
  if (!ChromeBookmarkService.isAvailable()) {
    return null;
  }

  try {
    const metadataMap = useBookmarkMetadataStore.getState().metadata;
    const tree = await ChromeBookmarkService.getBookmarks();
    const root = tree[0];
    if (!root?.children) {
      return [];
    }

    return root.children
      .map((branch) => ({
        rootId: branch.id,
        rootTitle: branch.title || FALLBACK_FOLDER_NAME,
        items: (branch.children || [])
          .map((child) => sanitizeNode(child, metadataMap))
          .filter((node): node is BrowserBookmarkNodeSnapshot => node !== null),
      }))
      .filter((branch) => branch.items.length > 0);
  } catch (error) {
    console.error('[BrowserBookmarkSync] Failed to capture snapshot', error);
    throw error instanceof Error ? error : new Error('Failed to capture browser bookmarks');
  }
}

export function summarizeBrowserSnapshot(snapshot: BrowserBookmarkSnapshot | null): BrowserBookmarkStats {
  const stats: BrowserBookmarkStats = {
    totalBookmarks: 0,
    totalFolders: 0,
    branchCount: snapshot?.length || 0,
  };

  if (!snapshot) {
    return stats;
  }

  for (const branch of snapshot) {
    for (const node of branch.items) {
      accumulateStats(node, stats);
    }
  }

  return stats;
}

export function diffBrowserSnapshots(
  localSnapshot: BrowserBookmarkSnapshot | null,
  remoteSnapshot: BrowserBookmarkSnapshot | null
): BrowserBookmarksDiff {
  if (!remoteSnapshot || !remoteSnapshot.length) {
    return {
      added: 0,
      removed: 0,
      changed: 0,
      addedItems: [],
      removedItems: [],
      changedItems: [],
    };
  }

  const localEntries = flattenSnapshot(localSnapshot).filter((entry) => entry.type === 'bookmark');
  const remoteEntries = flattenSnapshot(remoteSnapshot).filter((entry) => entry.type === 'bookmark');

  const buildGroups = (entries: FlatBookmarkEntry[]) => {
    const groups = new Map<string, FlatBookmarkEntry[]>();
    for (const entry of entries) {
      const groupKey = `${entry.path}::${entry.url || ''}`;
      const list = groups.get(groupKey);
      if (list) {
        list.push(entry);
      } else {
        groups.set(groupKey, [entry]);
      }
    }
    return groups;
  };

  const entrySignature = (entry: FlatBookmarkEntry) => {
    return `${entry.title || ''}::${entry.url || ''}::${entry.metadataSignature || ''}`;
  };

  const localGroups = buildGroups(localEntries);
  const remoteGroups = buildGroups(remoteEntries);

  const addedItems: FlatBookmarkEntry[] = [];
  const removedItems: FlatBookmarkEntry[] = [];
  const changedItems: Array<{ local: FlatBookmarkEntry; remote: FlatBookmarkEntry }> = [];

  const allKeys = new Set<string>([...localGroups.keys(), ...remoteGroups.keys()]);

  for (const key of allKeys) {
    const localList = localGroups.get(key) ?? [];
    const remoteList = remoteGroups.get(key) ?? [];
    const minLength = Math.min(localList.length, remoteList.length);

    for (let i = 0; i < minLength; i += 1) {
      if (entrySignature(localList[i]) !== entrySignature(remoteList[i])) {
        changedItems.push({ local: localList[i], remote: remoteList[i] });
      }
    }

    if (remoteList.length > localList.length) {
      addedItems.push(...remoteList.slice(minLength));
    }

    if (localList.length > remoteList.length) {
      removedItems.push(...localList.slice(minLength));
    }
  }

  return {
    added: addedItems.length,
    removed: removedItems.length,
    changed: changedItems.length,
    addedItems,
    removedItems,
    changedItems,
  };
}

export async function applyBrowserSnapshot(
  snapshot: BrowserBookmarkSnapshot,
  strategy: BrowserBookmarkRestoreStrategy
): Promise<void> {
  if (strategy === 'skip' || !snapshot || !snapshot.length) {
    return;
  }

  if (!ChromeBookmarkService.isAvailable()) {
    throw new Error('Browser bookmarks API not available');
  }

  if (strategy === 'append') {
    await appendSnapshot(snapshot);
    return;
  }

  if (strategy === 'replace') {
    await replaceSnapshot(snapshot);
  }
}

function sanitizeNode(
  node: ChromeBookmark,
  metadataMap: Map<string, BrowserBookmarkMetadataPayload>
): BrowserBookmarkNodeSnapshot | null {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isFolder = hasChildren || (!node.url && Array.isArray(node.children));

  // 跳过分隔符等无法识别的节点
  if (!isFolder && !node.url) {
    return null;
  }

  const base: BrowserBookmarkNodeSnapshot = {
    title: node.title || (isFolder ? FALLBACK_FOLDER_NAME : FALLBACK_BOOKMARK_NAME),
    type: isFolder ? 'folder' : 'bookmark',
    dateAdded: node.dateAdded,
    dateGroupModified: node.dateGroupModified,
  };

  if (!isFolder && node.url) {
    base.url = node.url;
    const metadata = metadataMap.get(node.id);
    if (metadata) {
      base.metadata = {
        color: metadata.color,
        tags: metadata.tags,
        isPinned: metadata.isPinned,
        customTitle: metadata.customTitle,
        customOrder: metadata.customOrder,
        createdAt: metadata.createdAt,
        updatedAt: metadata.updatedAt,
      };
    }
  }

  if (Array.isArray(node.children) && node.children.length) {
    base.children = node.children
      .map((child) => sanitizeNode(child, metadataMap))
      .filter((child): child is BrowserBookmarkNodeSnapshot => child !== null);
  }

  return base;
}

function accumulateStats(node: BrowserBookmarkNodeSnapshot, stats: BrowserBookmarkStats) {
  if (node.type === 'folder') {
    stats.totalFolders += 1;
    node.children?.forEach((child) => accumulateStats(child, stats));
    return;
  }
  stats.totalBookmarks += 1;
}

function flattenSnapshot(snapshot: BrowserBookmarkSnapshot | null): FlatBookmarkEntry[] {
  if (!snapshot || !snapshot.length) {
    return [];
  }

  const entries: FlatBookmarkEntry[] = [];
  for (const branch of snapshot) {
    for (const node of branch.items) {
      collectEntries(node, branch.rootTitle || FALLBACK_FOLDER_NAME, entries);
    }
  }
  return entries;
}

function collectEntries(
  node: BrowserBookmarkNodeSnapshot,
  parentPath: string,
  entries: FlatBookmarkEntry[]
) {
  if (node.type === 'folder') {
    const folderPath = `${parentPath}/${node.title || FALLBACK_FOLDER_NAME}`;
    const key = `folder::${folderPath}`;
    entries.push({
      key,
      type: 'folder',
      path: folderPath,
      title: node.title || FALLBACK_FOLDER_NAME,
    });
    node.children?.forEach((child) => collectEntries(child, folderPath, entries));
    return;
  }

  const folderPath = parentPath;
  const title = node.title || node.url || FALLBACK_BOOKMARK_NAME;
  const key = `bookmark::${folderPath}/${title}`;
  const metadataSignature = JSON.stringify(node.metadata ?? null);
  entries.push({
    key,
    type: 'bookmark',
    path: folderPath,
    title,
    url: node.url,
    metadataSignature,
  });
}

async function appendSnapshot(snapshot: BrowserBookmarkSnapshot): Promise<void> {
  const tree = await ChromeBookmarkService.getBookmarks();
  const root = tree[0];
  const rootChildren = root?.children || [];
  const bookmarkBar = rootChildren.find((child) => child.id === '1') || rootChildren[0];
  const containerName = `${BACKUP_FOLDER_PREFIX} ${new Date().toLocaleString()}`;
  const containerFolder = await ChromeBookmarkService.createFolder(containerName, bookmarkBar?.id);
  const { setMetadata } = useBookmarkMetadataStore.getState();

  for (const branch of snapshot) {
    const branchFolder = await ChromeBookmarkService.createFolder(branch.rootTitle || FALLBACK_FOLDER_NAME, containerFolder.id);
    await recreateNodes(branch.items, branchFolder.id, setMetadata);
  }
}

async function replaceSnapshot(snapshot: BrowserBookmarkSnapshot): Promise<void> {
  const metadataStore = useBookmarkMetadataStore.getState();
  metadataStore.resetMetadata();
  const setMetadata = metadataStore.setMetadata;

  const tree = await ChromeBookmarkService.getBookmarks();
  const root = tree[0];
  const rootChildren = root?.children || [];

  for (const rootChild of rootChildren) {
    await clearFolderContents(rootChild.id);
  }

  for (const branch of snapshot) {
    const targetRoot =
      rootChildren.find((child) => child.id === branch.rootId) ||
      rootChildren.find((child) => child.title === branch.rootTitle) ||
      rootChildren[0];

    if (!targetRoot) {
      continue;
    }

    await recreateNodes(branch.items, targetRoot.id, setMetadata);
  }
}

async function clearFolderContents(folderId: string): Promise<void> {
  const children = await ChromeBookmarkService.getChildren(folderId);
  for (const child of children) {
    if (child.url) {
      await ChromeBookmarkService.deleteBookmark(child.id);
    } else {
      await ChromeBookmarkService.deleteFolder(child.id);
    }
  }
}

async function recreateNodes(
  nodes: BrowserBookmarkNodeSnapshot[],
  parentId: string,
  setMetadata: MetadataSetter
): Promise<void> {
  for (const node of nodes) {
    if (node.type === 'folder') {
      const folder = await ChromeBookmarkService.createFolder(node.title || FALLBACK_FOLDER_NAME, parentId);
      if (node.children && node.children.length) {
        await recreateNodes(node.children, folder.id, setMetadata);
      }
      continue;
    }

    if (!node.url) {
      continue;
    }

    const bookmark = await ChromeBookmarkService.addBookmark(node.title || node.url || FALLBACK_BOOKMARK_NAME, node.url, parentId);
    if (node.metadata) {
      setMetadata(bookmark.id, {
        color: node.metadata.color,
        tags: node.metadata.tags || [],
        isPinned: node.metadata.isPinned || false,
        customTitle: node.metadata.customTitle,
        customOrder: typeof node.metadata.customOrder === 'number' ? node.metadata.customOrder : 0,
        createdAt: node.metadata.createdAt,
        updatedAt: node.metadata.updatedAt,
      });
    }
  }
}
