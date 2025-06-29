import { getPositionByName } from './aredlAPI.js';
import { pointsLevel } from './pointsCalculator.js';
import tierData from './tierConfig.json' assert { type: 'json' };
/**
 * Numbers of decimal digits to round to
 */
const scale = 2;

export function pointsLevel(maxPoints, minPoints, position, upperLimit, lowerLimit) {
  let allLevels = lowerLimit - upperLimit + 1;
  let newPosition = position - upperLimit + 1;
  let b = (allLevels - 1) / 50 * 1 / (Math.pow((100 + maxPoints) / (101 + minPoints), 2) - 1);
  let a = (100 + maxPoints) * Math.sqrt(b);
  let finalPoint = a / Math.sqrt((newPosition - 1) / 50 + b) - 100;
  return round(finalPoint);
}

async function calculateTierLevelPoints(levelName, tierKey) {
  const tier = tierData[tierKey];
  if (!tier) {
    console.error("Tier not found:", tierKey);
    return;
  }

  const position = await getPositionByName(levelName);
  const upperLimit = await getPositionByName(tier.upperLimitName);
  const lowerLimit = await getPositionByName(tier.lowerLimitName);

  if (position === null || upperLimit === null || lowerLimit === null) {
    console.error("Failed to find one or more positions.");
    return;
  }

  const { maxPoints, minPoints } = tier;
  const finalPoint = pointsLevel(maxPoints, minPoints, position, upperLimit, lowerLimit);
  console.log(`Final Points for ${levelName} (Tier ${tierKey}):`, finalPoint);
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
