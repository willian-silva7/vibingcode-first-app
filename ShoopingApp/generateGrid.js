function generateGrid() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const grid = [];

  for (let row = 0; row < 10; row++) {
    const currentRow = [];
    for (let col = 0; col < 10; col++) {
      const randomIndex = Math.floor(Math.random() * letters.length);
      currentRow.push(letters[randomIndex]);
    }
    grid.push(currentRow);
  }

  return grid;
}

module.exports = { generateGrid };
