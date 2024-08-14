const Environment = require('jest-environment-jsdom');

/**
 * Custom JEST configuration to address issue as seen/described in:
 *
 * https://stackoverflow.com/a/57713960
 *
 */
module.exports = class CustomTestEnvironment extends Environment {
  async setup() {
    await super.setup();
    if (typeof this.global.TextEncoder === 'undefined') {
      const { TextEncoder } = require('util');
      this.global.TextEncoder = TextEncoder;
    }
    if (typeof this.global.TextDecoder === 'undefined') {
      const { TextDecoder } = require('util');
      this.global.TextDecoder = TextDecoder;
    }
  }
};
