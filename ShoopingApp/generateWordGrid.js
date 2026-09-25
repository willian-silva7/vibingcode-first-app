const { generateGrid } = require('./generateGrid');
const { findWordsInGrid, discoverUserName } = require('./findWordsInGrid');
const { findDates, formatDate } = require('./findDates');

function placeWordOnBoard(board, word) {
  const rows = board.length;
  const cols = board[0].length;
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1],
    [0, -1], [-1, 0], [-1, -1], [-1, 1]
  ];

  const positions = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push([row, col]);
    }
  }

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (const [startRow, startCol] of positions) {
    for (const [dr, dc] of directions) {
      let fits = true;

      for (let index = 0; index < word.length; index++) {
        const row = startRow + dr * index;
        const col = startCol + dc * index;

        if (row < 0 || row >= rows || col < 0 || col >= cols) {
          fits = false;
          break;
        }

        const existing = board[row][col];
        if (existing !== '' && existing !== word[index]) {
          fits = false;
          break;
        }
      }

      if (!fits) continue;

      for (let index = 0; index < word.length; index++) {
        const row = startRow + dr * index;
        const col = startCol + dc * index;
        board[row][col] = word[index];
      }

      return true;
    }
  }

  return false;
}

function generateWordGrid(options = {}) {
  const { log = false } = options;
  const validWords = [
    'CAT', 'DOG', 'APPLE', 'BOOK', 'TREE', 'HOUSE', 'BIRD', 'FISH',
    'RAIN', 'WIND', 'STAR', 'MOON', 'CLOUD', 'OCEAN', 'FIRE', 'ROCK',
    'BEACH', 'GARDEN', 'STREAM', 'MUSIC', 'LIGHT', 'SHELL', 'BLOSSOM'
  ];

  let board = null;
  let selectedWords = [];

  for (let attempt = 0; attempt < 200; attempt++) {
    board = Array.from({ length: 10 }, () => Array(10).fill(''));
    selectedWords = [];

    const shuffledWords = [...validWords].sort(() => Math.random() - 0.5);

    for (const word of shuffledWords) {
      if (selectedWords.length >= 10) break;
      if (placeWordOnBoard(board, word)) {
        selectedWords.push(word);
      }
    }

    if (selectedWords.length >= 10) {
      break;
    }
  }

  if (!board || selectedWords.length < 10) {
    throw new Error('Unable to generate a board with at least 10 words.');
  }

  const randomLetters = generateGrid();
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (board[row][col] === '') {
        board[row][col] = randomLetters[row][col];
      }
    }
  }

  const foundWords = findWordsInGrid(board, selectedWords);
  const randomWords = [...foundWords].sort(() => Math.random() - 0.5).slice(0, 10);

  if (log) {
    console.log('Grid:');
    for (const row of board) {
      console.log(row.join(' '));
    }

    console.log('Random words:', randomWords);
  }

  return {
    grid: board,
    words: randomWords
  };
}

function findWordsAndDates(input = '') {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string.');
  }

  const generated = generateWordGrid({ log: false });
  const currentDate = formatDate();

  return {
    currentDate,
    dates: findDates(input),
    grid: generated.grid,
    words: generated.words.map((word) => ({
      word,
      foundOn: currentDate
    }))
  };
}

if (require.main === module) {
  const result = findWordsAndDates('I found a CAT on 11/14/2023.');
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { generateWordGrid, findWordsAndDates, discoverUserName };
