// Treesh M.A.D. weekly link check (Netlify Scheduled Function): Mondays 9:00 AM Eastern, emails only when links are broken.
// Netlify cron runs in UTC, so it fires at 13:00 and 14:00 UTC and only works the run that lands on 9 AM in New York (handles daylight saving).
import { linkReport } from './github.mjs';

export default async () => {
  const hour = +new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' }).format(new Date());
  if (hour !== 9) return new Response('skip', { status: 200 });
  const r = await linkReport();
  console.log(`link-check: ${r.checked}/${r.total} checked, ${r.problems.length} problems (${r.fresh} new), emailed: ${r.emailed ? r.emailed.ok : 'no'}`);
  return new Response('ok', { status: 200 });
};

export const config = { schedule: '0 13,14 * * 1' };
