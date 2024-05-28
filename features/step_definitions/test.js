const { spawn } = require('child_process');

const mochaProcess = spawn('mocha', ['./step_definition.js', './']);

mochaProcess.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

mochaProcess.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

mochaProcess.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});