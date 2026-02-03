// Smart cheat logic for Yahtzee
// Only works for player "Sander" - generates guaranteed dice outcomes

/**
 * Get which dice values are currently held
 * @param {number[]} dice - Current dice values [1-6]
 * @param {boolean[]} heldDice - Which dice are held
 * @returns {number[]} - Array of held dice values
 */
export function getHeldValues(dice, heldDice) {
    return dice.filter((_, i) => heldDice[i]);
}

/**
 * Get indices of dice that are NOT held (will be rolled)
 * @param {boolean[]} heldDice - Which dice are held
 * @returns {number[]} - Indices of dice to roll
 */
export function getUnheldIndices(heldDice) {
    return heldDice.map((held, i) => held ? -1 : i).filter(i => i !== -1);
}

/**
 * Check if a large straight is achievable with the held dice
 * Large straight: 1-2-3-4-5 or 2-3-4-5-6
 */
function canAchieveLargeStraight(heldValues, unheldCount) {
    const validStraights = [
        [1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6]
    ];

    for (const straight of validStraights) {
        const needed = straight.filter(n => !heldValues.includes(n));
        // Check if held values are all part of this straight (no duplicates allowed)
        const heldAreValid = heldValues.every(v => straight.includes(v));
        const noDuplicates = new Set(heldValues).size === heldValues.length;

        if (heldAreValid && noDuplicates && needed.length <= unheldCount) {
            return { possible: true, needed, straight };
        }
    }
    return { possible: false };
}

/**
 * Check if a small straight is achievable with the held dice
 * Small straight: 1-2-3-4, 2-3-4-5, or 3-4-5-6
 */
function canAchieveSmallStraight(heldValues, unheldCount) {
    const validStraights = [
        [1, 2, 3, 4],
        [2, 3, 4, 5],
        [3, 4, 5, 6]
    ];

    for (const straight of validStraights) {
        const needed = straight.filter(n => !heldValues.includes(n));
        // Check if held values could be part of this straight
        // For small straight, we can have one extra die
        const heldInStraight = heldValues.filter(v => straight.includes(v));
        const extraDice = heldValues.length - heldInStraight.length;

        // Allow at most 1 extra die (5 dice total, need 4 for small straight)
        if (extraDice <= 1 && needed.length <= unheldCount) {
            return { possible: true, needed, straight };
        }
    }
    return { possible: false };
}

/**
 * Check if Yahtzee (5 of a kind) is achievable
 */
function canAchieveYahtzee(heldValues, unheldCount) {
    if (heldValues.length === 0) {
        // No dice held - pick a random number
        const target = Math.floor(Math.random() * 6) + 1;
        return { possible: true, target, needed: [target, target, target, target, target] };
    }

    // All held dice must be the same value
    const uniqueHeld = new Set(heldValues);
    if (uniqueHeld.size !== 1) {
        return { possible: false };
    }

    const target = heldValues[0];
    const needed = Array(unheldCount).fill(target);
    return { possible: true, target, needed };
}

/**
 * Check if N of a kind is achievable (3 or 4 of a kind)
 */
function canAchieveNOfAKind(heldValues, unheldCount, n) {
    // Count occurrences of each value in held dice
    const counts = {};
    heldValues.forEach(v => counts[v] = (counts[v] || 0) + 1);

    // Find the best candidate (most frequent held value)
    let bestValue = null;
    let bestCount = 0;

    for (const [value, count] of Object.entries(counts)) {
        if (count > bestCount) {
            bestCount = count;
            bestValue = parseInt(value);
        }
    }

    // If no held dice, pick a high number for max score
    if (bestValue === null) {
        bestValue = 6;
        bestCount = 0;
    }

    const stillNeeded = Math.max(0, n - bestCount);

    if (stillNeeded <= unheldCount) {
        // Fill remaining with high numbers for better score
        const needed = Array(stillNeeded).fill(bestValue);
        const remaining = unheldCount - stillNeeded;
        for (let i = 0; i < remaining; i++) {
            needed.push(6); // Fill with 6s for max score
        }
        return { possible: true, target: bestValue, needed };
    }

    return { possible: false };
}

/**
 * Check if Full House is achievable (3 of one kind, 2 of another)
 */
function canAchieveFullHouse(heldValues, unheldCount) {
    const counts = {};
    heldValues.forEach(v => counts[v] = (counts[v] || 0) + 1);

    const values = Object.entries(counts).map(([v, c]) => ({ value: parseInt(v), count: c }));

    // Various scenarios based on what's held
    if (values.length === 0) {
        // No held dice - make 6,6,6,5,5
        return { possible: true, needed: [6, 6, 6, 5, 5] };
    }

    if (values.length === 1) {
        // All held are same value
        const { value, count } = values[0];
        if (count <= 3) {
            // Need to complete the three, then add a pair
            const threeNeeded = 3 - count;
            const twoValue = value === 6 ? 5 : 6;
            const needed = [
                ...Array(threeNeeded).fill(value),
                ...Array(Math.min(2, unheldCount - threeNeeded)).fill(twoValue)
            ];
            if (needed.length <= unheldCount) {
                return { possible: true, needed };
            }
        } else if (count === 4) {
            // Have 4 of a kind - need 1 different for full house? No, that's not full house
            // Actually we'd need to NOT hold one, so this isn't achievable as-is
            return { possible: false };
        } else if (count === 5) {
            // Already Yahtzee - counts as full house
            return { possible: true, needed: [] };
        }
    }

    if (values.length === 2) {
        // Two different values held
        const sorted = values.sort((a, b) => b.count - a.count);
        const [higher, lower] = sorted;

        // Check if we can make full house with these two values
        const needForThree = Math.max(0, 3 - higher.count);
        const needForTwo = Math.max(0, 2 - lower.count);
        const totalNeeded = needForThree + needForTwo;

        if (totalNeeded <= unheldCount) {
            const needed = [
                ...Array(needForThree).fill(higher.value),
                ...Array(needForTwo).fill(lower.value)
            ];
            return { possible: true, needed };
        }
    }

    // More than 2 different values held - can't make full house
    return { possible: false };
}

/**
 * Get all achievable categories based on currently held dice
 * @param {number[]} dice - Current dice values
 * @param {boolean[]} heldDice - Which dice are held
 * @param {Object} scorecard - Player's current scorecard (to exclude already scored)
 * @returns {Object[]} - Array of { category, label } that can be achieved
 */
export function getAchievableCategories(dice, heldDice, scorecard = {}) {
    const heldValues = getHeldValues(dice, heldDice);
    const unheldCount = heldDice.filter(h => !h).length;

    const achievable = [];

    // Upper section - always achievable (just might score 0)
    // But for cheat mode, only show if we can get a good score
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

        // Check if we can get at least 3 of this number
        const heldOfValue = heldValues.filter(v => v === value).length;
        const canGet = heldOfValue + unheldCount >= 3;

        if (canGet) {
            achievable.push({ category: key, label: `${label} (${value * 5} pts)` });
        }
    }

    // Lower section
    if ((scorecard.threeOfAKind === null || scorecard.threeOfAKind === undefined) &&
        canAchieveNOfAKind(heldValues, unheldCount, 3).possible) {
        achievable.push({ category: 'threeOfAKind', label: '3 of a Kind' });
    }

    if ((scorecard.fourOfAKind === null || scorecard.fourOfAKind === undefined) &&
        canAchieveNOfAKind(heldValues, unheldCount, 4).possible) {
        achievable.push({ category: 'fourOfAKind', label: '4 of a Kind' });
    }

    if ((scorecard.fullHouse === null || scorecard.fullHouse === undefined) &&
        canAchieveFullHouse(heldValues, unheldCount).possible) {
        achievable.push({ category: 'fullHouse', label: 'Full House (25 pts)' });
    }

    if ((scorecard.smallStraight === null || scorecard.smallStraight === undefined) &&
        canAchieveSmallStraight(heldValues, unheldCount).possible) {
        achievable.push({ category: 'smallStraight', label: 'Small Straight (30 pts)' });
    }

    if ((scorecard.largeStraight === null || scorecard.largeStraight === undefined) &&
        canAchieveLargeStraight(heldValues, unheldCount).possible) {
        achievable.push({ category: 'largeStraight', label: 'Large Straight (40 pts)' });
    }

    if ((scorecard.yahtzee === null || scorecard.yahtzee === undefined) &&
        canAchieveYahtzee(heldValues, unheldCount).possible) {
        achievable.push({ category: 'yahtzee', label: 'YAHTZEE! (50 pts)' });
    }

    // Chance is always achievable - aim for max score
    if (scorecard.chance === null || scorecard.chance === undefined) {
        achievable.push({ category: 'chance', label: 'Chance (30 pts)' });
    }

    return achievable;
}

/**
 * Generate the exact dice values needed to achieve a category
 * @param {number[]} dice - Current dice values
 * @param {boolean[]} heldDice - Which dice are held
 * @param {string} targetCategory - The category to achieve
 * @returns {number[]} - New dice array with guaranteed outcome
 */
export function generateCheatDice(dice, heldDice, targetCategory) {
    const heldValues = getHeldValues(dice, heldDice);
    const unheldIndices = getUnheldIndices(heldDice);
    const newDice = [...dice];

    let neededValues = [];

    switch (targetCategory) {
        case 'ones':
            neededValues = Array(unheldIndices.length).fill(1);
            break;
        case 'twos':
            neededValues = Array(unheldIndices.length).fill(2);
            break;
        case 'threes':
            neededValues = Array(unheldIndices.length).fill(3);
            break;
        case 'fours':
            neededValues = Array(unheldIndices.length).fill(4);
            break;
        case 'fives':
            neededValues = Array(unheldIndices.length).fill(5);
            break;
        case 'sixes':
            neededValues = Array(unheldIndices.length).fill(6);
            break;

        case 'threeOfAKind': {
            const result = canAchieveNOfAKind(heldValues, unheldIndices.length, 3);
            neededValues = result.needed || Array(unheldIndices.length).fill(6);
            break;
        }

        case 'fourOfAKind': {
            const result = canAchieveNOfAKind(heldValues, unheldIndices.length, 4);
            neededValues = result.needed || Array(unheldIndices.length).fill(6);
            break;
        }

        case 'fullHouse': {
            const result = canAchieveFullHouse(heldValues, unheldIndices.length);
            neededValues = result.needed || [6, 6, 6, 5, 5].slice(0, unheldIndices.length);
            break;
        }

        case 'smallStraight': {
            const result = canAchieveSmallStraight(heldValues, unheldIndices.length);
            if (result.possible) {
                neededValues = [...result.needed];
                // Fill any extra slots with a random valid number
                while (neededValues.length < unheldIndices.length) {
                    neededValues.push(result.straight[0]);
                }
            } else {
                neededValues = [1, 2, 3, 4].slice(0, unheldIndices.length);
            }
            break;
        }

        case 'largeStraight': {
            const result = canAchieveLargeStraight(heldValues, unheldIndices.length);
            if (result.possible) {
                neededValues = result.needed;
            } else {
                neededValues = [1, 2, 3, 4, 5].slice(0, unheldIndices.length);
            }
            break;
        }

        case 'yahtzee': {
            const result = canAchieveYahtzee(heldValues, unheldIndices.length);
            if (result.possible) {
                neededValues = result.needed;
            } else {
                neededValues = Array(unheldIndices.length).fill(6);
            }
            break;
        }

        case 'chance':
            // All 6s for max score
            neededValues = Array(unheldIndices.length).fill(6);
            break;

        default:
            // Random fallback
            neededValues = unheldIndices.map(() => Math.floor(Math.random() * 6) + 1);
    }

    // Apply the needed values to the unheld positions
    unheldIndices.forEach((dieIndex, i) => {
        newDice[dieIndex] = neededValues[i] || 6;
    });

    return newDice;
}

/**
 * Check if the player name qualifies for cheat mode
 */
export function isCheatEnabled(playerName) {
    if (!playerName) return false;
    const name = playerName.toLowerCase();
    return name.includes('sander');
}
