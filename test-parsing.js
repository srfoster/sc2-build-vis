const buildOrder = `12  0:00  Probe
13  0:12  Probe
14  0:19  Pylon
14  0:24  Probe
15  0:37  Probe (Chrono Boost)
16  0:44  Gateway
16  0:47  Probe x2 (Chrono Boost)`;

console.log('Testing build order parsing...');
console.log('Input lines:');

const lines = buildOrder.split('\n');
lines.forEach((line, i) => {
  console.log(`  "${line.trim()}"`);
  const match = line.trim().match(/^(\d+)\s+(\d+:\d+)\s+(.+)$/);
  if (match) {
    const supply = parseInt(match[1]);
    const timeStr = match[2];
    const rawUnit = match[3].trim();
    const cleanUnit = rawUnit
      .replace(/\s*\(.*?\)/g, '') // Remove parentheses content
      .replace(/\s*x\d+/g, '')    // Remove multipliers
      .trim();
    
    const minutes = parseInt(timeStr.split(':')[0]);
    const seconds = parseInt(timeStr.split(':')[1]);
    const totalSeconds = minutes * 60 + seconds;
    
    console.log(`    → Supply: ${supply}, Time: ${timeStr} (${totalSeconds}s), Raw: "${rawUnit}", Clean: "${cleanUnit}"`);
  } else {
    console.log(`    → NO MATCH for line: "${line.trim()}"`);
  }
});
