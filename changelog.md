# CHANGELOG

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
