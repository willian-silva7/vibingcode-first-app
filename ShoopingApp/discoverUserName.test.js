const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { discoverUserName } = require('./findWordsInGrid');

assert.equal(discoverUserName('nailw'), 'WILLIAN');
assert.equal(discoverUserName(['nailw', 'wil']), 'WILLIAN');
assert.equal(discoverUserName('abc'), null);

const scriptPath = path.join(__dirname, 'discoverUserName.js');
const script = fs.readFileSync(scriptPath, 'utf8');
const sandbox = {
  module: { exports: {} },
  exports: {},
  console,
  require: (id) => {
    if (id.startsWith('.')) {
      return require(path.resolve(path.dirname(scriptPath), id));
    }
    return require(id);
  },
  globalThis: {},
  window: {}
};
vm.runInNewContext(script, sandbox);
assert.equal(typeof sandbox.globalThis.discoverUserName, 'function');

const browserSandbox = {
  console,
  globalThis: {},
  window: {},
  module: { exports: {} },
  exports: {}
};
assert.doesNotThrow(() => vm.runInNewContext(script, browserSandbox));
assert.equal(typeof browserSandbox.window.discoverUserName, 'function');

console.log('discoverUserName tests passed');
