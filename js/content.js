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

    try {

        const res = await fetch("https://script.google.com/macros/s/AKfycbyzbhaK2tp0oPvH21mehqi53bew43w7QOBdXgbFZ_WYebHUc-oK0D2h-UhLLfbIAPYhgA/exec?type=leaderboard");
        const data = await res.json();

        const resFormatted = data.map(player => ({
            user: player.user,
            total: player.total,
            verified: [],
            completed: [],
            progressed: []
        }));

        return [resFormatted.sort((a,b)=>b.total-a.total), errs];

    } catch (err) {

        console.error(err);
        errs.push("Leaderboard failed to load");
        return [[], errs];

    }
}
