export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { removeStaleRouteCache } = await import('./lib/removeStaleRouteCache');
    await removeStaleRouteCache();
  }
}
