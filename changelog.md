# CHANGELOG

## Sun 30/08/26 Ver 1.6.1

- Grid and Standings sub-tabs are now nested routes (`/grid/drivers`, `/grid/teams`, `/standings/constructors`, `/standings/teammate`) instead of local `useState` - deep-linkable and back-button-able

## Sun 30/08/26 Ver 1.6

- Added react-router: each tab is now a real URL (`/standings`, `/season`, `/grid`, `/replay`) instead of in-memory `useState` - deep links, back/forward, and refresh all work now
- Dashboard's internal nav buttons use `useNavigate()` instead of a passed-down `onNavigate` prop
- `vercel.json` rewrites all paths to `index.html` so direct/refreshed navigation to a route works in production

## Sun 30/08/26 Ver 1.5

- Self-hosted current team logos (`public/logos/`) instead of hotlinking formula1.com's CDN, whose paths/slugs it turns out change per season/rebrand without notice; fixed broken RB and Haas logos and added Audi's in the process
- Replaced the hardcoded `championships: 0` stat with real counts computed by `scripts/generate-champions.mjs` (jolpi.ca has no lifetime-titles endpoint, so this walks each season once and is checked in as `src/data/championsHistory.json` - re-run once a season)
- Navbar version now reads from `package.json` (`__APP_VERSION__`) instead of being hand-typed

## Sun 30/08/26 Ver 1.4

- Removed the "Under Dev" Telemetry stub tab; Replay already covers race telemetry
- Deleted dead code: unused `useTheme`/`useApi` hooks, unused Ergast telemetry fetchers, unused `@google/genai` dependency
- Dashboard now fetches its 3 initial requests in parallel and uses the API cache (previously bypassed it on every load); refresh button forces a fresh fetch
- Replaced the Tailwind CDN `<script>` with a real build-time Tailwind (via `@tailwindcss/vite`) — no more shipping the JIT compiler to the browser

## Sun 21/12/25 Ver 1.3

- Added season/race selector with on-demand data loading
- Created API caching system with 5-min expiry to reduce redundant requests
- Enhanced API service with retry logic and exponential backoff
- Added ErrorBoundary component for graceful error handling
- Created Toast notification system with success/error/warning/info types
- Added skeleton loading components (Card, Table, List, Text)
- Built comparison chart components (ComparisonBar, RadarChart)
- Created useApi hook for consistent data fetching patterns
- Added theme toggle hook for future dark/light mode support

## Wed 10/12/25. Ver 1.2

- Implemented component structure and compressed code.
- Added dropdown in season tab such that you can select all previous years.
- Removed Archive Search [ Will be implemented later ]
- Combined grid and teams tab and fixed grid stats no.of titles API call

## Wed 10/12/25 Ver 1.2.1

- Tried to fix rate limiting again, titles set to zero for now
