import { getPositionByName } from './aredlAPI.js';
import { pointsLevel } from './pointsCalculator.js';
const tierData = await import('./tierConfig.json', {
  assert: { type: 'json' }
});
/**
 * Numbers of decimal digits to round to
 */
const scale = 2;

const positionCache = {};

export async function preloadTierPositions() {
  for (const tierKey of Object.keys(tierData)) {
    const { upperLimitName, lowerLimitName } = tierData[tierKey];
    const upperLimit = await getPositionByName(upperLimitName);
    const lowerLimit = await getPositionByName(lowerLimitName);
    positionCache[tierKey] = { upperLimit, lowerLimit };
  }
    
}
export function pointsLevel(maxPoints, minPoints, position, upperLimit, lowerLimit) {
  let allLevels = lowerLimit - upperLimit + 1;
  let newPosition = position - upperLimit + 1;
  let b = (allLevels - 1) / 50 * 1 / (Math.pow((100 + maxPoints) / (101 + minPoints), 2) - 1);
  let a = (100 + maxPoints) * Math.sqrt(b);
  let finalPoint = a / Math.sqrt((newPosition - 1) / 50 + b) - 100;
  return round(finalPoint);
}

export async function score(levelName, tier) {
  if (!tierData[tier]) {
    console.warn(`Tier ${tier} not found`);
    return 0;
  }
  if (!positionCache[tier]) {
    console.warn(`Positions for tier ${tier} not loaded`);
    return 0;
  }

  const { maxPoints, minPoints } = tierData[tier];
  const { upperLimit, lowerLimit } = positionCache[tier];

  const position = await getPositionByName(levelName);
  if (position === null) {
    console.warn(`Level position for ${levelName} not found`);
    return 0;
  }

  return pointsLevel(maxPoints, minPoints, position, upperLimit, lowerLimit);
}

export function round(num) {
    if (!('' + num).includes('e')) {
        return +(Math.round(num + 'e+' + scale) + 'e-' + scale);
    } else {
        var arr = ('' + num).split('e');
        var sig = '';
        if (+arr[1] + scale > 0) {
            sig = '+';
        }
        return +(
            Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) +
            'e-' +
            scale
        );
    }
}
