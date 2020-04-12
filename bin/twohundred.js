#!/usr/bin/env node

require = require("esm")(module)
module.exports = require("../src/cli").cli(process.argv)
