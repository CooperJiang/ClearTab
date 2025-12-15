import type { Bookmark, Category, QuickLink, CustomRecentVisit } from './index';

export type BrowserBookmarkNodeType = 'folder' | 'bookmark';

export interface BrowserBookmarkMetadataPayload {
  color?: string;
  tags?: string[];
  isPinned?: boolean;
  customTitle?: string;
  customOrder?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface BrowserBookmarkNodeSnapshot {
  title: string;
  url?: string;
  type: BrowserBookmarkNodeType;
  children?: BrowserBookmarkNodeSnapshot[];
  dateAdded?: number;
  dateGroupModified?: number;
  metadata?: BrowserBookmarkMetadataPayload;
}

export interface BrowserBookmarkBranchSnapshot {
  rootId: string;
  rootTitle: string;
  items: BrowserBookmarkNodeSnapshot[];
}

export type BrowserBookmarkSnapshot = BrowserBookmarkBranchSnapshot[];

export interface SyncData {
  version: number;
  timestamp: number;
  settings: Record<string, unknown>;
  bookmarks: Bookmark[];
  quickLinks: QuickLink[];
  categories: Category[];
  customRecentVisits: CustomRecentVisit[];
  browserBookmarks?: BrowserBookmarkSnapshot;
}
