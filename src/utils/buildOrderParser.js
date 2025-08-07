import { getBuildTime, getUnitCategory } from '../data/sc2Data.js';

// Parse Spawning Tool build order format
// Example input:
// "14 0:18 Pylon
// 16 0:32 Gateway
// 17 0:38 Assimilator"

export function parseSpawningToolBuildOrder(buildOrderText) {
  if (!buildOrderText || typeof buildOrderText !== 'string') {
    return [];
  }

  const lines = buildOrderText.trim().split('\n');
  const buildOrder = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parsed = parseBuildOrderLine(line, i);
    if (parsed) {
      const buildTime = getBuildTime(parsed.unitName);
      
      const buildItem = {
        id: `${parsed.unitName}_${i}`,
        supply: parsed.supply,
        gameTime: parsed.gameTime, // Keep the original game time from the build order
        unitName: parsed.unitName,
        category: getUnitCategory(parsed.unitName),
        duration: buildTime,
        order: i + 1,
        // These will be calculated later in calculateBuildOrderTiming
        startTime: null,
        endTime: null
      };

      buildOrder.push(buildItem);
    }
  }

  return buildOrder;
}

function parseBuildOrderLine(line, index) {
  // Remove any leading/trailing whitespace
  line = line.trim();
  
  // Skip empty lines or comments
  if (!line || line.startsWith('#') || line.startsWith('//')) {
    return null;
  }

  // Helper function to clean unit names
  function cleanUnitName(name) {
    // Remove common annotations and multipliers
    return name
      .replace(/\s*\(.*?\)/g, '') // Remove anything in parentheses like "(Chrono Boost)"
      .replace(/\s*x\d+/g, '')    // Remove multipliers like "x2"
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();
  }

  // Try to match different Spawning Tool formats:
  // Format 1: "14 0:18 Pylon"
  // Format 2: "14 Pylon @0:18"
  // Format 3: "Pylon @0:18"
  // Format 4: "14 Pylon"
  // Format 5: "Pylon"

  let supply = null;
  let gameTime = null;
  let unitName = '';

  // Pattern 1: Supply Time Unit (e.g., "14 0:18 Pylon" or "12  0:00  Probe")
  let match = line.match(/^(\d+)\s+(\d+:\d+)\s+(.+)$/);
  if (match) {
    supply = parseInt(match[1]);
    gameTime = parseGameTime(match[2]);
    unitName = match[3].trim();
    
    // Clean up unit name - remove annotations like "(Chrono Boost)", "x2", etc.
    unitName = cleanUnitName(unitName);
    return { supply, gameTime, unitName };
  }

  // Pattern 2: Supply Unit @Time (e.g., "14 Pylon @0:18")
  match = line.match(/^(\d+)\s+(.+?)\s*@(\d+:\d+)$/);
  if (match) {
    supply = parseInt(match[1]);
    unitName = match[2].trim();
    gameTime = parseGameTime(match[3]);
    return { supply, gameTime, unitName };
  }

  // Pattern 3: Unit @Time (e.g., "Pylon @0:18")
  match = line.match(/^(.+?)\s*@(\d+:\d+)$/);
  if (match) {
    unitName = match[1].trim();
    gameTime = parseGameTime(match[2]);
    return { supply, gameTime, unitName };
  }

  // Pattern 4: Supply Unit (e.g., "14 Pylon")
  match = line.match(/^(\d+)\s+(.+)$/);
  if (match) {
    supply = parseInt(match[1]);
    unitName = match[2].trim();
    return { supply, gameTime, unitName };
  }

  // Pattern 5: Just Unit name (e.g., "Pylon")
  match = line.match(/^(.+)$/);
  if (match) {
    unitName = match[1].trim();
    return { supply, gameTime, unitName };
  }

  return null;
}

function parseGameTime(timeString) {
  // Parse time strings like "0:18", "1:23", "10:45"
  const parts = timeString.split(':');
  if (parts.length !== 2) return null;
  
  const minutes = parseInt(parts[0]);
  const seconds = parseInt(parts[1]);
  
  if (isNaN(minutes) || isNaN(seconds)) return null;
  
  return minutes * 60 + seconds;
}

// Helper function to format time back to MM:SS
export function formatGameTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Calculate build order timing and dependencies
export function calculateBuildOrderTiming(buildOrder) {
  // Sort by order to maintain sequence
  const sortedOrder = [...buildOrder].sort((a, b) => a.order - b.order);
  
  let currentTime = 0;
  const result = [];
  
  // Track building queues (for units that come from the same building)
  const buildingQueues = {
    'Nexus': 0,        // For Probes
    'Gateway': 0,      // For basic Protoss units
    'Cybernetics Core': 0,
    'Robotics Facility': 0,
    'Stargate': 0,
    'Command Center': 0, // For SCVs
    'Barracks': 0,
    'Factory': 0,
    'Starport': 0,
    'Hatchery': 0,     // For Drones and basic Zerg units
    'Spawning Pool': 0,
    'Roach Warren': 0,
    'Hydralisk Den': 0,
    'Spire': 0
  };

  // Helper function to get which building produces a unit
  function getProducingBuilding(unitName) {
    const producers = {
      'Probe': 'Nexus',
      'Zealot': 'Gateway',
      'Stalker': 'Gateway', 
      'Sentry': 'Gateway',
      'Adept': 'Gateway',
      'Immortal': 'Robotics Facility',
      'Observer': 'Robotics Facility',
      'Colossus': 'Robotics Facility',
      'Phoenix': 'Stargate',
      'Void Ray': 'Stargate',
      'Oracle': 'Stargate',
      'SCV': 'Command Center',
      'Marine': 'Barracks',
      'Marauder': 'Barracks',
      'Reaper': 'Barracks',
      'Hellion': 'Factory',
      'Siege Tank': 'Factory',
      'Thor': 'Factory',
      'Viking': 'Starport',
      'Medivac': 'Starport',
      'Banshee': 'Starport',
      'Drone': 'Hatchery',
      'Overlord': 'Hatchery',
      'Zergling': 'Spawning Pool',
      'Roach': 'Roach Warren',
      'Hydralisk': 'Hydralisk Den',
      'Mutalisk': 'Spire'
    };
    return producers[unitName] || null;
  }

  for (const item of sortedOrder) {
    let startTime;
    
    if (item.gameTime !== null) {
      // Item has explicit timing - ALWAYS use it exactly as specified
      startTime = item.gameTime;
    } else {
      // Item needs sequential timing - use building queue logic
      const producingBuilding = getProducingBuilding(item.unitName);
      
      if (producingBuilding && buildingQueues[producingBuilding] !== undefined) {
        // This unit comes from a specific building - queue it after previous units from same building
        startTime = Math.max(currentTime, buildingQueues[producingBuilding]);
      } else {
        // Building or other item - can start immediately
        startTime = currentTime;
      }
    }
    
    const endTime = startTime + item.duration;
    
    const calculatedItem = {
      ...item,
      startTime,
      endTime,
      calculatedTime: formatGameTime(startTime)
    };

    result.push(calculatedItem);
    
    // Update building queues ONLY for items without explicit timing
    // This allows explicit times to "override" the natural building queue
    if (item.gameTime === null) {
      const producingBuilding = getProducingBuilding(item.unitName);
      if (producingBuilding && buildingQueues[producingBuilding] !== undefined) {
        buildingQueues[producingBuilding] = endTime;
      }
    } else {
      // For explicit timing, update the building queue to this item's end time
      // if it's later than the current queue time (to handle timing overrides)
      const producingBuilding = getProducingBuilding(item.unitName);
      if (producingBuilding && buildingQueues[producingBuilding] !== undefined) {
        buildingQueues[producingBuilding] = Math.max(buildingQueues[producingBuilding], endTime);
      }
    }
    
    // Update general current time
    currentTime = Math.max(currentTime, endTime);
  }

  return result;
}
