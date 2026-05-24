const path = require('path');
const { sync: rimrafSync } = require('rimraf');
const { sync: globSync } = require('glob');

// rimraf v4+ no longer accepts glob patterns in sync mode — expand globs manually.
module.exports = function deleteSourceMaps() {
  const patterns = [
    path.join(__dirname, '../../../2. Frontend/1. Source/dist/*.js.map'),
    path.join(__dirname, '../../../2. Frontend/1. Source/*.js.map'),
  ];
  patterns.forEach((pattern) => {
    globSync(pattern).forEach((file) => rimrafSync(file));
  });
}
