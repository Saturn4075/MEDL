import { getPositionByName } from './aredlAPI.js';
import { pointsLevel } from './pointsCalculator.js';
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

async function calculateLevelPoints(targetLevelName, upperLimitName, lowerLimitName, maxPoints, minPoints) {
  const position = await getPositionByName(targetLevelName);
  const upperLimit = await getPositionByName(upperLimitName);
  const lowerLimit = await getPositionByName(lowerLimitName);

  if (position === null || upperLimit === null || lowerLimit === null) {
    console.error("Failed to find one or more level positions.");
    return;
  }

  const finalPoint = pointsLevel(maxPoints, minPoints, position, upperLimit, lowerLimit);
  console.log(`Final Points for ${targetLevelName}:`, finalPoint);
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
