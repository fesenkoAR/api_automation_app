const { Given, When, Then, After } = require('@cucumber/cucumber');
const request = require('supertest');
const app = require('../../server/server.js');
const assert = require('assert');
const axios = require('axios');


// Step definition starts...

When('I create a debt for the student with the amount {int}', async function (amount) {
    const debtDetails = {
        studentId: this.studentID,
        amount: amount
    };
    console.log(this.api)
    response = await axios.post(`${this.api}/api/debt`, debtDetails);
    this.response = response;
});

// Step definition ends...


// Step validation starts...

Then('The debt should be created with the amount {int}', function(expectedAmount) {
    const debtData = this.response.data;
    assert.strictEqual(debtData.amount, expectedAmount, `Expected debt amount ${expectedAmount}, but got ${debtData.amount}`);
})

Then('Id is assigned to the debt', function () {
    const debtData = this.response.data;
    assert.ok(debtData.id, 'Expected debt ID to be assigned, but it was not');
})

Then('The monthly percent of the newly created debt must be {int}', function (expectedMonthlyPercent) {
    const debtData = this.response.data;
    assert.strictEqual(debtData.monthlyPercent, expectedMonthlyPercent, `Expected monthly percent ${expectedMonthlyPercent}, but got ${debtData.monthlyPercent}`);
})

Then('', function () {
    
})

Then('', function () {
    
})
// Steps validation ends...
