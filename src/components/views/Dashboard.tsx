import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { fetchData } from "../../services/api";
import { getTeamHex, formatDateLocal } from "../../utils/helpers";
import { TeamLogo, Flag, SkeletonCard, SkeletonList } from "../shared";
import type { Race, DriverStanding, ConstructorStanding } from "../../types";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [lastRace, setLastRace] = useState<Race | null>(null);
  const [standings, setStandings] = useState<{
    drivers: DriverStanding[];
    constructors: ConstructorStanding[];
  } | null>(null);
  const [seasonProgress, setSeasonProgress] = useState({
    completed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState<string>("");
  const [onThisDay, setOnThisDay] = useState<string | null>(null);

  const loadData = useCallback(async (force = false) => {
    const opts = { useCache: !force };
    const [data, dData, cData] = await Promise.all([
      fetchData("/current.json", opts),
      fetchData("/current/driverStandings.json", opts),
      fetchData("/current/constructorStandings.json", opts),
    ]);
    if (data) {
      const races: Race[] = data.RaceTable.Races;
      const now = new Date();
      const upcoming = races.find((r) => {
        if (!r.date || !r.time) return false;
        return new Date(`${r.date}T${r.time}`) > now;
      });
      const past = [...races].reverse().find((r) => {
        if (!r.date || !r.time) return false;
        return new Date(`${r.date}T${r.time}`) < now;
      });

      const completedRaces = races.filter((r) => {
        if (!r.date || !r.time) return false;
        return new Date(`${r.date}T${r.time}`) < now;
      }).length;
      setSeasonProgress({ completed: completedRaces, total: races.length });

      setNextRace(upcoming || null);

      if (past) {
        const resultsData = await fetchData(
          `/${past.season}/${past.round}/results.json`,
          opts,
        );
        if (resultsData && resultsData.RaceTable.Races[0]) {
          setLastRace(resultsData.RaceTable.Races[0]);
        }
      }

      setStandings({
        drivers:
          dData?.StandingsTable?.StandingsLists[0]?.DriverStandings.slice(
            0,
            5,
          ) || [],
        constructors:
          cData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings.slice(
            0,
            5,
          ) || [],
      });
      const facts = [
        "The first Formula 1 World Championship race was held at Silverstone in 1950.",
        "Ferrari is the only team to have competed in every Formula 1 World Championship season since 1950.",
        "Lewis Hamilton and Michael Schumacher share the record for seven Drivers' World Championships.",
        "Juan Manuel Fangio won five Formula 1 World Championships.",
        "Alain Prost won four Formula 1 World Championships.",
        "Sebastian Vettel won four consecutive World Championships from 2010 to 2013.",
        "Max Verstappen won four consecutive World Championships from 2021 to 2024.",
        "Lando Norris won his first Formula 1 World Championship in 2025.",
        "Michael Schumacher won five consecutive World Championships from 2000 to 2004.",
        "Sebastian Vettel became the youngest Formula 1 World Champion in 2010.",
        "Fernando Alonso became the youngest Formula 1 World Champion in 2005.",
        "Max Verstappen became the youngest driver to win a Formula 1 Grand Prix.",
        "Max Verstappen won his first Formula 1 Grand Prix at the 2016 Spanish Grand Prix.",
        "Lewis Hamilton made his Formula 1 debut with McLaren in 2007.",
        "Max Verstappen made his Formula 1 debut with Toro Rosso in 2015.",
        "Kimi Räikkönen is famously known as 'The Iceman'.",
        "Kimi Räikkönen won the 2007 World Championship with Ferrari.",
        "Jenson Button won the 2009 World Championship with Brawn GP.",
        "Brawn GP won both the Drivers' and Constructors' Championships in its only season.",
        "Nico Rosberg won the 2016 World Championship before retiring from Formula 1.",
        "Nico Rosberg is the son of 1982 World Champion Keke Rosberg.",
        "Damon Hill is the son of two-time World Champion Graham Hill.",
        "Graham Hill is the only driver to have won the Triple Crown of Motorsport.",
        "Graham Hill won the Monaco Grand Prix five times.",
        "Ayrton Senna won the Monaco Grand Prix six times.",
        "Michael Schumacher won the Monaco Grand Prix five times.",
        "Ferrari made its Formula 1 debut at the 1950 Monaco Grand Prix.",
        "McLaren made its Formula 1 debut at the 1966 Monaco Grand Prix.",
        "Williams made its Formula 1 debut in 1977.",
        "Brawn GP was created after Honda withdrew from Formula 1 at the end of 2008.",
        "Red Bull Racing won its first Constructors' Championship in 2010.",
        "Red Bull Racing won its first Drivers' Championship with Sebastian Vettel in 2010.",
        "Mercedes won eight consecutive Constructors' Championships from 2014 to 2021.",
        "The McLaren MP4/4 won 15 of the 16 races during the 1988 season.",
        "Ayrton Senna won eight races during the 1988 season.",
        "Alain Prost won seven races during the 1988 season.",
        "The 1988 McLaren MP4/4 was powered by a Honda turbocharged V6 engine.",
        "The 1982 World Championship was won by Keke Rosberg after he won only one race.",
        "Jack Brabham is the only driver to win the World Championship in a car bearing his own name.",
        "Gilles Villeneuve won six Formula 1 races during his career.",
        "Jos Verstappen competed in Formula 1 before his son Max Verstappen.",
        "Michael Schumacher's son Mick Schumacher also competed in Formula 1.",
        "The Monaco Grand Prix is one of the most famous street races in the world.",
        "The Monaco Grand Prix is held on a temporary street circuit through Monte Carlo.",
        "The Circuit de Monaco features one of the slowest corners in Formula 1.",
        "Monza is known by the nickname 'The Temple of Speed'.",
        "The Italian Grand Prix is traditionally held at Monza.",
        "Monza is one of the fastest circuits in Formula 1.",
        "The Belgian Grand Prix is traditionally held at Spa-Francorchamps.",
        "Spa-Francorchamps features the famous Eau Rouge and Raidillon section.",
        "The Japanese Grand Prix is traditionally held at Suzuka.",
        "Suzuka is famous for its unique figure-eight layout.",
        "The Singapore Grand Prix was the first Formula 1 night race.",
        "The Singapore Grand Prix was first held in 2008.",
        "The Las Vegas Grand Prix returned to Formula 1 in 2023.",
        "The United States Grand Prix is traditionally held at the Circuit of the Americas.",
        "The Brazilian Grand Prix is traditionally held at Interlagos.",
        "Interlagos is one of Formula 1's famous anti-clockwise circuits.",
        "Silverstone was originally a World War II airfield.",
        "The Australian Grand Prix has been held at Albert Park in Melbourne.",
        "The Canadian Grand Prix is held at the Circuit Gilles Villeneuve.",
        "The Circuit Gilles Villeneuve is named after Canadian driver Gilles Villeneuve.",
        "The Hungarian Grand Prix was the first Formula 1 race held behind the Iron Curtain.",
        "The Hungarian Grand Prix was first held at the Hungaroring in 1986.",
        "The Dutch Grand Prix returned to Formula 1 at Zandvoort in 2021.",
        "Zandvoort is famous for its heavily banked corners.",
        "The Mexican Grand Prix is held at the Autódromo Hermanos Rodríguez.",
        "The Mexican circuit is named after racing brothers Ricardo and Pedro Rodríguez.",
        "The Abu Dhabi Grand Prix was first held in 2009.",
        "The Abu Dhabi Grand Prix takes place at the Yas Marina Circuit.",
        "The Bahrain Grand Prix joined the Formula 1 calendar in 2004.",
        "The Bahrain Grand Prix was the first Formula 1 race held in the Middle East.",
        "The Chinese Grand Prix first appeared on the Formula 1 calendar in 2004.",
        "The Shanghai International Circuit was designed by Hermann Tilke.",
        "The Nürburgring Nordschleife was once used for the German Grand Prix.",
        "The Nürburgring Nordschleife is famously known as the 'Green Hell'.",
        "The 1957 German Grand Prix is considered one of Juan Manuel Fangio's greatest races.",
        "The 1976 Japanese Grand Prix helped decide the World Championship between James Hunt and Niki Lauda.",
        "Niki Lauda retired from the 1976 Japanese Grand Prix because of the dangerous wet conditions.",
        "The 1991 Brazilian Grand Prix was Ayrton Senna's first Formula 1 victory in his home country.",
        "The 1992 Monaco Grand Prix featured a famous defensive drive by Ayrton Senna.",
        "The 1996 Monaco Grand Prix was won by Olivier Panis.",
        "Only three drivers were classified at the 1996 Monaco Grand Prix.",
        "The 2005 United States Grand Prix was contested by only six cars because of a tyre safety dispute.",
        "The 2011 Canadian Grand Prix became the longest Formula 1 race by elapsed time.",
        "The 2011 Canadian Grand Prix lasted more than four hours because of rain and interruptions.",
        "The 2021 Belgian Grand Prix awarded half points after only a few laps behind the Safety Car.",
        "The 2021 Abu Dhabi Grand Prix decided the World Championship on the final lap.",
        "Max Verstappen won the 2021 World Championship after overtaking Lewis Hamilton on the final lap.",
        "The 2022 season introduced a major aerodynamic regulation change.",
        "Ground-effect aerodynamics returned to Formula 1 in 2022.",
        "Porpoising became a major issue when ground-effect aerodynamics returned in 2022.",
        "The FIA is the governing body responsible for Formula 1.",
        "FIA stands for Fédération Internationale de l'Automobile.",
        "Formula 1 introduced the Halo cockpit protection system in 2018.",
        "The Halo is designed to protect a driver's head from large objects and impacts.",
        "Modern Formula 1 cars use carbon-fibre survival cells to protect drivers.",
        "Modern Formula 1 cars use turbocharged V6 hybrid power units.",
        "Formula 1 introduced its current hybrid power-unit era in 2014.",
        "The MGU-K recovers energy generated during braking.",
        "The MGU-H was a heat-energy recovery system used in Formula 1 hybrid power units before being removed for the 2026 regulations.",
        "DRS stands for Drag Reduction System.",
        "DRS was introduced into Formula 1 in 2011.",
        "DRS reduces aerodynamic drag by opening a section of the rear wing.",
        "Formula 1 cars can generate enormous amounts of aerodynamic downforce.",
        "Formula 1 teams use wind tunnels to develop aerodynamic components.",
        "Formula 1 pit crews can change all four tyres in around two seconds.",
        "Pirelli has been Formula 1's exclusive tyre supplier since 2011.",
        "Intermediate tyres are designed for damp or lightly wet conditions.",
        "Full wet tyres are designed for races with significant standing water.",
        "Formula 1 drivers can adjust numerous car settings from their steering wheels.",
        "Formula 1 drivers experience several times their body weight in G-forces during some corners and braking zones.",
        "F1 drivers undergo specialized neck training to handle high G-forces.",
        "Formula 1 cars use carbon-carbon brake discs.",
        "F1 brakes can reach extremely high temperatures during heavy braking.",
        "The steering wheel of a Formula 1 car can be removed to allow the driver to exit the cockpit quickly.",
        "The Safety Car is deployed when race conditions require drivers to slow down.",
        "The Virtual Safety Car was introduced to neutralize races without deploying a physical Safety Car.",
        "A red flag can stop a Formula 1 session or race because of dangerous conditions.",
        "The chequered flag signals the end of a Formula 1 session or race.",
        "Pole position is awarded to the driver who sets the fastest qualifying time.",
        "Qualifying determines the starting order for a Formula 1 Grand Prix.",
        "The Drivers' Championship is awarded to the driver who scores the most points over a season.",
        "The Constructors' Championship combines the points scored by both drivers of each team.",
        "Formula 1 introduced Sprint races in 2021.",
        "Sprint races are shorter races held during selected Formula 1 weekends.",
        "A normal Formula 1 Grand Prix victory is worth 25 championship points.",
        "A second-place finish in a normal Grand Prix is worth 18 points.",
        "A third-place finish in a normal Grand Prix is worth 15 points.",
        "Formula 1 cars are built around a protective survival cell.",
        "Formula 1 cars use extensive telemetry to send data to their teams.",
        "Teams monitor tyre temperatures, brake temperatures, engine parameters, and aerodynamic data during races.",
        "Formula 1 engineers communicate with drivers through team radio.",
        "An F1 pit lane has a strict speed limit for safety.",
        "Drivers can receive grid penalties for exceeding their allocated power-unit or gearbox components.",
        "Formula 1 teams use simulations extensively before arriving at a Grand Prix.",
        "Weather forecasts can play a major role in Formula 1 race strategy.",
        "An undercut involves pitting before a rival to attempt to gain track position with fresher tyres.",
        "An overcut involves staying out longer than a rival to gain an advantage.",
        "Karting is one of the most common starting points for professional Formula 1 drivers.",
        "Many Formula 1 drivers compete in Formula 2 before reaching Formula 1.",
        "Formula 2 is one of the main developmental categories below Formula 1.",
        "Formula 3 is another important step in the traditional single-seater racing ladder.",
        "Drivers need an FIA Super Licence to compete in Formula 1.",
        "Formula 1 teams can have thousands of employees working behind the scenes.",
        "Race engineers help drivers optimize their cars during practice, qualifying, and races.",
        "The team principal leads the overall operation of a Formula 1 team.",
        "F1 teams continuously develop their cars throughout a season.",
        "Small aerodynamic changes can produce significant differences in Formula 1 car performance.",
        "A Formula 1 car can contain thousands of individual components.",
        "F1 teams manufacture many of their own aerodynamic and mechanical components.",
        "Formula 1 has used four-cylinder, V6, V8, V10, and V12 engines throughout its history.",
        "V10 engines powered many iconic Formula 1 cars during the late 1990s and early 2000s.",
        "Formula 1 has used both turbocharged and naturally aspirated engines throughout its history.",
        "Active suspension was banned from Formula 1 in the early 1990s.",
        "Electronic driver aids have been heavily regulated throughout Formula 1 history.",
        "Formula 1 regulations have changed repeatedly to improve safety and competition.",
        "Modern Formula 1 safety standards are dramatically more advanced than those used in the 1950s.",
        "The FIA investigates serious incidents to help improve future safety standards.",
        "Formula 1 cars have evolved from front-engine machines of the 1950s to modern hybrid racing cars.",
        "Formula 1 technology has influenced developments in road-car engineering.",
        "Energy recovery technology developed in motorsport has influenced hybrid automotive technology.",
        "Aerodynamic research from Formula 1 has applications outside motorsport.",
        "Formula 1 teams use data from previous races to predict tyre degradation and strategy.",
        "Formula 1 drivers can lose significant amounts of body weight through sweating during hot races.",
        "F1 drivers wear fire-resistant suits and protective equipment during races.",
        "Formula 1 helmets must meet strict FIA safety standards.",
        "Modern Formula 1 circuits use run-off areas and energy-absorbing barriers to improve safety.",
        "Formula 1 has raced on permanent circuits, temporary street circuits, and converted airfields.",
        "The Monaco Grand Prix is particularly difficult to overtake at because of its narrow layout.",
        "A small mistake at Monaco can result in a driver hitting the barriers.",
        "Spa-Francorchamps is known for unpredictable weather conditions.",
        "Monza's long straights make low aerodynamic drag particularly valuable.",
        "Suzuka's high-speed corners make aerodynamic balance especially important.",
        "Singapore is known as one of the most physically demanding races because of its heat and humidity.",
        "The Formula 1 season has included races on multiple continents.",
        "Formula 1 has raced in more than 30 different countries throughout its history.",
        "The Netflix series Drive to Survive premiered in 2019.",
        "Drive to Survive helped introduce Formula 1 to a much larger global audience.",
        "Formula 1 team radio has become a major part of modern F1 broadcasts.",
        "The phrase 'box, box' is commonly used by teams to tell drivers to enter the pit lane.",
        "A Formula 1 Grand Prix normally covers more than 300 kilometers.",
        "The Monaco Grand Prix is shorter than the standard Formula 1 race distance.",
        "A Formula 1 race is normally limited to a maximum elapsed time of three hours.",
        "A driver must complete a required percentage of the race distance to be classified.",
        "Formula 1 has continuously evolved its technical regulations throughout its history.",
        "Formula 1 is one of the world's most technologically advanced forms of motorsport.",
      ];
      setOnThisDay(facts[Math.floor(Math.random() * facts.length)]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadData();
      setLoading(false);
    };
    load();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!nextRace || !nextRace.date || !nextRace.time) return;
    const interval = setInterval(() => {
      const raceDate = new Date(`${nextRace.date}T${nextRace.time}`);
      const now = new Date();
      if (isNaN(raceDate.getTime())) {
        setCountdown("TBA");
        return;
      }
      const diff = raceDate.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("STARTED");
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${d}D ${h}H ${m}M ${s}S`);
    }, 1000);
    return () => clearInterval(interval);
  }, [nextRace]);

  if (loading)
    return (
      <div className="p-6 md:p-16 max-w-7xl mx-auto fade-in pb-24 md:pb-12 h-screen overflow-y-auto">
        <header className="mb-12 border-b border-neutral-800 dark:border-neutral-800 pb-6">
          <div className="h-8 w-32 bg-neutral-800 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-neutral-800 rounded animate-pulse"></div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SkeletonCard className="min-h-[300px]" />
          <div className="flex flex-col gap-6">
            <SkeletonCard className="flex-1" />
            <SkeletonCard className="min-h-[120px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );

  return (
    <div className="p-6 md:p-16 max-w-7xl mx-auto fade-in pb-24 md:pb-12 h-screen overflow-y-auto">
      <header className="mb-12 border-b border-neutral-800 dark:border-neutral-800 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-white dark:text-white mb-1">
              Dashboard
            </h1>
            <p className="text-neutral-500 dark:text-neutral-500 text-sm">
              Overview of the current F1 Season
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all disabled:opacity-50"
            title="Refresh data"
          >
            <i
              className={`fas fa-sync-alt ${refreshing ? "animate-spin" : ""}`}
            ></i>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="minimal-card p-8 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                <h2 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                  Up Next
                </h2>
              </div>
              {nextRace && (
                <span className="text-xs font-mono text-neutral-500">
                  R{nextRace.round}
                </span>
              )}
            </div>
            {nextRace ? (
              <>
                <h3 className="text-3xl font-medium text-white mb-2">
                  {nextRace.raceName}
                </h3>
                <p className="text-lg text-neutral-400 font-light flex items-center">
                  {nextRace.Circuit.circuitName}
                </p>
                <div className="mt-2 text-sm text-neutral-500 flex items-center">
                  <Flag
                    country={nextRace.Circuit.Location.country}
                    className="w-5 h-auto mr-2 rounded-[2px]"
                  />
                  {nextRace.Circuit.Location.locality},{" "}
                  {nextRace.Circuit.Location.country}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 text-xs font-mono text-neutral-400 border-t border-neutral-800/50 pt-4">
                  {nextRace.FirstPractice && (
                    <div className="flex justify-between">
                      <span>FP1</span>
                      <span className="text-white">
                        {formatDateLocal(
                          nextRace.FirstPractice.date,
                          nextRace.FirstPractice.time,
                        )}
                      </span>
                    </div>
                  )}
                  {nextRace.Sprint && (
                    <div className="flex justify-between text-yellow-500">
                      <span>Sprint</span>
                      <span className="text-white">
                        {formatDateLocal(
                          nextRace.Sprint.date,
                          nextRace.Sprint.time,
                        )}
                      </span>
                    </div>
                  )}
                  {nextRace.Qualifying && (
                    <div className="flex justify-between text-neutral-300">
                      <span>Quali</span>
                      <span className="text-white">
                        {formatDateLocal(
                          nextRace.Qualifying.date,
                          nextRace.Qualifying.time,
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-red-500">
                    <span>Race</span>
                    <span className="text-white">
                      {formatDateLocal(nextRace.date, nextRace.time)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-neutral-500">Season Completed</div>
            )}
          </div>
          {nextRace && (
            <div className="mt-8">
              <div className="text-4xl md:text-5xl font-mono text-white tracking-tighter">
                {countdown}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="minimal-card p-6 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                Previous Race
              </h2>
              <button
                onClick={() => navigate("/season")}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                View Details &rarr;
              </button>
            </div>
            {lastRace && lastRace.Results ? (
              <div>
                <h3 className="text-xl font-medium text-white mb-6">
                  {lastRace.raceName}
                </h3>
                <div className="space-y-4">
                  {lastRace.Results.slice(0, 3).map((res) => (
                    <div
                      key={res.position}
                      className="flex items-center justify-between relative"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="font-mono text-neutral-600 text-sm w-4">
                          {res.position}
                        </span>
                        <div className="relative group/tooltip">
                          <div className="cursor-help">
                            <div className="text-sm font-medium text-neutral-200 flex items-center group-hover/tooltip:text-white transition-colors">
                              <Flag
                                country={res.Driver.nationality}
                                className="w-3.5 h-auto mr-2 opacity-75"
                              />
                              {res.Driver.givenName} {res.Driver.familyName}
                            </div>
                            <div className="text-xs text-neutral-500 flex items-center mt-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full mr-2"
                                style={{
                                  backgroundColor: getTeamHex(
                                    res.Constructor.constructorId,
                                  ),
                                }}
                              ></span>
                              {res.Constructor.name}
                            </div>
                          </div>

                          {/* Detailed Stats Tooltip */}
                          <div className="absolute bottom-full left-0 mb-2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl p-3 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 backdrop-blur-md">
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                              <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">
                                Race Data
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400">
                                R{lastRace.round}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                              <div>
                                <div className="text-[9px] text-neutral-500 uppercase mb-0.5">
                                  Grid Start
                                </div>
                                <div className="text-xs text-white font-mono">
                                  P{res.grid}
                                </div>
                              </div>
                              <div>
                                <div className="text-[9px] text-neutral-500 uppercase mb-0.5">
                                  Fastest Lap
                                </div>
                                <div className="text-xs text-white font-mono">
                                  {res.FastestLap?.Time?.time || "-"}
                                </div>
                              </div>
                              <div>
                                <div className="text-[9px] text-neutral-500 uppercase mb-0.5">
                                  Points
                                </div>
                                <div className="text-xs text-yellow-500 font-mono font-bold">
                                  +{res.points}
                                </div>
                              </div>
                              <div>
                                <div className="text-[9px] text-neutral-500 uppercase mb-0.5">
                                  Status
                                </div>
                                <div className="text-xs text-neutral-300 font-mono truncate">
                                  {res.status}
                                </div>
                              </div>
                            </div>
                            {/* Arrow */}
                            <div className="absolute -bottom-1 left-4 w-2 h-2 bg-neutral-900 border-r border-b border-neutral-700 transform rotate-45"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-neutral-400">
                          {res.Time?.time || "N/A"}
                        </div>
                        <div className="text-[10px] text-neutral-600">
                          +{res.points} PTS
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-neutral-500 text-sm">No data available</div>
            )}
          </div>

          <div className="minimal-card p-5 border-neutral-800 bg-neutral-900/20 relative overflow-hidden flex flex-col justify-center min-h-[120px]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <i className="fas fa-history text-4xl"></i>
            </div>
            <h2 className="text-xs font-mono uppercase text-neutral-400 tracking-wider mb-2">
              Did You Know?
            </h2>
            {onThisDay ? (
              <p className="text-xs text-neutral-300 leading-relaxed font-light italic">
                "{onThisDay}"
              </p>
            ) : (
              <div className="h-10 flex items-center">
                <div className="loader w-4 h-4"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
        <div className="minimal-card p-6">
          <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Top Drivers
            </h3>
            <button
              onClick={() => navigate("/standings")}
              className="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              View All &rarr;
            </button>
          </div>
          <div className="space-y-3">
            {standings?.drivers.map((d) => (
              <div
                key={d.Driver.driverId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono text-neutral-500 w-4">
                    {d.position}
                  </span>
                  <div className="flex items-center">
                    <div
                      className="w-1 h-6 rounded-full mr-2"
                      style={{
                        backgroundColor: getTeamHex(
                          d.Constructors[0]?.constructorId || "",
                        ),
                      }}
                    ></div>
                    <div>
                      <div className="text-sm text-neutral-200 font-medium leading-none flex items-center">
                        {d.Driver.code}
                        <Flag
                          country={d.Driver.nationality}
                          className="ml-2 w-3 h-auto opacity-50"
                        />
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {d.wins} Wins
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-mono text-white font-bold">
                  {d.points}
                </div>
              </div>
            ))}
            {!standings && (
              <div className="text-neutral-600 text-xs">
                Loading standings...
              </div>
            )}
          </div>
        </div>

        <div className="minimal-card p-6">
          <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Top Teams
            </h3>
            <button
              onClick={() => navigate("/standings")}
              className="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              View All &rarr;
            </button>
          </div>
          <div className="space-y-3">
            {standings?.constructors.map((c) => (
              <div
                key={c.Constructor.constructorId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono text-neutral-500 w-4">
                    {c.position}
                  </span>
                  <div className="flex items-center">
                    <TeamLogo
                      constructorId={c.Constructor.constructorId}
                      name={c.Constructor.name}
                    />
                    <div className="ml-2">
                      <div className="text-sm text-neutral-200 font-medium leading-none">
                        {c.Constructor.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {c.wins} Wins
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-mono text-white font-bold">
                  {c.points}
                </div>
              </div>
            ))}
            {!standings && (
              <div className="text-neutral-600 text-xs">
                Loading standings...
              </div>
            )}
          </div>
        </div>

        <div className="minimal-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-6">
              Season Progress
            </h3>
            <div className="flex items-end space-x-2 mb-2">
              <span className="text-4xl font-mono text-white tracking-tighter">
                {seasonProgress.completed}
              </span>
              <span className="text-sm text-neutral-500 mb-1">
                / {seasonProgress.total} Races
              </span>
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-2 mb-6">
              <div
                className="bg-white h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${
                    seasonProgress.total
                      ? (seasonProgress.completed / seasonProgress.total) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              We are{" "}
              {seasonProgress.total
                ? Math.round(
                    (seasonProgress.completed / seasonProgress.total) * 100,
                  )
                : 0}
              % through the {new Date().getFullYear()} season.
              {nextRace
                ? ` The next round is at ${nextRace.Circuit.Location.locality}.`
                : " The season has concluded."}
            </p>
          </div>
          <button
            onClick={() => navigate("/season")}
            className="mt-4 w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs rounded transition-colors border border-neutral-800"
          >
            View Full Calendar
          </button>
        </div>
      </div>
    </div>
  );
};
