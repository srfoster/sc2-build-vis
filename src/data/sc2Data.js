// StarCraft 2 build times and costs (in seconds and resources)
// Times are based on normal game speed without upgrades

export const RACES = {
  PROTOSS: 'protoss',
  TERRAN: 'terran',
  ZERG: 'zerg'
};

// Build times in seconds
export const BUILD_TIMES = {
  // Protoss Units
  'Probe': 12,
  'Zealot': 27,
  'Stalker': 30,
  'Sentry': 26,
  'Adept': 30,
  'High Templar': 39,
  'Dark Templar': 39,
  'Archon': 9,
  'Observer': 21,
  'Warp Prism': 36,
  'Immortal': 39,
  'Colossus': 54,
  'Disruptor': 36,
  'Phoenix': 25,
  'Void Ray': 37,
  'Oracle': 32,
  'Tempest': 43,
  'Carrier': 64,
  'Interceptor': 6,
  'Mothership': 114,

  // Protoss Buildings
  'Nexus': 71,
  'Pylon': 18,
  'Assimilator': 21,
  'Gateway': 46,
  'Forge': 32,
  'Photon Cannon': 29,
  'Cybernetics Core': 36,
  'Shield Battery': 29,
  'Warpgate': 23,
  'Robotics Facility': 46,
  'Stargate': 43,
  'Twilight Council': 36,
  'Templar Archives': 36,
  'Dark Shrine': 71,
  'Robotics Bay': 46,
  'Fleet Beacon': 43,

  // Terran Units
  'SCV': 12,
  'Marine': 18,
  'Marauder': 21,
  'Reaper': 32,
  'Ghost': 29,
  'Hellion': 21,
  'Hellbat': 21,
  'Widow Mine': 21,
  'Cyclone': 32,
  'Siege Tank': 32,
  'Thor': 43,
  'Viking': 30,
  'Medivac': 30,
  'Liberator': 43,
  'Raven': 43,
  'Banshee': 43,
  'Battlecruiser': 64,

  // Terran Buildings
  'Command Center': 71,
  'Supply Depot': 21,
  'Refinery': 21,
  'Barracks': 46,
  'Engineering Bay': 25,
  'Missile Turret': 18,
  'Bunker': 29,
  'Sensor Tower': 18,
  'Factory': 43,
  'Starport': 36,
  'Armory': 46,
  'Ghost Academy': 29,
  'Fusion Core': 46,
  'Tech Lab': 18,
  'Reactor': 36,

  // Zerg Units
  'Drone': 12,
  'Overlord': 18,
  'Zergling': 17,
  'Baneling': 14,
  'Roach': 19,
  'Ravager': 9,
  'Hydralisk': 24,
  'Lurker': 18,
  'Infestor': 36,
  'Swarm Host': 29,
  'Ultralisk': 39,
  'Mutalisk': 24,
  'Corruptor': 29,
  'Brood Lord': 23,
  'Viper': 29,
  'Queen': 36,

  // Zerg Buildings
  'Hatchery': 71,
  'Lair': 57,
  'Hive': 71,
  'Extractor': 21,
  'Spawning Pool': 46,
  'Evolution Chamber': 25,
  'Spine Crawler': 36,
  'Spore Crawler': 21,
  'Roach Warren': 39,
  'Baneling Nest': 43,
  'Hydralisk Den': 29,
  'Lurker Den': 86,
  'Infestation Pit': 36,
  'Spire': 71,
  'Greater Spire': 71,
  'Nydus Network': 36,
  'Nydus Worm': 14,
  'Ultralisk Cavern': 46,

  // Common/Neutral
  'Overseer': 12,
  'Changeling': 3,
  'Broodling': 0,
  'Interceptor': 6,
  'Locust': 0,
  'Auto-turret': 0,
  'Point Defense Drone': 0
};

// Resource costs [minerals, vespene]
export const COSTS = {
  'Probe': [50, 0],
  'Zealot': [100, 0],
  'Stalker': [125, 50],
  'Sentry': [50, 100],
  // Add more as needed...
};

// Supply costs
export const SUPPLY_COSTS = {
  'Probe': 1,
  'Zealot': 2,
  'Stalker': 2,
  'Sentry': 2,
  // Add more as needed...
};

// Prerequisite buildings/tech
export const PREREQUISITES = {
  'Stalker': ['Cybernetics Core'],
  'Sentry': ['Cybernetics Core'],
  'Immortal': ['Robotics Facility'],
  'Colossus': ['Robotics Bay'],
  // Add more as needed...
};

export const UNIT_CATEGORIES = {
  WORKER: 'worker',
  MILITARY: 'military',
  BUILDING: 'building',
  UPGRADE: 'upgrade',
  TECH: 'tech'
};

// Helper function to get build time
export function getBuildTime(unitName) {
  return BUILD_TIMES[unitName] || 0;
}

// Helper function to determine unit category
export function getUnitCategory(unitName) {
  const workers = ['Probe', 'SCV', 'Drone'];
  const buildings = ['Nexus', 'Pylon', 'Gateway', 'Command Center', 'Supply Depot', 'Barracks', 'Hatchery', 'Spawning Pool'];
  
  if (workers.includes(unitName)) return UNIT_CATEGORIES.WORKER;
  if (buildings.includes(unitName) || unitName.includes('Building') || unitName.includes('Structure')) {
    return UNIT_CATEGORIES.BUILDING;
  }
  return UNIT_CATEGORIES.MILITARY;
}
