import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';

export async function fetchList() {
  const listResult = await fetch(`${dir}/_list.json`);
  try {
    const list = await listResult.json();
    return await Promise.all(
      list.map(async (path, rank) => {
        const levelResult = await fetch(`${dir}/${path}.json`);
        try {
          const level = await levelResult.json();
          return [
            {
              ...level,
              path,
              records: level.records.sort((a, b) => b.percent - a.percent),
            },
            null,
          ];
        } catch {
          console.error(`Failed to load level #${rank + 1} ${path}.`);
          return [null, path];
        }
      }),
    );
  } catch {
    console.error(`Failed to load list.`);
    return null;
  }
}

export async function fetchEditors() {
  try {
    const editorsResults = await fetch(`${dir}/_editors.json`);
    const editors = await editorsResults.json();
    return editors;
  } catch {
    return null;
  }
}

export async function fetchLeaderboard() {
  const list = await fetchList();

  const scoreMap = {};
  const errs = [];

  let rank = 0;
  for (const [level, err] of list) {
    rank++; // because we don't have the index from forEach anymore
    if (err) {
      errs.push(err);
      continue;
    }

    // Verification
    const first = Object.keys(scoreMap).find(
      (u) => u.toLowerCase() === level.first.toLowerCase(),
    ) || level.first;

    scoreMap[first] ??= {
      verified: [],
      completed: [],
      progressed: [],
    };

    const verifiedScore = await score(level.name, level.tier);
    scoreMap[first].verified.push({
      rank: rank,
      level: level.name,
      score: verifiedScore * 1.3,
      link: level.verification,
    });

    // Records
    for (const record of level.records) {
      const user = Object.keys(scoreMap).find(
        (u) => u.toLowerCase() === record.user.toLowerCase(),
      ) || record.user;

      scoreMap[user] ??= {
        verified: [],
        completed: [],
        progressed: [],
      };

      const recordScore = await score(level.name, level.tier);

      if (record.percent === 100) {
        scoreMap[user].completed.push({
          rank: rank,
          level: level.name,
          score: recordScore,
          link: record.link,
        });
      } else {
        scoreMap[user].progressed.push({
          rank: rank,
          level: level.name,
          percent: record.percent,
          score: recordScore,
          link: record.link,
        });
      }
    }
  }

  // Wrap in extra Object containing the user and total score
  const res = Object.entries(scoreMap).map(([user, scores]) => {
    const { verified, completed, progressed } = scores;
    const total = [verified, completed, progressed]
      .flat()
      .reduce((prev, cur) => prev + cur.score, 0);

    return {
      user,
      total: round(total),
      ...scores,
    };
  });

  // Sort by total score
  return [res.sort((a, b) => b.total - a.total), errs];
}
