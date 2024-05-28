const { Given, When, Then, After } = require('@cucumber/cucumber');
const request = require('supertest');
const app = require('../../server/server.js');
const assert = require('assert');
const axios = require('axios');


let studentID;
let response;


Given('The API is running', function () {
  console.log('Step definition: The API is running');
});

// Step definition starts...

When('I send a POST request to {string} with body:', async function (endpoint, dataTable) {
  const studentDetailsArray = dataTable.hashes();
  const studentDetails = studentDetailsArray[0];
  response = await axios.post(`${this.api}${endpoint}`, studentDetails);
  this.response = response;
});

When('I request all students', async function () {
  response = await axios.get(`${this.api}/api/student`);
  this.response = response;
});

When('I create a new student with the following details:', async function (dataTable) {
  const studentDetailsArray = dataTable.hashes();
  const studentDetails = studentDetailsArray[0];
  response = await axios.post(`${this.api}/api/student`, studentDetails);
  this.response = response;
  this.studentID = response.data.id;
});

When('I request a specific student by its ID {string}', async function (studentId) {
  const cleanStudentId = studentId.replace(/['"]+/g, ''); // Remove quotes
  response = await axios.get(`${this.api}/api/student/${cleanStudentId}`);
  this.response = response;
});

// Step definition ends...
// Step validation starts...

Then('the response status code should be {int}', function (expectedStatusCode) {
  const actualStatusCode = this.response.status;
  assert.strictEqual(actualStatusCode, expectedStatusCode, `Expected status code ${expectedStatusCode}, but got ${actualStatusCode}`);
});

Then('The parameter {string} should be equal to {string}', function (parameter, value) {
  const responseData = this.response.data
  switch (true) {
    case parameter == 'name' : 
      assert.strictEqual(responseData.name, value, `Expected value ${parameter}, but got value ${responseData.name}`); break
    case parameter == 'age' :
      assert.strictEqual(responseData.age, value, `Expected value ${parameter}, but got value ${responseData.age}`); break
    case parameter == 'id' :
      assert.strictEqual(responseData.id, value, `Expected value ${parameter}, but got value ${responseData.id}`); break
  }
})

Then('I receive object of students', function () {
  const students = this.response.data
  assert.strictEqual(typeof students, 'object', 'Expected response to be an object');
})
// Steps validation ends...


