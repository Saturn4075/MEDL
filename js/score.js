import { getPositionByName } from './aredl.js';

let tierData = null;
const positionCache = {};
const levelCache = {};

/**
 * Load tier configuration JSON
 */
export async function loadTierData() {
  const res = await fetch('./tierConfig.json');
  tierData = await res.json();
}

/**
 * Preload upper and lower limit positions for each tier
 */
export async function preloadTierPositions() {
  for (const tierKey of Object.keys(tierData)) {
    const { upperLimitName, lowerLimitName } = tierData[tierKey];
    const upperLimit = await getPositionByName(upperLimitName);
    const lowerLimit = await getPositionByName(lowerLimitName);
    positionCache[tierKey] = { upperLimit, lowerLimit };
  }
}

/**
 * Preload all levels' JSON data into cache
 * @param {string[]} list - array of level file names (without .json)
 */
export async function preloadLevels(list) {
  await Promise.all(
    list.map(async (path) => {
      try {
        const res = await fetch(`MEDL/data/${path}.json`);
        if (!res.ok) throw new Error(`Failed to fetch ${path}.json`);
        const level = await res.json();
        levelCache[level.name] = level;
      } catch (e) {
        console.warn(e);
      }
    }),
  );
}

/**
 * Rounds a number to fixed decimal places
 */
const scale = 2;
export function round(num) {
  if (!('' + num).includes('e')) {
    return +(
      Math.round(num + 'e+' + scale) + 'e-' + scale
    );
  } else {
    const arr = ('' + num).split('e');
    const sig = +arr[1] + scale > 0 ? '+' : '';
    return +(
      Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) + 'e-' + scale
    );
  }
}

/**
 * Points calculation formula
 */
export function pointsLevel(maxPoints, minPoints, position, upperLimit, lowerLimit) {
  let allLevels = lowerLimit - upperLimit + 1;
  let newPosition = position - upperLimit + 1;
  let b = (allLevels - 1) / 50 * 1 / (Math.pow((100 + maxPoints) / (101 + minPoints), 2) - 1);
  let a = (100 + maxPoints) * Math.sqrt(b);
  let finalPoint = a / Math.sqrt((newPosition - 1) / 50 + b) - 100;
  return round(finalPoint);
}

/**
 * Score calculation using cached level data and tier info
 * @param {string} levelName - name of the level
 * @returns {number} calculated score
 */
export async function scoreCached(levelName) {
  const level = levelCache[levelName];
  if (!level) {
    console.warn(`Level data for ${levelName} not found in cache.`);
    return 0;
  }
  const tier = level.tier;
  if (!tierData || !tierData[tier]) {
    console.warn(`Tier "${tier}" not found in tier data.`);
    return 0;
  }
  if (!positionCache[tier]) {
    console.warn(`Positions for tier "${tier}" not loaded.`);
    return 0;
  }

  const { maxPoints, minPoints } = tierData[tier];
  const { upperLimit, lowerLimit } = positionCache[tier];
  const position = await getPositionByName(levelName);

  if (position === null || position === undefined) {
    console.warn(`Position for level "${levelName}" not found.`);
    return 0;
  }

  return pointsLevel(maxPoints, minPoints, position, upperLimit, lowerLimit);
}
