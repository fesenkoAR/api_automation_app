module.exports = {
  default: `--require features/support/setup.js --require features/step_definitions/**/*.js --format progress`,
  active: `--require features/support/setup.js --require features/step_definitions/**/*.js --tags @active --format progress`,
  exclude: `--require features/support/setup.js --require features/step_definitions/**/*.js --tags ~@ignore --format progress`
};
