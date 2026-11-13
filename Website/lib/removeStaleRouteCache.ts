import { rm } from 'fs/promises';
import path from 'path';

// Pages cached on disk by an earlier deployment take precedence over the current build
// and reference static chunks that no longer exist. Remove them before serving requests.
export async function removeStaleRouteCache() {
  await rm(path.join(process.cwd(), '.next', 'server', 'route-cache'), { recursive: true, force: true });
}
