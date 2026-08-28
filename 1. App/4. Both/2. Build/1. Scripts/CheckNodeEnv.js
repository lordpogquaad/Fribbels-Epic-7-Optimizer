// chalk v5 is ESM-only; under CJS `require` the named colors live on `.default`.
const chalk = require('chalk').default;

module.exports = function CheckNodeEnv(expectedEnv) {
  if (!expectedEnv) {
    throw new Error('"expectedEnv" not set');
  }

  if (process.env.NODE_ENV !== expectedEnv) {
    console.log(
      chalk.whiteBright.bgRed.bold(
        `"process.env.NODE_ENV" must be "${expectedEnv}" to use this webpack config`,
      ),
    );
    process.exit(2);
  }
};
