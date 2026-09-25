function findDates(input) {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string.');
  }

  const datePattern = /(?<!\d)(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})(?!\d)/g;
  return input.match(datePattern) || [];
}

function formatDate(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

if (require.main === module) {
  console.log(findDates('I have a dentist appointment on 11/14/2023 and book club on 12-1-23'));
  // Expected: ["11/14/2023", "12-1-23"]
}

module.exports = { findDates, formatDate };
