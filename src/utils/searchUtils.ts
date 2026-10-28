export function buildSearchUrl(engineUrl: string, query: string): string {
  const encodedQuery = encodeURIComponent(query.trim());
  return engineUrl.includes('%s')
    ? engineUrl.replaceAll('%s', encodedQuery)
    : engineUrl + encodedQuery;
}
