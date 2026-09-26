export const getTeamHex = (constructorId: string): string => {
  const colors: Record<string, string> = {
    red_bull: "#3671C6",
    ferrari: "#E80020",
    mercedes: "#27F4D2",
    mclaren: "#FF8000",
    aston_martin: "#229971",
    alpine: "#0093CC",
    williams: "#64C4FF",
    rb: "#6692FF",
    kick_sauber: "#52E252",
    audi: "#52E252",
    haas: "#B6BABD",
    alphatauri: "#041F3D",
    alpha_tauri: "#041F3D",
    alfa: "#C92D4B",
    racing_point: "#F596C8",
    renault: "#FFF500",
    toro_rosso: "#469BFF",
    force_india: "#F596C8",
    manor: "#323232",
    marussia: "#6E0000",
    caterham: "#005030",
    lotus_f1: "#E5C253",
    lotus_racing: "#004225",
    hrt: "#A6904F",
    virgin: "#CF2220",
    brawn: "#B8FD6E",
    bmw_sauber: "#FFFFFF",
    toyota: "#E31D2B",
    super_aguri: "#DA3638",
    spyker: "#FF7F00",
    honda: "#CD0000",
    midland: "#808080",
    bar: "#FFFFFF",
    jordan: "#FFEC00",
    minardi: "#000000",
    jaguar: "#004225",
    arrows: "#FFA500",
    prost: "#0000FF",
    benetton: "#7FBCFF",
    sauber: "#006EFF",
    tyrrell: "#0000FF",
    stewart: "#FFFFFF",
    ligier: "#2635C7",
    footwork: "#D63445",
    larrousse: "#224A64",
    brabham: "#1A2556",
    march: "#C4282D",
    simtek: "#4D2D7D",
    lola: "#D22129",
    pacific: "#D8205C",
    forti: "#F9E434",
    leyton_house: "#88D6C8",
    zakspeed: "#D63445",
    onyx: "#3C63A6",
    brm: "#004225",
    cooper: "#004225",
    vanwall: "#004225",
    maserati: "#CE212C",
    matra: "#0000FF",
    lotus: "#E5C253",
    shadow: "#000000",
    wolf: "#BE9F55",
    penske: "#D22129",
    hesketh: "#FFFFFF",
    surtees: "#FFFF00",
    dallara: "#D22129",
    fondmetal: "#2D2D2D",
    mercedes_benz: "#C0C0C0",
  };
  return colors[constructorId] || "#525252";
};

// Self-hosted (public/logos/*.png) so team renames/CDN reshuffles at
// formula1.com can't 404 these.
const LOGO_IDS = new Set([
  "red_bull",
  "ferrari",
  "mercedes",
  "mclaren",
  "aston_martin",
  "alpine",
  "williams",
  "rb",
  "audi",
  "haas",
]);

export const getTeamLogo = (constructorId: string): string | null =>
  LOGO_IDS.has(constructorId) ? `/logos/${constructorId}.png` : null;

// Track maps by jolpi circuitId (hotlinked from formula1.com).
const CIRCUIT_IMG: Record<string, string> = {
  bahrain:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Bahrain_Circuit.png",
  jeddah:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Saudi_Arabia_Circuit.png",
  albert_park:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Australia_Circuit.png",
  suzuka:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Japan_Circuit.png",
  shanghai:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/China_Circuit.png",
  miami:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Miami_Circuit.png",
  imola:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Emilia_Romagna_Circuit.png",
  monaco:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Monaco_Circuit.png",
  villeneuve:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Canada_Circuit.png",
  catalunya:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Spain_Circuit.png",
  red_bull_ring:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Austria_Circuit.png",
  silverstone:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Great_Britain_Circuit.png",
  hungaroring:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Hungary_Circuit.png",
  spa:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Belgium_Circuit.png",
  zandvoort:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Netherlands_Circuit.png",
  monza:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Italy_Circuit.png",
  baku:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Azerbaijan_Circuit.png",
  marina_bay:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Singapore_Circuit.png",
  americas:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/USA_Circuit.png",
  rodriguez:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Mexico_Circuit.png",
  interlagos:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Brazil_Circuit.png",
  vegas:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1699544976/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Las_Vegas_Circuit.png",
  losail:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Qatar_Circuit.png",
  yas_marina:
    "https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/Abu_Dhabi_Circuit.png",
};

export const getCircuitImg = (circuitId: string): string | null =>
  CIRCUIT_IMG[circuitId] ?? null;

export const getCountryCode = (name: string): string | null => {
  const map: Record<string, string> = {
    British: "gb",
    UK: "gb",
    "United Kingdom": "gb",
    "Great Britain": "gb",
    Dutch: "nl",
    Netherlands: "nl",
    Monegasque: "mc",
    Monaco: "mc",
    Spanish: "es",
    Spain: "es",
    Mexican: "mx",
    Mexico: "mx",
    Australian: "au",
    Australia: "au",
    German: "de",
    Germany: "de",
    French: "fr",
    France: "fr",
    Finnish: "fi",
    Finland: "fi",
    Canadian: "ca",
    Canada: "ca",
    Japanese: "jp",
    Japan: "jp",
    Chinese: "cn",
    China: "cn",
    Thai: "th",
    Thailand: "th",
    Danish: "dk",
    Denmark: "dk",
    American: "us",
    USA: "us",
    "United States": "us",
    Italian: "it",
    Italy: "it",
    Brazilian: "br",
    Brazil: "br",
    Austrian: "at",
    Austria: "at",
    Swiss: "ch",
    Switzerland: "ch",
    Belgian: "be",
    Belgium: "be",
    Hungarian: "hu",
    Hungary: "hu",
    "Saudi Arabian": "sa",
    "Saudi Arabia": "sa",
    Emirati: "ae",
    UAE: "ae",
    "Abu Dhabi": "ae",
    Azerbaijani: "az",
    Azerbaijan: "az",
    Singaporean: "sg",
    Singapore: "sg",
    Qatari: "qa",
    Qatar: "qa",
    Bahraini: "bh",
    Bahrain: "bh",
    Portuguese: "pt",
    Portugal: "pt",
    Turkish: "tr",
    Turkey: "tr",
    Russian: "ru",
    Russia: "ru",
    Polish: "pl",
    Poland: "pl",
    Swedish: "se",
    Sweden: "se",
    "New Zealander": "nz",
    "New Zealand": "nz",
    Argentine: "ar",
    Argentina: "ar",
    Venezuelan: "ve",
    Venezuela: "ve",
    Colombian: "co",
    Colombia: "co",
    Indian: "in",
    India: "in",
    Indonesian: "id",
    Indonesia: "id",
    Malaysian: "my",
    Malaysia: "my",
    Korean: "kr",
    Korea: "kr",
    "South African": "za",
    "South Africa": "za",
  };
  return map[name] || null;
};

export const formatDateLocal = (dateStr: string, timeStr: string): string => {
  if (!dateStr || !timeStr) return "TBA";
  const isoString = `${dateStr}T${timeStr}${timeStr.endsWith("Z") ? "" : "Z"}`;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "TBA";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

// Ergast has no race times before ~2005; noon UTC keeps the right calendar
// day in every timezone.
export const raceStart = (r: { date: string; time?: string }): Date =>
  new Date(`${r.date}T${r.time || "12:00:00Z"}`);

// "GMT+5:30", "PDT", ... for labelling times shown in the viewer's timezone
export const localTzLabel = (): string =>
  new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
    .formatToParts(new Date())
    .find((p) => p.type === "timeZoneName")?.value ?? "local time";
