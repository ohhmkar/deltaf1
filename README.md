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

### 4. The Grid

- **Team Lineups** — Current season driver/team pairings
- **Driver Stats** — Career statistics including wins, poles, and world titles
- **Team Stats** — Constructor career achievements

### 5. Telemetry

- _Yet to be implemented_

## Tech Stack

- **Frontend:** React 19, TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Font Awesome
- **API:** [Ergast F1 API](http://ergast.com/mrd/) (via jolpi.ca mirror)

## Project Structure

```
delta-f1/
├── index.tsx              # App entry point
├── index.html             # HTML template
├── src/
│   ├── components/
│   │   ├── shared/        # Navbar, TeamLogo, Flag
│   │   └── views/         # Dashboard, Standings, Season, Grid, Telemetry
│   ├── services/          # API functions
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

## Author

Made with <3 by [@ohhmkar](https://github.com/ohhmkar)
