import React, { useEffect, useMemo, useState } from "react";

// --- Types ---
type Task = {
  id: string;
  name: string; // e.g., Probe, Pylon
  start: number; // seconds
  duration: number; // seconds
  meta?: string; // e.g., (Chrono Boost)
};

type DurationMap = Record<string, number>;

type SortMode = "alpha" | "firstStart";

type BuildEntry = {
  id: string;
  name: string;
  text: string;
  updatedAt: number;
};

const LS_KEY_BUILDS = "sc2gantt.builds.v1";

function loadBuildsFromStorage(): BuildEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY_BUILDS);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((b) => b && typeof b.name === "string" && typeof b.text === "string")
      .map((b) => ({
        id: String(b.id || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`),
        name: String(b.name),
        text: String(b.text),
        updatedAt: Number(b.updatedAt || Date.now()),
      }));
  } catch {
    return [];
  }
}

function saveBuildsToStorage(items: BuildEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY_BUILDS, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

// Chrono Boost config
const CHRONO_MULTIPLIER = 2 / 3; // ~33% faster (shorter bars)
const isChrono = (meta?: string) => !!meta && /chrono/i.test(meta);

// --- Default durations ---
// Buildings are LotV values based on Liquipedia; units are common approximations (feel free to tweak)
const DEFAULT_DURATIONS: DurationMap = {
  // --- Protoss units (Liquipedia LotV — Faster) ---
  // Source: https://liquipedia.net/starcraft2/Unit_Statistics_(Legacy_of_the_Void)
  Probe: 12,
  Zealot: 27,
  Stalker: 27,
  Adept: 30,
  Sentry: 23, // corrected from 26
  "High Templar": 39,
  "Dark Templar": 39,
  Immortal: 39,
  Colossus: 54,
  Disruptor: 36,
  Observer: 18, // 17.9 → 18
  "Warp Prism": 36,
  Phoenix: 25,
  "Void Ray": 43,
  Oracle: 37,
  Tempest: 43,
  Carrier: 64,
  Mothership: 89,
  Archon: 48, // HT + merge time
  Interceptor: 9,

  // --- Protoss buildings — LotV (Liquipedia) ---
  Pylon: 18,
  Assimilator: 21,
  Gateway: 46,
  Cybernetics: 36,
  "Cybernetics Core": 36, // alias safety
  Forge: 32,
  "Shield Battery": 29,
  Stargate: 43,
  "Robotics Facility": 46,
  "Robotics Bay": 46,
  "Twilight Council": 36,
  "Templar Archives": 36,
  "Dark Shrine": 71,
  "Fleet Beacon": 43,
  "Photon Cannon": 29,
  Nexus: 71,
  "Warp Gate": 7, // morph time
  "Stasis Ward": 4,

  // --- Protoss upgrades (Liquipedia LotV — Faster) ---
  // Source: https://liquipedia.net/starcraft2/Protoss_Upgrades
  // Attack upgrades
  "Ground Weapons Level 1": 121,
  "Ground Weapons Level 2": 143,
  "Ground Weapons Level 3": 171,
  "Air Weapons Level 1": 129,
  "Air Weapons Level 2": 154,
  "Air Weapons Level 3": 183,
  // Armor & shields
  "Ground Armor Level 1": 121,
  "Ground Armor Level 2": 143,
  "Ground Armor Level 3": 171,
  "Air Armor Level 1": 129,
  "Air Armor Level 2": 154,
  "Air Armor Level 3": 183,
  "Shields Level 1": 121,
  "Shields Level 2": 143,
  "Shields Level 3": 171,
  // Speed
  Charge: 100,
  Blink: 121,
  "Resonating Glaives": 100,
  "Gravitic Boosters": 57, // Observer speed
  "Gravitic Drive": 57, // Warp Prism speed
  // Range & caster
  "Anion Pulse-Crystals": 64, // Phoenix range
  "Extended Thermal Lance": 79, // Colossus range
  "Psionic Storm": 79,
  "Shadow Stride": 100,
  "Warp Gate Research": 100,

  // Marker only
  "Chrono Boost": 0,

  // --- Terran units (Liquipedia LotV — Faster) ---
  SCV: 12,
  Marine: 18,
  Marauder: 21,
  Reaper: 32,
  Ghost: 43,
  Hellion: 21,
  "Hellbat": 9, // morph from Hellion
  "Widow Mine": 21,
  "Siege Tank": 32,
  Cyclone: 32,
  Thor: 43,
  Viking: 30,
  Medivac: 30,
  Liberator: 43,
  Raven: 43,
  Banshee: 43,
  Battlecruiser: 64,

  // --- Zerg units (Liquipedia LotV — Faster) ---
  Drone: 12,
  Overlord: 25,
  Overseer: 9, // morph from Overlord
  Queen: 36,
  Zergling: 17,
  Baneling: 14, // morph from Zergling
  Roach: 19,
  Ravager: 12, // morph from Roach
  Hydralisk: 24,
  Lurker: 18, // morph from Hydralisk
  Mutalisk: 33,
  Corruptor: 29,
  "Brood Lord": 34, // morph from Corruptor
  Infestor: 36,
  "Swarm Host": 29,
  Ultralisk: 39,
  Viper: 29,

  // --- Zerg buildings (Liquipedia LotV — Faster) ---
  Hatchery: 71,
  Lair: 57,
  Hive: 71,
  Extractor: 21,
  "Spawning Pool": 46,
  "Roach Warren": 39,
  "Baneling Nest": 43,
  "Evolution Chamber": 29,
  "Hydralisk Den": 29,
  "Lurker Den": 57,
  Spire: 71,
  "Greater Spire": 71,
  "Infestation Pit": 36,
  "Ultralisk Cavern": 46,
  "Nydus Network": 43,
  "Nydus Worm": 14,
  "Spine Crawler": 36,
  "Spore Crawler": 21,
  "Creep Tumor": 15,
};

// --- Categorization for coloring ---
type Category = "infrastructure" | "production" | "static" | "upgradeBuilding" | "unit" | "other";

const INFRA = new Set(["Pylon", "Assimilator", "Nexus", "Hatchery", "Lair", "Hive", "Extractor"]);
const PRODUCTION = new Set(["Gateway", "Robotics Facility", "Stargate"]);
const STATIC_DEF = new Set(["Shield Battery", "Photon Cannon", "Spine Crawler", "Spore Crawler"]);
const UPGRADE_BLD = new Set([
  "Cybernetics",
  "Cybernetics Core",
  "Forge",
  "Twilight Council",
  "Templar Archives",
  "Dark Shrine",
  "Fleet Beacon",
  "Robotics Bay",
  // Zerg tech/upgrade structures
  "Spawning Pool",
  "Roach Warren",
  "Baneling Nest",
  "Evolution Chamber",
  "Hydralisk Den",
  "Lurker Den",
  "Spire",
  "Greater Spire",
  "Infestation Pit",
  "Ultralisk Cavern",
  "Nydus Network",
  "Nydus Worm",
]);
const UNIT_NAMES = new Set([
  // Protoss
  "Probe",
  "Zealot",
  "Stalker",
  "Adept",
  "Sentry",
  "High Templar",
  "Dark Templar",
  "Immortal",
  "Colossus",
  "Disruptor",
  "Observer",
  "Warp Prism",
  "Phoenix",
  "Void Ray",
  "Oracle",
  "Tempest",
  "Carrier",
  "Mothership",
  "Archon",
  "Interceptor",
  // Terran
  "SCV",
  "Marine",
  "Marauder",
  "Reaper",
  "Ghost",
  "Hellion",
  "Hellbat",
  "Widow Mine",
  "Siege Tank",
  "Cyclone",
  "Thor",
  "Viking",
  "Medivac",
  "Liberator",
  "Raven",
  "Banshee",
  "Battlecruiser",
  // Zerg
  "Drone",
  "Overlord",
  "Overseer",
  "Queen",
  "Zergling",
  "Baneling",
  "Roach",
  "Ravager",
  "Hydralisk",
  "Lurker",
  "Mutalisk",
  "Corruptor",
  "Brood Lord",
  "Infestor",
  "Swarm Host",
  "Ultralisk",
  "Viper",
]);

function getCategory(name: string): Category {
  if (INFRA.has(name)) return "infrastructure";
  if (PRODUCTION.has(name)) return "production";
  if (STATIC_DEF.has(name)) return "static";
  if (UPGRADE_BLD.has(name)) return "upgradeBuilding";
  if (UNIT_NAMES.has(name)) return "unit";
  return "other";
}

const CATEGORY_COLORS: Record<Category, string> = {
  infrastructure: "#f59e0b", // amber
  production: "#8b5cf6", // violet
  static: "#f43f5e", // rose
  upgradeBuilding: "#06b6d4", // cyan
  unit: "#3b82f6", // blue
  other: "#9ca3af", // gray
};

// --- Example input ---
const SAMPLE = `12  0:00  Probe
13  0:12  Probe
14  0:19  Pylon
14  0:24  Probe
15  0:37  Probe (Chrono Boost)
16  0:44  Gateway
16  0:47  Probe x2 (Chrono Boost)
16  0:49  Assimilator
18  1:04  Probe
19  1:16  Probe
20  1:24  Nexus`;

// --- Helpers ---
const toSeconds = (ts: string) => {
  // Accepts M:SS or H:MM:SS
  const parts = ts.trim().split(":").map((s) => parseInt(s, 10));
  if (parts.some((n) => Number.isNaN(n))) return NaN;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return NaN;
};

const capFirst = (s: string) => s.replace(/(^|\s)[a-z]/g, (m) => m.toUpperCase());

// Accept common aliases and canonicalize to our DEFAULT_DURATIONS keys
function extractLevel(s: string): number | null {
  const mPlus = s.match(/\+(\d)/);
  if (mPlus) return parseInt(mPlus[1], 10);
  const mLevel = s.match(/level\s*(\d)/i);
  if (mLevel) return parseInt(mLevel[1], 10);
  const mBare = s.match(/\b([1-3])\b/);
  if (mBare) return parseInt(mBare[1], 10);
  return null;
}

function normalizeName(input: string): string {
  let name = capFirst(input).replace(/\s+/g, " ").trim();

  // Simple canonical spacing/aliases
  name = name
    .replace(/Cybernetics Core/i, "Cybernetics")
    .replace(/Warp\s*Gate/i, "Warp Gate");

  // Explicit upgrade aliases
  if (/warp\s*gate.*research/i.test(name) || /warpgate.*research/i.test(name) || /^warpgate$/i.test(name)) {
    return "Warp Gate Research";
  }
  if (/colossus\s*range/i.test(name)) return "Extended Thermal Lance";
  if (/phoenix\s*range/i.test(name)) return "Anion Pulse-Crystals";
  if (/observer.*speed/i.test(name)) return "Gravitic Boosters";
  if (/(warp\s*prism).*speed/i.test(name)) return "Gravitic Drive";
  if (/^storm$/i.test(name) || /psionic\s*storm/i.test(name)) return "Psionic Storm";
  if (/zealot.*charge/i.test(name)) return "Charge";
  if (/resonating\s*glaives/i.test(name) || /\bGlaives\b/i.test(name) || /adept.*glaives/i.test(name)) return "Resonating Glaives";
  if (/(dt|dark\s*templar).*blink/i.test(name) || /shadow\s*stride/i.test(name)) return "Shadow Stride";

  // Generic weapon/armor/shields with optional "Protoss" prefix and level forms
  const lvl = extractLevel(name);
  const mWeap = name.match(/^(?:Protoss\s+)?(Ground|Air)\s+(Weapons|Attacks?)/i);
  if (mWeap && lvl) return `${capFirst(mWeap[1])} Weapons Level ${lvl}`;

  const mArmor = name.match(/^(?:Protoss\s+)?(Ground|Air)\s+Armor/i);
  if (mArmor && lvl) return `${capFirst(mArmor[1])} Armor Level ${lvl}`;

  const mShields = name.match(/^(?:Protoss\s+)?Shields?/i);
  if (mShields && lvl) return `Shields Level ${lvl}`;

  // Nothing matched — return cleaned name
  return name;
}

// Parse build text into tasks
function parseBuild(text: string, durations: DurationMap): Task[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const tasks: Task[] = [];

  for (const line of lines) {
    // Match: supply  time  name [xN] [(meta)]
    // e.g., "16  0:47  Probe x2 (Chrono Boost)"
    const m = line.match(/^(\d+)?\s*([0-9:]+)\s+(.+)$/);
    if (!m) continue;
    const [, _supply, timeStr, rest] = m;
    const start = toSeconds(timeStr);
    if (Number.isNaN(start)) continue;

    // Extract meta in parentheses
    let namePart = rest.trim();
    let meta = "";
    const metaMatch = namePart.match(/\(([^)]+)\)/);
    if (metaMatch) {
      meta = metaMatch[1].trim();
      namePart = namePart.replace(metaMatch[0], "").trim();
    }

    // Handle quantities: x2, x3
    let qty = 1;
    const qtyMatch = namePart.match(/x(\d+)/i);
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1], 10) || 1;
      namePart = namePart.replace(qtyMatch[0], "").trim();
    }

    // Normalize name and map some common aliases
    let name = normalizeName(namePart);

    const baseDuration = durations[name] ?? 10; // fallback 10s if unknown

    for (let i = 0; i < qty; i++) {
      tasks.push({
        id: `${start}-${name}-${i}`,
        name,
        start,
        duration: baseDuration,
        meta,
      });
    }
  }

  // Stable sort by start, then name
  tasks.sort((a, b) => a.start - b.start || a.name.localeCompare(b.name));
  return tasks;
}

// Group tasks by name for row layout
function groupByName(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce((acc, t) => {
    (acc[t.name] ||= []).push(t);
    return acc;
  }, {} as Record<string, Task[]>);
}

// --- Timeline component (pure SVG) ---
function Timeline({
  tasks,
  seconds,
  pxPerSecond,
  applyChronoSpeed,
  sortMode,
}: {
  tasks: Task[];
  seconds: number;
  pxPerSecond: number;
  applyChronoSpeed: boolean;
  sortMode: SortMode;
}) {
  const groups = useMemo(() => groupByName(tasks), [tasks]);
  const names = Object.keys(groups);

  const namesSorted = useMemo(() => {
    if (sortMode === "firstStart") {
      return names.slice().sort((a, b) => {
        const sa = Math.min(...groups[a].map((t) => t.start));
        const sb = Math.min(...groups[b].map((t) => t.start));
        if (sa !== sb) return sa - sb;
        return a.localeCompare(b);
      });
    }
    return names.slice().sort();
  }, [names, groups, sortMode]);

  const rowH = 28;
  const leftGutter = 140; // labels
  const height = Math.max(80, namesSorted.length * rowH + 40);
  const width = Math.max(600, seconds * pxPerSecond + leftGutter + 40);

  const gridMajor = 30; // seconds
  const gridMinor = 10; // seconds

  return (
    <div className="overflow-auto rounded-2xl border shadow-sm bg-white">
      <svg width={width} height={height} className="block">
        {/* Background */}
        <rect x={0} y={0} width={width} height={height} fill="white" />

        {/* Minor grid lines */}
        {Array.from({ length: Math.floor(seconds / gridMinor) + 1 }).map((_, i) => {
          const x = leftGutter + i * gridMinor * pxPerSecond;
          return (
            <line
              key={`minor-${i}`}
              x1={x}
              y1={0}
              x2={x}
              y2={height}
              stroke="#eee"
            />
          );
        })}

        {/* Major grid lines + labels */}
        {Array.from({ length: Math.floor(seconds / gridMajor) + 1 }).map((_, i) => {
          const x = leftGutter + i * gridMajor * pxPerSecond;
          const s = i * gridMajor;
          const mm = Math.floor(s / 60)
            .toString()
            .padStart(1, "0");
          const ss = (s % 60).toString().padStart(2, "0");
          return (
            <g key={`major-${i}`}>
              <line x1={x} y1={0} x2={x} y2={height} stroke="#ddd" />
              <text x={x + 4} y={14} fontSize={12} fill="#666">{`${mm}:${ss}`}</text>
            </g>
          );
        })}

        {/* Row labels */}
        {namesSorted.map((name, idx) => (
          <g key={`label-${name}`}>
            <text
              x={12}
              y={40 + idx * rowH}
              fontSize={13}
              fontWeight={600}
              fill="#111"
            >
              {name}
            </text>
            <line
              x1={0}
              y1={44 + idx * rowH}
              x2={width}
              y2={44 + idx * rowH}
              stroke="#f7f7f7"
            />
          </g>
        ))}

        {/* Bars */}
        {namesSorted.map((name, idx) => {
          const rowY = 20 + idx * rowH + 10;
          return (
            <g key={`row-${name}`}>
              {groups[name].map((t) => {
                const boosted = applyChronoSpeed && isChrono(t.meta);
                const effectiveDuration = boosted
                  ? Math.max(1, t.duration * CHRONO_MULTIPLIER)
                  : t.duration;
                const x = leftGutter + t.start * pxPerSecond;
                const w = Math.max(2, effectiveDuration * pxPerSecond);
                const cat = getCategory(t.name);
                const fill = CATEGORY_COLORS[cat];
                const stroke = boosted ? "#16a34a" : "none";
                return (
                  <g key={t.id}>
                    <title>
                      {`${t.name} — start ${formatSec(t.start)}, duration ${t.duration}s${boosted ? ` → ${Math.round(effectiveDuration)}s (Chrono)` : ""}${t.meta ? " — " + t.meta : ""}`}
                    </title>
                    <rect
                      x={x}
                      y={rowY - 8}
                      width={w}
                      height={16}
                      rx={8}
                      ry={8}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={boosted ? 2 : 0}
                      opacity={0.9}
                    />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Left gutter divider */}
        <line x1={leftGutter} y1={0} x2={leftGutter} y2={height} stroke="#e5e7eb" />
      </svg>
    </div>
  );
}

function formatSec(s: number) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

export default function App() {
  const [input, setInput] = useState(SAMPLE);
  const [durations, setDurations] = useState<DurationMap>(DEFAULT_DURATIONS);
  const [seconds, setSeconds] = useState<number>(12 * 60); // 12 minutes default
  const [pxPerSecond, setPxPerSecond] = useState<number>(2); // zoom
  const [error, setError] = useState<string | null>(null);
  const [applyChrono, setApplyChrono] = useState<boolean>(true);
  const [sortMode, setSortMode] = useState<SortMode>("alpha");

  // Local builds
  const [builds, setBuilds] = useState<BuildEntry[]>([]);
  const [newBuildName, setNewBuildName] = useState<string>("My Build");

  useEffect(() => {
    setBuilds(loadBuildsFromStorage());
  }, []);

  const persistBuilds = (next: BuildEntry[]) => {
    setBuilds(next);
    saveBuildsToStorage(next);
  };

  const handleSaveBuild = () => {
    const name = (newBuildName || "").trim() || "Untitled";
    const idx = builds.findIndex((b) => b.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
      const updated: BuildEntry = { ...builds[idx], text: input, updatedAt: Date.now() };
      const next = builds.slice();
      next[idx] = updated;
      persistBuilds(next);
    } else {
      const entry: BuildEntry = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        text: input,
        updatedAt: Date.now(),
      };
      persistBuilds([entry, ...builds]);
    }
  };

  const handleLoadBuild = (id: string) => {
    const b = builds.find((x) => x.id === id);
    if (!b) return;
    setInput(b.text);
    setNewBuildName(b.name);
  };

  const handleDeleteBuild = (id: string) => {
    persistBuilds(builds.filter((b) => b.id !== id));
  };

  const buildsSorted = useMemo(
    () => builds.slice().sort((a, b) => b.updatedAt - a.updatedAt || a.name.localeCompare(b.name)),
    [builds]
  );

  const tasks = useMemo(() => {
    try {
      setError(null);
      return parseBuild(input, durations);
    } catch (e: any) {
      setError(e?.message || "Parse error");
      return [] as Task[];
    }
  }, [input, durations]);

  const durationRows = useMemo(() => {
    const namesFromTasks = Array.from(new Set(tasks.map((t) => t.name)));
    if (namesFromTasks.length) {
      if (sortMode === "firstStart") {
        const firstStart: Record<string, number> = {};
        for (const t of tasks) {
          if (firstStart[t.name] == null || t.start < firstStart[t.name]) firstStart[t.name] = t.start;
        }
        return namesFromTasks
          .slice()
          .sort((a, b) => (firstStart[a] ?? Number.POSITIVE_INFINITY) - (firstStart[b] ?? Number.POSITIVE_INFINITY) || a.localeCompare(b));
      }
      return namesFromTasks.slice().sort();
    }
    return Object.keys(durations).sort();
  }, [tasks, durations, sortMode]);

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">SC2 Build Order → Gantt</h1>
          <div className="text-sm text-neutral-500">Paste a build order, tweak durations, zoom, done.</div>
        </header>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-1">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Build Order</h2>
                <button
                  className="px-3 py-1 rounded-xl border text-sm hover:bg-neutral-50"
                  onClick={() => setInput(SAMPLE)}
                >
                  Load sample
                </button>
              </div>
              <textarea
                className="w-full h-64 resize-y rounded-xl border p-3 font-mono text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`14  0:19  Pylon\n16  0:44  Gateway\n16  0:47  Probe x2 (Chrono Boost)`}
              />
              <p className="mt-2 text-xs text-neutral-500">
                Format: <code>SUPPLY  TIME  NAME [xN] [(meta)]</code>. Time can be <code>M:SS</code> or <code>H:MM:SS</code>.
              </p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

              {/* Saved builds */}
              <div className="mt-4 border-t pt-3">
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded-lg border px-2 py-1 text-sm"
                    placeholder="Build name"
                    value={newBuildName}
                    onChange={(e) => setNewBuildName(e.target.value)}
                  />
                  <button
                    className="px-3 py-1 rounded-xl border text-sm hover:bg-neutral-50"
                    onClick={handleSaveBuild}
                  >
                    Save
                  </button>
                </div>
                <div className="mt-3 max-h-44 overflow-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-neutral-50">
                      <tr>
                        <th className="text-left px-3 py-2">Saved Builds</th>
                        <th className="w-36 px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {buildsSorted.length === 0 && (
                        <tr>
                          <td className="px-3 py-2 text-neutral-500" colSpan={2}>No saved builds yet.</td>
                        </tr>
                      )}
                      {buildsSorted.map((b) => (
                        <tr key={b.id} className="odd:bg-white even:bg-neutral-50">
                          <td className="px-3 py-2">
                            <div className="font-medium">{b.name}</div>
                            <div className="text-xs text-neutral-500">{new Date(b.updatedAt).toLocaleString()}</div>
                          </td>
                          <td className="px-2 py-2 text-right space-x-2">
                            <button
                              className="px-2 py-1 rounded-lg border text-xs hover:bg-neutral-50"
                              onClick={() => handleLoadBuild(b.id)}
                            >
                              Load
                            </button>
                            <button
                              className="px-2 py-1 rounded-lg border text-xs text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteBuild(b.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1">
            <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
              <h2 className="font-semibold">Timeline</h2>
              <label className="block text-sm">
                <span className="text-neutral-600">Game length: {Math.floor(seconds / 60)}m {seconds % 60}s</span>
                <input
                  type="range"
                  min={120}
                  max={1800}
                  value={seconds}
                  onChange={(e) => setSeconds(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </label>
              <label className="block text-sm">
                <span className="text-neutral-600">Zoom (px/sec): {pxPerSecond.toFixed(1)}</span>
                <input
                  type="range"
                  min={0.5}
                  max={8}
                  step={0.1}
                  value={pxPerSecond}
                  onChange={(e) => setPxPerSecond(parseFloat(e.target.value))}
                  className="w-full"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={applyChrono}
                  onChange={(e) => setApplyChrono(e.target.checked)}
                />
                Apply Chrono Boost speed (−33% duration)
              </label>
              <label className="block text-sm">
                <span className="text-neutral-600">Row sort:</span>
                <select
                  className="mt-1 w-full rounded-lg border px-2 py-1"
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                >
                  <option value="alpha">Alphabetical (A→Z)</option>
                  <option value="firstStart">First start time</option>
                </select>
              </label>
              <div className="text-xs text-neutral-500">
                Tip: If your bars look too long/short, tweak durations on the right.
              </div>
            </div>
          </div>

          <div className="col-span-1">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h2 className="font-semibold mb-2">Durations (sec)</h2>
              <div className="max-h-72 overflow-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-neutral-50">
                    <tr>
                      <th className="text-left px-3 py-2">Item</th>
                      <th className="text-right px-3 py-2">Seconds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {durationRows.map((name) => (
                      <tr key={name} className="odd:bg-white even:bg-neutral-50">
                        <td className="px-3 py-2 font-medium">
                          <span
                            className="inline-block w-3 h-3 rounded-sm mr-2 align-middle"
                            style={{ backgroundColor: CATEGORY_COLORS[getCategory(name as string)] }}
                          />
                          {name}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            className="w-20 text-right rounded-lg border px-2 py-1"
                            type="number"
                            min={0}
                            value={durations[name] ?? 10}
                            onChange={(e) =>
                              setDurations((d) => ({ ...d, [name]: parseFloat(e.target.value) }))
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="px-3 py-1 rounded-xl border text-sm hover:bg-neutral-50"
                  onClick={() => setDurations(DEFAULT_DURATIONS)}
                >
                  Reset defaults
                </button>
                <button
                  className="px-3 py-1 rounded-xl border text-sm hover:bg-neutral-50"
                  onClick={() => setDurations((d) => {
                    const next = { ...d } as DurationMap;
                    // Add any unseen names with a sensible default
                    for (const n of durationRows) if (next[n] == null) next[n] = 10;
                    return next;
                  })}
                >
                  Fill missing
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl">
          <Timeline
            tasks={tasks}
            seconds={seconds}
            pxPerSecond={pxPerSecond}
            applyChronoSpeed={applyChrono}
            sortMode={sortMode}
          />
        </div>

        {/* Legend */}
        <div className="text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS.infrastructure }} />
              Infrastructure
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS.production }} />
              Production
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS.static }} />
              Static defense
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS.upgradeBuilding }} />
              Upgrade buildings
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS.unit }} />
              Units
            </span>
            <span className="ml-2">Chrono-boosted bars are outlined in green.</span>
          </div>
          <div className="mt-1">Bars are placed on rows by item name. Hover a bar to see start time and duration. Unknown items default to 10s—edit them in the table above.</div>
        </div>
      </div>
    </div>
  );
}
