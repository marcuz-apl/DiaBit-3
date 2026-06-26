import { calculateMCM, RawStation, WellheadReference } from '../src/lib/mcm';

const ref: WellheadReference = {
  easting: 500000.0,
  northing: 5800000.0,
  elevation: 100.0,
  unit: 'metric',
};

const survey: RawStation[] = [
  { measuredDepth: 0, inclination: 0, azimuth: 0 },
  { measuredDepth: 100, inclination: 10, azimuth: 45 },
  { measuredDepth: 200, inclination: 20, azimuth: 45 },
];

console.log("Starting MCM calculation verification...");
const result = calculateMCM(survey, ref);

console.log("Calculated Station 0:", result[0]);
console.log("Calculated Station 1:", result[1]);
console.log("Calculated Station 2:", result[2]);

// Simple assertions
if (result[0].tvd !== 0 || result[0].easting !== 500000 || result[0].northing !== 5800000) {
  console.error("FAIL: Initial station calculation is incorrect.");
  process.exit(1);
}

// Station 1 calculations:
// deltaMd = 100.
// inc1 = 0, inc2 = 10 deg (0.1745 rad). az1 = 0, az2 = 45 deg (0.7854 rad).
// cos(alpha) = cos(10) - sin(0)*sin(10)*... = cos(10) = 0.9848
// alpha = 10 deg = 0.1745 rad.
// F = (2 / alpha) * tan(alpha / 2) = (2 / 0.1745) * tan(5) = 11.459 * 0.08749 = 1.0025 (approx 1.00127)
// Let's print outputs and check DLS: DLS should be (10 / 100) * 30 = 3 deg/30m.
console.log(`Station 1 DLS: ${result[1].dls} deg/30m`);
console.log(`Station 2 DLS: ${result[2].dls} deg/30m`);

if (Math.abs(result[1].dls - 3.0) > 0.01) {
  console.error(`FAIL: Station 1 DLS should be approximately 3.0 deg/30m. Got ${result[1].dls}`);
  process.exit(1);
}

console.log("SUCCESS: MCM calculation verification passed!");
