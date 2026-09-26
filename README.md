# DeltaF1

A modern Formula 1 dashboard built with React and TypeScript.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)

Track live standings, explore race calendars, compare drivers, and dive into career statistics, all in a sleek, dark-themed interface.

## Features

### 1. Dashboard

- Live championship standings overview
- Current season highlights
- Quick navigation to detailed views

### 2. Standings

- **Drivers Championship** — Full driver standings with points, wins, and team info
- **Constructors Championship** — Team rankings with detailed statistics
- **Teammate Battles** — Head-to-head comparisons within each team
- **Driver Comparison** — Select up to 5 drivers to compare performance across the season
- Historical data from 1950 to present

### 3. Season Calendar

- Complete race schedule with dates and circuits
- Race results and session times
- Circuit information with country flags
- Year selector to browse historical seasons
- Calendar state lives in the URL (`/season?year=&round=`), so refresh, back and shared links keep it

### 4. Race Weekend

Open any race from the calendar for a broadcast-style race page:

- **Podium** and a compact **results table** (grid places gained/lost, laps-down for lapped cars), all behind one spoiler cover
- **Race at a glance** — winner margin, pole, fastest lap and other headline facts
- **Sessions** — qualifying, sprint and race tabs
- **Championship** — driver and constructor standings after the round, with gains
- **Analysis** — tyre strategy, lap-by-lap position chart and pit stop breakdown (from OpenF1)
- **Circuit history** — past winners coloured by their team at the time
- **Preview** for upcoming races — schedule, countdown and last year's podium
- Sticky header with previous/next race navigation

### 5. The Grid

- **Team Lineups** — Current season driver/team pairings
- **Driver Stats** — Career statistics including wins, poles, and world titles
- **Team Stats** — Constructor career achievements

### 6. Replay

- **Live Race Replay** — Scrub or play back any race on a track map, driven by live position telemetry
- **Running Order Tower** — Real-time leaderboard with gap-to-leader, tyre compound, and DNF detection
- **Race Control Feed** — Flags and messages synced to the replay timeline
- 2D/3D track view with adjustable playback speed
- Season and session selector for historical races
- Click two drivers to compare their live gap; keyboard controls (Space, ←/→, 1–5)
- Shareable links to a moment: `/replay?year=&race=&t=`

### Spoiler-free mode

The eye icon in the navbar blurs results behind click-to-reveal across the app (remembered per browser).

### OpenF1 live-session lockout

OpenF1 blocks public access while an F1 session is live. The OpenF1-backed views (Replay, strategy, lap chart) show which session is live and roughly when access returns, instead of failing silently.

## Tech Stack

- **Frontend:** React 19, TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Font Awesome
- **API:** [Ergast F1 API](http://ergast.com/mrd/) (via jolpi.ca mirror) for standings/calendar, [OpenF1](https://openf1.org/) for live replay telemetry

## Project Structure

```
delta-f1/
├── index.tsx              # App entry point
├── index.html             # HTML template
├── src/
│   ├── components/
│   │   ├── shared/        # Navbar, Tabs, Modal, Spoiler, LiveLockNotice, ...
│   │   └── views/         # Dashboard, Standings, Season, Grid, Replay
│   │       └── race/      # Race weekend page and its sections
│   ├── services/          # Ergast/jolpi + OpenF1 API, caching
│   ├── data/              # Generated data (championsHistory.json)
│   ├── types/             # TypeScript interfaces
│   └── utils/             # Helper functions (team colors, country codes, etc.)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Run Locally

**Prerequisites:** Node.js 18+

1. **Clone the repository**

   ```bash
   git clone https://github.com/ohhmkar/delta-f1.git
   cd delta-f1
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

`npm run build` type-checks (`tsc --noEmit`) before building, so type errors fail the build.

## Updating generated data

`src/data/championsHistory.json` (drivers'/constructors' titles plus career wins and poles, shown on The Grid) is generated, not hand-maintained — jolpi.ca has no cheap endpoint for these, so they're computed once by walking every season. Only the season in progress is added live. Re-run it once a season, after the finale:

```bash
node scripts/generate-champions.mjs
```

## Author

Made with <3 by [@ohhmkar](https://github.com/ohhmkar)
