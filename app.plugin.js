const { createRunOncePlugin } = require("@expo/config-plugins");

const withMlkitSimulatorArm64Fix = require("./plugins/withMlkitSimulatorArm64Fix");
const pkg = require("./package.json");

module.exports = createRunOncePlugin(
  withMlkitSimulatorArm64Fix,
  pkg.name,
  pkg.version
);

