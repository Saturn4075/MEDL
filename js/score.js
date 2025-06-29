import { getPositionByName } from './aredl.js';

const scale = 2;

/**
 * Load tier configuration JSON
 */
async function loadTierData() {
  const res = await fetch('./tierConfig.json');
  return await res.json();
}

/**
 * Rounds a number to fixed decimal places
 */
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
 * Score calculation by fetching everything on-demand
 * @param {string} levelName
 * @returns {number}
 */
export async function score(levelName) {
  // Fetch level JSON directly
  const res = await fetch(`MEDL/data/${levelName}.json`);
  if (!res.ok) {
    console.warn(`Failed to fetch ${levelName}.json`);
    return 0;
  }
  const level = await res.json();

  // Load tier config
  const tierData = await loadTierData();

  const tier = level.tier;
  if (!tierData[tier]) {
    console.warn(`Tier "${tier}" not found in tier data.`);
    return 0;
  }

  const { maxPoints, minPoints, upperLimitName, lowerLimitName } = tierData[tier];

  // Fetch upper and lower limit positions
  const upperLimit = await getPositionByName(upperLimitName);
  const lowerLimit = await getPositionByName(lowerLimitName);

  if (upperLimit == null || lowerLimit == null) {
    console.warn(`Missing limit positions for tier "${tier}".`);
    return 0;
  }

  // Fetch position of the level itself
  const position = await getPositionByName(levelName);
  if (position == null) {
    console.warn(`Position for level "${levelName}" not found.`);
    return 0;
  }

  // Calculate and return points
  return pointsLevel(maxPoints, minPoints, position, upperLimit, lowerLimit);
}
