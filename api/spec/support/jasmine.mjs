export default {
  spec_dir: "./utility",
  spec_files: [
    "**/*[sS]pec.?(m)js",
    "**/*[sS]pec.ts"
  ],
  helpers: [
    "helpers/**/*.?(m)js"
  ],
  env: {
    stopSpecOnExpectationFailure: false,
    random: true,
    forbidDuplicateNames: true
  }
}
