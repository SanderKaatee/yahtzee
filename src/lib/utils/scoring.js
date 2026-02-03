// Client-side scoring calculations for preview

function getCounts(dice) {
  const counts = [0, 0, 0, 0, 0, 0];
  dice.forEach(d => counts[d - 1]++);
  return counts;
}

function sumOfNumber(dice, num) {
  return dice.filter(d => d === num).reduce((a, b) => a + b, 0);
}

function totalSum(dice) {
  return dice.reduce((a, b) => a + b, 0);
}

function hasNOfAKind(counts, n) {
  return counts.some(c => c >= n);
}

function isFullHouse(counts) {
  const hasThree = counts.includes(3);
  const hasTwo = counts.includes(2);
  return (hasThree && hasTwo) || counts.includes(5);
}

function hasSmallStraight(dice) {
  const unique = [...new Set(dice)].sort();
  const str = unique.join('');
  return str.includes('1234') || str.includes('2345') || str.includes('3456');
}

function hasLargeStraight(dice) {
  const unique = [...new Set(dice)].sort();
  const str = unique.join('');
  return str === '12345' || str === '23456';
}

export function calculateScore(dice, category) {
  if (!dice || dice.length !== 5) return 0;
  
  const counts = getCounts(dice);
  const sum = totalSum(dice);
  
  switch (category) {
    case 'ones': return sumOfNumber(dice, 1);
    case 'twos': return sumOfNumber(dice, 2);
    case 'threes': return sumOfNumber(dice, 3);
    case 'fours': return sumOfNumber(dice, 4);
    case 'fives': return sumOfNumber(dice, 5);
    case 'sixes': return sumOfNumber(dice, 6);
    case 'threeOfAKind': return hasNOfAKind(counts, 3) ? sum : 0;
    case 'fourOfAKind': return hasNOfAKind(counts, 4) ? sum : 0;
    case 'fullHouse': return isFullHouse(counts) ? 25 : 0;
    case 'smallStraight': return hasSmallStraight(dice) ? 30 : 0;
    case 'largeStraight': return hasLargeStraight(dice) ? 40 : 0;
    case 'yahtzee': return hasNOfAKind(counts, 5) ? 50 : 0;
    case 'chance': return sum;
    default: return 0;
  }
}

export function calculateUpperBonus(scorecard) {
  const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
  const upperSum = upperCategories.reduce((sum, cat) => sum + (scorecard[cat] ?? 0), 0);
  return upperSum >= 63 ? 35 : 0;
}

export function calculateUpperTotal(scorecard) {
  const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
  return upperCategories.reduce((sum, cat) => sum + (scorecard[cat] ?? 0), 0);
}

export function calculateLowerTotal(scorecard) {
  const lowerCategories = [
    'threeOfAKind', 'fourOfAKind', 'fullHouse',
    'smallStraight', 'largeStraight', 'yahtzee', 'chance'
  ];
  return lowerCategories.reduce((sum, cat) => sum + (scorecard[cat] ?? 0), 0) + (scorecard.yahtzeeBonus || 0);
}

export function calculateTotalScore(scorecard) {
  return calculateUpperTotal(scorecard) + calculateUpperBonus(scorecard) + calculateLowerTotal(scorecard);
}

export const CATEGORIES = {
  upper: [
    { key: 'ones', label: 'Ones', description: 'Sum of all ones' },
    { key: 'twos', label: 'Twos', description: 'Sum of all twos' },
    { key: 'threes', label: 'Threes', description: 'Sum of all threes' },
    { key: 'fours', label: 'Fours', description: 'Sum of all fours' },
    { key: 'fives', label: 'Fives', description: 'Sum of all fives' },
    { key: 'sixes', label: 'Sixes', description: 'Sum of all sixes' }
  ],
  lower: [
    { key: 'threeOfAKind', label: '3 of a Kind', description: 'Sum of all dice' },
    { key: 'fourOfAKind', label: '4 of a Kind', description: 'Sum of all dice' },
    { key: 'fullHouse', label: 'Full House', description: '25 points' },
    { key: 'smallStraight', label: 'Sm. Straight', description: '30 points' },
    { key: 'largeStraight', label: 'Lg. Straight', description: '40 points' },
    { key: 'yahtzee', label: 'Yahtzee', description: '50 points' },
    { key: 'chance', label: 'Chance', description: 'Sum of all dice' }
  ]
};
