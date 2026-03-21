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
                            records: level.records.sort(
                                (a, b) => b.percent - a.percent,
                            ),
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
    const errs = [];

    // Step 1: Parse all level JSON files (original logic)
    const list = await fetchList(); // fetches all level JSONs
    const scoreMap = {};

    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        // Verification
        const verifier = Object.keys(scoreMap).find(
            u => u.toLowerCase() === (level.verifier || "").toLowerCase()
        ) || level.verifier;

        scoreMap[verifier] ??= { verified: [], completed: [], progressed: [] };
        const { verified } = scoreMap[verifier];
        if (level.verification) {
            verified.push({
                rank: rank + 1,
                level: level.name,
                score: level.points, // or keep your points function
                link: level.verification
            });
        }

        // Records
        level.records.forEach(record => {
            const user = Object.keys(scoreMap).find(
                u => u.toLowerCase() === record.user.toLowerCase()
            ) || record.user;
            scoreMap[user] ??= { verified: [], completed: [], progressed: [] };
            const { completed, progressed } = scoreMap[user];

            if (record.percent === 100) {
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: record.score || level.points,
                    link: record.link
                });
            } else {
                progressed.push({
                    rank: rank + 1,
                    level: level.name,
                    percent: record.percent,
                    score: record.score || level.points,
                    link: record.link
                });
            }
        });
    });

    // Step 2: Fetch live totals from Apps Script
    let manualTotals = {};
    try {
        const r = await fetch("https://script.google.com/macros/s/AKfycbyzbhaK2tp0oPvH21mehqi53bew43w7QOBdXgbFZ_WYebHUc-oK0D2h-UhLLfbIAPYhgA/exec?type=leaderboard");
        const data = await r.json();
        data.forEach(p => {
            manualTotals[p.user.toLowerCase()] = p.total;
        });
    } catch (err) {
        console.warn("Leaderboard API failed", err);
    }

    // Step 3: Merge records with manual totals
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;

        // Use manual total if exists, otherwise sum calculated points
        const calculatedTotal = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        const total = manualTotals[user.toLowerCase()] ?? calculatedTotal;

        return { user, total, ...scores };
    });

    // Sort by total descending
    return [res.sort((a, b) => b.total - a.total), errs];
}
