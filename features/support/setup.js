const { BeforeAll, AfterAll } = require('@cucumber/cucumber');
const app = require('../../server/server.js');
const axios = require('axios');

let server;
const port = 3000;
const api = `http://localhost:${port}`;
let startTime;
let endTime;

// Start the server before all tests
BeforeAll(function () {
  return new Promise((resolve) => {
    server = app.listen(port, () => {
      startTime = new Date().toISOString();
      console.log(`Server is running on port ${port}`);
      resolve();
    });
  });
});

// Stop the server after all tests
AfterAll(function () {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('Server stopped');
        endTime = new Date().toISOString();
        console.log(`Start Time: ${startTime}`);
        console.log(`End Time: ${endTime}`);
        resolve();
      });
    } else {
      resolve();
    }
  });
});

// Attach the API URL to the world object
BeforeAll(function () {
  this.api = api;
});
