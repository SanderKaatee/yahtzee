// Yahtzee game logic

export function createInitialGameState() {
  return {
    dice: [1, 1, 1, 1, 1],
    heldDice: [false, false, false, false, false],
    rollsLeft: 3,
    turnNumber: 1,
    currentPlayerIndex: 0,
    isRolling: false,
    turnStartTime: null,
    winner: null
  };
}

export function createEmptyScorecard() {
  return {
    // Upper section
    ones: null,
    twos: null,
    threes: null,
    fours: null,
    fives: null,
    sixes: null,
    // Lower section
    threeOfAKind: null,
    fourOfAKind: null,
    fullHouse: null,
    smallStraight: null,
    largeStraight: null,
    yahtzee: null,
    chance: null,
    // Bonus tracking
    yahtzeeBonus: 0
  };
}

export function rollDice(currentDice, heldDice) {
  return currentDice.map((die, i) => 
    heldDice[i] ? die : Math.floor(Math.random() * 6) + 1
  );
}

// Scoring calculations
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
  return (hasThree && hasTwo) || counts.includes(5); // Yahtzee counts as full house
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
  const counts = getCounts(dice);
  const sum = totalSum(dice);
  
  switch (category) {
    case 'ones': return sumOfNumber(dice, 1);
    case 'twos': return sumOfNumber(dice, 2);
    case 'threes': return sumOfNumber(dice, 3);
    case 'fours': return sumOfNumber(dice, 4);
    case 'fives': return sumOfNumber(dice, 5);
    case 'sixes': return sumOfNumber(dice, 6);
    
    case 'threeOfAKind':
      return hasNOfAKind(counts, 3) ? sum : 0;
    
    case 'fourOfAKind':
      return hasNOfAKind(counts, 4) ? sum : 0;
    
    case 'fullHouse':
      return isFullHouse(counts) ? 25 : 0;
    
    case 'smallStraight':
      return hasSmallStraight(dice) ? 30 : 0;
    
    case 'largeStraight':
      return hasLargeStraight(dice) ? 40 : 0;
    
    case 'yahtzee':
      return hasNOfAKind(counts, 5) ? 50 : 0;
    
    case 'chance':
      return sum;
    
    default:
      return 0;
  }
}

export function calculateUpperBonus(scorecard) {
  const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
  const upperSum = upperCategories.reduce((sum, cat) => sum + (scorecard[cat] ?? 0), 0);
  return upperSum >= 63 ? 35 : 0;
}

export function calculateTotalScore(scorecard) {
  const categories = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'threeOfAKind', 'fourOfAKind', 'fullHouse',
    'smallStraight', 'largeStraight', 'yahtzee', 'chance'
  ];
  
  const baseScore = categories.reduce((sum, cat) => sum + (scorecard[cat] ?? 0), 0);
  const upperBonus = calculateUpperBonus(scorecard);
  const yahtzeeBonus = scorecard.yahtzeeBonus || 0;
  
  return baseScore + upperBonus + yahtzeeBonus;
}

export function isGameOver(players) {
  const categories = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'threeOfAKind', 'fourOfAKind', 'fullHouse',
    'smallStraight', 'largeStraight', 'yahtzee', 'chance'
  ];
  
  return players.every(player => {
    const scorecard = typeof player.scorecard === 'string' 
      ? JSON.parse(player.scorecard) 
      : player.scorecard;
    return categories.every(cat => scorecard[cat] !== null);
  });
}

export function determineWinner(players) {
  let winner = null;
  let highScore = -1;
  
  players.forEach(player => {
    const scorecard = typeof player.scorecard === 'string'
      ? JSON.parse(player.scorecard)
      : player.scorecard;
    const total = calculateTotalScore(scorecard);
    if (total > highScore) {
      highScore = total;
      winner = player;
    }
  });
  
  return { winner, score: highScore };
}

// Check if this is a Yahtzee (for bonus)
export function isYahtzee(dice) {
  return new Set(dice).size === 1;
}

// Check if Yahtzee bonus applies
export function canScoreYahtzeeBonus(dice, scorecard) {
  // Must have already scored Yahtzee with 50
  // And current roll must be a Yahtzee
  return scorecard.yahtzee === 50 && isYahtzee(dice);
}
