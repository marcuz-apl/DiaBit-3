// Minimum Curvature Method (MCM) Directional Drilling Trajectory Calculations

export interface RawStation {
  measuredDepth: number;   // MD
  inclination: number;     // Inc (degrees)
  azimuth: number;         // Az (degrees)
}

export interface CalculatedStation extends RawStation {
  tvd: number;
  easting: number;
  northing: number;
  subseaTvd: number;
  xOffset: number; // relative to wellhead/slot
  yOffset: number; // relative to wellhead/slot
  zOffset: number; // relative to wellhead/slot (equal to TVD)
  dls: number;     // Dogleg Severity (deg/30m or deg/100ft)
}

export interface WellheadReference {
  easting: number;
  northing: number;
  elevation: number; // KB elevation above sea level
  unit: 'metric' | 'imperial';
}

/**
 * Calculates the 3D trajectory from raw survey points using the Minimum Curvature Method.
 */
export function calculateMCM(
  stations: RawStation[],
  reference: WellheadReference
): CalculatedStation[] {
  if (stations.length === 0) return [];

  // Sort stations by Measured Depth (MD) to ensure sequential calculation
  const sorted = [...stations].sort((a, b) => a.measuredDepth - b.measuredDepth);

  const result: CalculatedStation[] = [];

  // Initial station (station 0)
  const first = sorted[0];
  const firstTvd = first.measuredDepth === 0 ? 0 : first.measuredDepth; // Default TVD is equal to MD at start if not starting at 0
  const firstEasting = reference.easting;
  const firstNorthing = reference.northing;
  const firstSstvd = firstTvd - reference.elevation;
  const firstXOffset = 0;
  const firstYOffset = 0;
  const firstZOffset = firstTvd;
  const firstDls = 0;

  result.push({
    ...first,
    tvd: Number(firstTvd.toFixed(4)),
    easting: Number(firstEasting.toFixed(4)),
    northing: Number(firstNorthing.toFixed(4)),
    subseaTvd: Number(firstSstvd.toFixed(4)),
    xOffset: Number(firstXOffset.toFixed(4)),
    yOffset: Number(firstYOffset.toFixed(4)),
    zOffset: Number(firstZOffset.toFixed(4)),
    dls: Number(firstDls.toFixed(4)),
  });

  const degToRad = Math.PI / 180;
  const radToDeg = 180 / Math.PI;

  for (let i = 1; i < sorted.length; i++) {
    const s1 = sorted[i - 1];
    const s2 = sorted[i];

    const prevCalc = result[i - 1];

    const md1 = s1.measuredDepth;
    const md2 = s2.measuredDepth;
    const deltaMd = md2 - md1;

    if (deltaMd <= 0) {
      // Duplicated or out-of-order station; propagate previous values
      result.push({
        ...s2,
        tvd: prevCalc.tvd,
        easting: prevCalc.easting,
        northing: prevCalc.northing,
        subseaTvd: prevCalc.subseaTvd,
        xOffset: prevCalc.xOffset,
        yOffset: prevCalc.yOffset,
        zOffset: prevCalc.zOffset,
        dls: 0,
      });
      continue;
    }

    const inc1 = s1.inclination * degToRad;
    const inc2 = s2.inclination * degToRad;
    const az1 = s1.azimuth * degToRad;
    const az2 = s2.azimuth * degToRad;

    // Subtended angle (alpha) calculation
    // cos(alpha) = cos(inc2 - inc1) - sin(inc1)*sin(inc2)*(1 - cos(az2 - az1))
    const cosAlpha = Math.cos(inc2 - inc1) - Math.sin(inc1) * Math.sin(inc2) * (1 - Math.cos(az2 - az1));
    // Clamp cosAlpha to [-1, 1] to prevent floating point inaccuracies from yielding NaN in arccos
    const clampedCosAlpha = Math.max(-1, Math.min(1, cosAlpha));
    const alpha = Math.acos(clampedCosAlpha);

    // Ratio Factor F
    let F = 1.0;
    if (alpha > 1e-6) {
      F = (2.0 / alpha) * Math.tan(alpha / 2.0);
    }

    // Coordinate increments
    const deltaTvd = (deltaMd / 2.0) * (Math.cos(inc1) + Math.cos(inc2)) * F;
    const deltaNorthing = (deltaMd / 2.0) * (Math.sin(inc1) * Math.cos(az1) + Math.sin(inc2) * Math.cos(az2)) * F;
    const deltaEasting = (deltaMd / 2.0) * (Math.sin(inc1) * Math.sin(az1) + Math.sin(inc2) * Math.sin(az2)) * F;

    // Dogleg Severity (DLS)
    // Ref distance is 30m for Metric, 100ft for Imperial
    const refDistance = reference.unit === 'metric' ? 30 : 100;
    const alphaDeg = alpha * radToDeg;
    const dls = (alphaDeg / deltaMd) * refDistance;

    const tvd = prevCalc.tvd + deltaTvd;
    const easting = prevCalc.easting + deltaEasting;
    const northing = prevCalc.northing + deltaNorthing;
    const sstvd = tvd - reference.elevation;
    const xOffset = easting - reference.easting;
    const yOffset = northing - reference.northing;
    const zOffset = tvd;

    result.push({
      measuredDepth: s2.measuredDepth,
      inclination: s2.inclination,
      azimuth: s2.azimuth,
      tvd: Number(tvd.toFixed(4)),
      easting: Number(easting.toFixed(4)),
      northing: Number(northing.toFixed(4)),
      subseaTvd: Number(sstvd.toFixed(4)),
      xOffset: Number(xOffset.toFixed(4)),
      yOffset: Number(yOffset.toFixed(4)),
      zOffset: Number(zOffset.toFixed(4)),
      dls: Number(dls.toFixed(4)),
    });
  }

  return result;
}
