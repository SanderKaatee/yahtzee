// Client-side cheat utilities
// Mirrors some logic from server for UI purposes

/**
 * Get which dice values are currently held
 */
export function getHeldValues(dice, heldDice) {
    return dice.filter((_, i) => heldDice[i]);
}

/**
 * Check if the player name qualifies for cheat mode
 */
export function isCheatEnabled(playerName) {
    if (!playerName) return false;
    const name = playerName.toLowerCase();
    return name.includes('sander');
}

/**
 * Check if a large straight is achievable with the held dice
 */
function canAchieveLargeStraight(heldValues, unheldCount) {
    const validStraights = [
        [1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6]
    ];

    for (const straight of validStraights) {
        const needed = straight.filter(n => !heldValues.includes(n));
        const heldAreValid = heldValues.every(v => straight.includes(v));
        const noDuplicates = new Set(heldValues).size === heldValues.length;

        if (heldAreValid && noDuplicates && needed.length <= unheldCount) {
            return true;
        }
    }
    return false;
}

/**
 * Check if a small straight is achievable with the held dice
 */
function canAchieveSmallStraight(heldValues, unheldCount) {
    const validStraights = [
        [1, 2, 3, 4],
        [2, 3, 4, 5],
        [3, 4, 5, 6]
    ];

    for (const straight of validStraights) {
        const needed = straight.filter(n => !heldValues.includes(n));
        const heldInStraight = heldValues.filter(v => straight.includes(v));
        const extraDice = heldValues.length - heldInStraight.length;

        if (extraDice <= 1 && needed.length <= unheldCount) {
            return true;
        }
    }
    return false;
}

/**
 * Check if Yahtzee is achievable
 */
function canAchieveYahtzee(heldValues, unheldCount) {
    if (heldValues.length === 0) return true;
    const uniqueHeld = new Set(heldValues);
    return uniqueHeld.size === 1;
}

/**
 * Check if N of a kind is achievable
 */
function canAchieveNOfAKind(heldValues, unheldCount, n) {
    const counts = {};
    heldValues.forEach(v => counts[v] = (counts[v] || 0) + 1);

    let bestCount = 0;
    for (const count of Object.values(counts)) {
        if (count > bestCount) bestCount = count;
    }

    if (heldValues.length === 0) bestCount = 0;

    const stillNeeded = Math.max(0, n - bestCount);
    return stillNeeded <= unheldCount;
}

/**
 * Check if Full House is achievable
 */
function canAchieveFullHouse(heldValues, unheldCount) {
    const counts = {};
    heldValues.forEach(v => counts[v] = (counts[v] || 0) + 1);

    const values = Object.entries(counts).map(([v, c]) => ({ value: parseInt(v), count: c }));

    if (values.length === 0) return true;
    if (values.length === 1) {
        const { count } = values[0];
        return count <= 3 && (3 - count) + 2 <= unheldCount + count;
    }
    if (values.length === 2) {
        const sorted = values.sort((a, b) => b.count - a.count);
        const [higher, lower] = sorted;
        const needForThree = Math.max(0, 3 - higher.count);
        const needForTwo = Math.max(0, 2 - lower.count);
        return (needForThree + needForTwo) <= unheldCount;
    }
    return false;
}

/**
 * Get all achievable categories based on currently held dice
 */
export function getAchievableCategories(dice, heldDice, scorecard = {}) {
    const heldValues = getHeldValues(dice, heldDice);
    const unheldCount = heldDice.filter(h => !h).length;

    const achievable = [];

    // Upper section
    const upperCategories = [
        { key: 'ones', value: 1, label: 'Ones' },
        { key: 'twos', value: 2, label: 'Twos' },
        { key: 'threes', value: 3, label: 'Threes' },
        { key: 'fours', value: 4, label: 'Fours' },
        { key: 'fives', value: 5, label: 'Fives' },
        { key: 'sixes', value: 6, label: 'Sixes' }
    ];

    for (const { key, value, label } of upperCategories) {
        if (scorecard[key] !== null && scorecard[key] !== undefined) continue;

        const heldOfValue = heldValues.filter(v => v === value).length;
        const canGet = heldOfValue + unheldCount >= 3;

        if (canGet) {
            achievable.push({ category: key, label: `${label} (${value * 5} pts)` });
        }
    }

    // Lower section
    if ((scorecard.threeOfAKind === null || scorecard.threeOfAKind === undefined) &&
        canAchieveNOfAKind(heldValues, unheldCount, 3)) {
        achievable.push({ category: 'threeOfAKind', label: '3 of a Kind' });
    }

    if ((scorecard.fourOfAKind === null || scorecard.fourOfAKind === undefined) &&
        canAchieveNOfAKind(heldValues, unheldCount, 4)) {
        achievable.push({ category: 'fourOfAKind', label: '4 of a Kind' });
    }

    if ((scorecard.fullHouse === null || scorecard.fullHouse === undefined) &&
        canAchieveFullHouse(heldValues, unheldCount)) {
        achievable.push({ category: 'fullHouse', label: 'Full House (25 pts)' });
    }

    if ((scorecard.smallStraight === null || scorecard.smallStraight === undefined) &&
        canAchieveSmallStraight(heldValues, unheldCount)) {
        achievable.push({ category: 'smallStraight', label: 'Small Straight (30 pts)' });
    }

    if ((scorecard.largeStraight === null || scorecard.largeStraight === undefined) &&
        canAchieveLargeStraight(heldValues, unheldCount)) {
        achievable.push({ category: 'largeStraight', label: 'Large Straight (40 pts)' });
    }

    if ((scorecard.yahtzee === null || scorecard.yahtzee === undefined) &&
        canAchieveYahtzee(heldValues, unheldCount)) {
        achievable.push({ category: 'yahtzee', label: 'YAHTZEE! (50 pts)' });
    }

    if (scorecard.chance === null || scorecard.chance === undefined) {
        achievable.push({ category: 'chance', label: 'Chance (30 pts)' });
    }

    return achievable;
}
