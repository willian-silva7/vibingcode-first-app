const { findWordsAndDates, discoverUserName } = require('./generateWordGrid');

module.exports = { findWordsAndDates, discoverUserName };

if (require.main === module) {
  console.log(findWordsAndDates('I found a CAT on 11/14/2023.'));
}
