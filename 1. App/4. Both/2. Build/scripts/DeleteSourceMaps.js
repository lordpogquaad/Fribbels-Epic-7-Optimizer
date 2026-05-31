const path = require('path');
const rimraf = require('rimraf');

module.exports = function deleteSourceMaps() {
  rimraf.sync(path.join(__dirname, '../../../2. Frontend/1. Source/dist/*.js.map'));
  rimraf.sync(path.join(__dirname, '../../../2. Frontend/1. Source/*.js.map'));
}
