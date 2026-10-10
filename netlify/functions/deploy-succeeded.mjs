// Netlify runs this after every successful deploy. It sends a "new version" push only for production deploys
// whose version.json changed (song, lyric and Icon edits don't change it). See netlify/push-lib.mjs.
import { versionBroadcast } from '../push-lib.mjs';

export const handler = async (event) => {
  let p = {}; try { p = (JSON.parse(event.body || '{}') || {}).payload || {}; } catch {}
  if (p.context && p.context !== 'production') return { statusCode: 200, body: `skipped (${p.context})` };
  try { console.log('treesh version push', JSON.stringify(await versionBroadcast(p.deploy_ssl_url || p.ssl_url || p.url))); }
  catch (e) { console.error('treesh version push failed', e); }
  return { statusCode: 200, body: 'ok' };
};
