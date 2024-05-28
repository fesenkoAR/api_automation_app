const express = require('express');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const moment = require('moment');

const log4js = require('../log4js.config.js');
const logger = log4js.getLogger();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Sample data (replace with your database implementation)
let appointments = [
    { id: 'ap1', debptid: 'debt1', collectorId: 'c3', date: '2025-03-03' }
];
let collectors = [
    { id: 'c1', name: 'Sam Kushi', seniority: 2 },
    { id: 'c2', name: 'Emi Bykon', seniority: 2 },
    { id: 'c3', name: 'Andrew Macks', seniority: 4 },
    { id: 'c4', name: 'Alan Dok', seniority: 4 },
    { id: 'c5', name: 'Peter Sdoa', seniority: 10 },
    { id: 'c6', name: 'Michael Kon', seniority: 10 },
];
let debts = [
    { id: 'debt1', studentId: 's1', amount: 1000, totalAmount: 1040.67, monthyPercent: 20, creationDate: '2024-04-20', lastUpdateDate: '' },
    { id: 'debt2', studentId: 's2', amount: 2000, totalAmount: 2081.21, monthyPercent: 30, creationDate: '2024-04-22', lastUpdateDate: '' }
];
let students = [
    { id: 's1', name: 'John', age: 18, sex: false, fearFactor: 2 },
    { id: 's2', name: 'Alice', age: 22, sex: true, fearFactor: 1 },
];

function generateId(apiType, items) {
    logger.info('[generateId] starting to generate id');
    if ((apiType === 'appointment' || apiType === 'collector') && items.length >= 15) {
        return -1;
    } else {
        return Math.random().toString(36).substring(2, 10);
    }
}

function isCollectorAvailable(collectorId, appointmentDate, studentFearFactor) {
    logger.info('[isCollectorAvailable] starting collector search');
    // Check if the collector's fear factor is at least 2 times bigger than the student's fear factor
    const collector = collectors.find(collector => collector.id === collectorId);
    logger.info(`[isCollectorAvailable] Checking if the collector's fear factor: ${collector.seniority} is at least 2 times bigger than the student's fear factor: ${studentFearFactor}`);
    logger.info(`[isCollectorAvailable] Checking if the collector: ${collector.id} has no appointments for the provided date: ${appointmentDate}`);
    return collector && collector.seniority >= 2 * studentFearFactor &&
        // Check if the collector has no appointments for the provided date
        !appointments.some(appointment => appointment.collectorId === collectorId && appointment.date === appointmentDate);
}

// GET endpoint to get all appointments
app.get('/api/appointment', (req, res) => {
    logger.debug('[API] get all appointments');
    res.json(appointments);
});

// POST endpoint to create appointment
app.post('/api/appointment', [
    body('date').custom((value, { req }) => {
        // Check if the date is in YYYY-MM-DD format
        if (!moment(value, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
            throw new Error('Date must be in YYYY-MM-DD HH:mm:ss format');
        }
        // Check if the date is in the future
        if (moment(value).isBefore(moment().startOf('day'))) {
            throw new Error('Appointment date cannot be in the past');
        }
        return true;
    }),
    body('studentId').notEmpty()
], (req, res) => {
    logger.debug('[API] starting appointment creation');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('[appointment] ', errors.array())
        return res.status(400).json({ errors: errors.array() });
    }

    // Check if there are available collectors for the appointment
    const appointmentDate = req.body.date;
    let formattedDate = moment(appointmentDate, 'YY-MM-DD HH:mm:ss').format('YY-MM-DD');
    const studentFearFactor = students.find(student => student.id === req.body.studentId)?.fearFactor || "Student not found";
    const availableCollectors = collectors.filter(collector => isCollectorAvailable(collector.id, formattedDate, studentFearFactor));

    if (availableCollectors.length === 0) {
        return res.status(400).json({ message: 'No available collectors for the appointment' });
    }

    // Check if the student has any existing debt
    const studentId = req.body.studentId
    logger.info('[appointment] checking if the student has any existing debts', studentId);
    const studentDebt = debts.find(debt => debt.studentId === studentId);
    const debtId = studentDebt ? studentDebt.id : null;

    // Assign the appointment to the first available collector
    const collector = availableCollectors[0];
    const newAppointment = {
        id: generateId('appointment', appointments),
        date: formattedDate,
        studentId: studentId,
        collectorId: collector.id,
        debtId: debtId // Assigning the student's debt ID to the appointment
    };
    logger.info('[appointment] creating new appointment ', newAppointment);
    logger.info('[appointment] assigning the appointment to the first available collector', collector);

    // Add the new appointment to the appointments array
    logger.info('[appointment] adding the new appointment to the appointments array ', newAppointment);
    appointments.push(newAppointment);
    res.status(201).json(newAppointment);
    logger.debug('[API] finishing appointment creation');
});

// GET endpoint to get appointment by id
app.get('/api/appointment/:id', (req, res) => {
    logger.debug('[API] starting "get appointment by id" function');
    const appointment = appointments.find(appt => appt.id === req.params.id);
    if (!appointment) {
        logger.debug('[appointment] get appointment error', appointment);
        res.status(204)
    } else {
        res.json(appointment);
    }
    logger.debug('[API] finishing "get appointment by id" function');
});

// DELETE endpoint to delete appointment by id
app.delete('/api/appointment/:id', (req, res) => {
    logger.debug('[API] starting appointment deleting');
    const index = appointments.findIndex(appt => appt.id === req.params.id);
    if (index === -1) {
        res.status(404).send('Appointment not found');
    } else {
        appointments.splice(index, 1);
        res.status(204).send('appointment has been deleted');
        logger.info('[appointment] appointment has been deleted ', appointments[index]);
    }
});

// GET endpoint to get all collectors
app.get('/api/collector', (req, res) => {
    logger.debug('[API] starting "get all collectiors" function');
    res.json(collectors);
});

// POST endpoint to create a collector 
app.post('/api/collector',[
    body('name').notEmpty(),
    body('seniority').notEmpty().isInt({ min: 2, max: 10 }).withMessage('seniority of collector must be an integer between 2 and 10')
], (req, res) => {
    logger.debug('[API] starting to create a collecter');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    logger.info('[collector] adding new collector ')
    const newCollector = req.body;
    newCollector.id = generateId('collector', collectors)
    collectors.push(newCollector);
    res.status(201).json(newCollector);
    logger.info('[collector] new collector has been added ', newCollector);
});

// PUT endpoint to update collector by id
app.put('/api/collector/:id', (req, res) => {
    logger.debug('[API] starting to uodate collector');
    const { id } = req.params;
    const updatedCollector = req.body;

    const index = collectors.findIndex(collector => collector.id === id);
    if (index !== -1) {
        logger.info('[collector] updating collector info ', collectors[index])
        updatedCollector.id = id; // Assign the existing ID
        collectors[index] = updatedCollector;
        res.json(updatedCollector);
    } else {
        logger.debug(`collector ${id} has not been found`);
        res.status(404).send('Collector not found');
    }
});

// DELETE endpoint to delete collector by id
app.delete('/api/collector/:id', (req, res) => {
    logger.debug('[API] starting collector deletion');
    const { id } = req.params;
    const index = collectors.findIndex(collector => collector.id === id);
    if (index !== -1) {
        logger.warn(`[collector] deleting the collector ${collectors[index]}`);
        collectors.splice(index, 1);
        res.status(204).send();
        logger.info(`[collector] collector ${id} has been deleted `);
    } else {
        logger.debug(`collector ${id} has not been found`);
        res.status(404).send('Collector not found');
    }
});

// GET endpoint to retrieve all debts
app.get('/api/debt', (req, res) => {
    logger.debug('[API] starting to retrieve all debts');
    res.json(debts);
});

// POST endpoint to add a new debt
app.post('/api/debt', (req, res) => {
    logger.debug('[API] starting new debt addition');
    const { studentId, amount, lastUpdateDate } = req.body;

    // Find the student by their ID
    logger.info(`[debt] Looking for the student ${studentId}`);
    const student = students.find(student => student.id === studentId);
    if (!student) {
        logger.debug(`[debts] student ${studentId} has not been found`);
        return res.status(404).json({ error: 'Student not found' });
    }

    const debtorAge = student.age;
    const isFemale = student.sex;

    // Calculate interest rate based on age and gender
    logger.info('[debt] calculating interest rate');
    let interestRate = 0; // Default interest rate
    if (debtorAge < 21) {
        interestRate = 0.1; // Apply -10% interest rate for debtors younger than 21
    }
    if (debtorAge < 18) {
        interestRate = 0.2; // Apply an additional -20% interest rate for debtors younger than 18
    }
    if (isFemale) {
        interestRate += 0.1; // Apply an additional -10% interest rate for female debtors
    }

    // Calculate the total debt amount with interest
    let totalAmount = amount
    logger.info(`[debt] Calculating the total debt amount: ${totalAmount} with interest: ${interestRate}`);

    // Check if the debt creation date is in the future
    const currentDate = new Date();
    logger.info(`[debt] checking if the debt creation date: ${lastUpdateDate || currentDate}  is in the future`);
    if (currentDate < new Date(lastUpdateDate)) {
        const daysSinceCreation = Math.ceil((new Date(lastUpdateDate) - currentDate) / (1000 * 60 * 60 * 24));
        const dailyRate = interestRate / 30;
        for (let i = 0; i < daysSinceCreation; i++) {
            totalAmount *= (1 + dailyRate); // Apply daily interest rate
            logger.info('applying daily interest rate ', dailyRate)
            logger.info('applying it to the total amount', totalAmount)
        }
    }

    // Create a new debt object
    logger.info('[debt] creating a new debt object');
    const newDebt = {
        id: generateId(),
        studentId: studentId,
        amount: amount,
        totalAmount: totalAmount,
        monthlyPercent: interestRate * 100, // Convert interest rate to percentage
        creationDate: currentDate,
        lastUpdateDate: currentDate
    };

    // Add the new debt to the debts array
    logger.info('[debt] adding the new debt to the debts array ', newDebt);
    debts.push(newDebt);

    // Return the newly created debt object in the response
    res.status(201).json(newDebt);
    logger.info('[debt] finishing debt addition');
});

// GET endpoint to retrieve a specific debt by id
app.get('/api/debt/:id', (req, res) => {
    logger.debug('[API] starting to retrieve a specific debt by id');
    const debt = debts.find(debt => debt.id === req.params.id);
    if (debt) {
        logger.info('return debt ', debt)
        res.json(debt);
    } else {
        logger.debug(`debt ${req.params.id} is not found`);
        res.status(204).send('Debt is not found!');
    }
});

// PUT endpoint to create a debt
app.put('/api/debt', (req, res) => {
    logger.debug('[API] Starting debt creation');
    const currentDate = new Date();
    
    debts.forEach(debt => {
        // Check if lastUpdateDate is today
        logger.info(`[debt] checking if lastUpdateDate: ${debt.lastUpdateDate} is today`);
        const lastUpdateDate = debt.lastUpdateDate ? new Date(debt.lastUpdateDate) : new Date(debt.creationDate);
        if (lastUpdateDate.toDateString() === currentDate.toDateString()) {
            // If lastUpdateDate is today, do not update data
            logger.info(`[debt] debpt ${debt.id} has not been updated. The last update date: ${debt.lastUpdateDate} is today`);
            return;
        }

        // Calculate the daily interest rate from the monthly percent
        const dailyRate = (debt.monthyPercent / 30) / 100;
        logger.info(`[debt] Calculating the daily interest rate: ${dailyRate} from the monthly percent ${debt.monthyPercent}`);
        
        // Calculate the days elapsed since the last update date or creation date
        const daysElapsed = Math.ceil((currentDate - lastUpdateDate) / (1000 * 60 * 60 * 24));
        logger.info(`debt] Calculating the days elapsed: ${daysElapsed}, since the last update date: ${lastUpdateDate} or creation date`);
        
        // Apply the daily interest rate to update the total amount
        let totalAmount = debt.totalAmount || debt.amount; // Initialize totalAmount with amount if not set
        logger.info(`Initializing totalAmount ${totalAmount}`)
        logger.info(`Applying the daily interest rate: ${dailyRate} to update the total amount: ${totalAmount}`)
        totalAmount *= Math.pow((1 + dailyRate), daysElapsed); // Apply interest rate
        
        // Update the totalAmount and lastUpdateDate for the debt
        logger.info(`Updating the totalAmount: ${debt.totalAmount} and lastUpdateDate: ${debt.lastUpdateDate} for the debt`)
        debt.totalAmount = totalAmount;
        debt.lastUpdateDate = currentDate.toISOString();
    });

    // Return the updated debts array in the response
    res.json(debts);
    logger.debug('[API] Finishing debt creation');
});

// DELETE endpoint to delete a debt
app.delete('/api/debt/:id', (req, res) => {
    logger.debug('[API] Starting debt deletion');
    const { id } = req.params;
    const index = debts.findIndex(debt => debt.id === id);
    if (index !== -1) {
        logger.warn(`deleting debt ${debts[index]}`);
        debts.splice(index, 1);
        res.status(204).send();
        logger.info(`debt has been deleted`);
    } else {
        logger.debug(`[debt] debt ${id} has not been found`);
        res.status(404).send('Debt not found');
    }
});

// GET endpoint to retrieve all students
app.get('/api/student', (req, res) => {
    logger.debug('[API] Starting to retrieve all students');
    res.json(students);
});

// POST endpoint to add a new student
app.post('/api/student', (req, res) => {
    logger.debug('[API] Starting new student addition');
    const { name, age, sex, fearFactor } = req.body;
    // Check if age and fearFactor are provided and valid
    logger.info(`[student] checking if age: ${age} and fearFactor: ${fearFactor} are provided and valid`);
    if (!age || isNaN(age) || !fearFactor || isNaN(fearFactor)) {
        logger.debug('[student] Invalid age or fearFactor provided');
        return res.status(400).json({ error: 'Invalid age or fearFactor provided' });
    }

    // Determine if the student is female based on the sex field
    logger.info(`[student] Determining if the student is female based on the sex field: ${sex}`);
    const isFemale = sex.toLowerCase() === 'female';

    // Create a new student object
    const newStudent = {
        id: generateId(),
        name: name,
        age: age,
        sex: isFemale,
        fearFactor: fearFactor
    };
    logger.info(`[student] Creating a new student object: ${newStudent}`);

    // Add the new student to the students array
    logger.info(`[student] adding the student to the students array`);
    students.push(newStudent);

    // Return the newly created student object in the response
    res.status(201).json(newStudent);
    logger.debug('[API] Finishing new student addition');
});

// PUT endpoint to update an existing student
app.put('/api/student/:id', (req, res) => {
    logger.debug('[API] Starting student updation');
    const { id } = re.params;
    const updatedStudent = req.body;

    const index = students.findIndex(student => student.id === id);
    if (index !== -1) {
        // Update the student record with the provided ID
        logger.info(`[student] Updating the student record with the provided ID: ${id}`)
        students[index] = { ...updatedStudent, id: id };
        res.json(students[index]);
    } else {
        logger.debug(`[student] Student ${id} has not been found`);
        res.status(404).send('Student not found');
    }
});

// GET endpoint to retrieve a specific student by id
app.get('/api/student/:id', (req, res) => {
    logger.debug('[API] Starting to retrieve a student');
    const student = students.find(student => student.id === req.params.id);
    if (student) {
        res.json(student);
    } else {
        logger.debug(`[student] student ${req.params.id} has not been found`);
        res.status(404).send('Student not found');
    }
});

// DELETE endpoint to delete a student
app.delete('/api/student/:id', (req, res) => {
    logger.debug('[API] Starting student deletion');
    const { id } = req.params;
    const index = students.findIndex(student => student.id === id);
    if (index !== -1) {
        logger.warn(`[student] deleting a student by ID: ${id}`);
        students.splice(index, 1);
        res.status(204).send();
        logger.info(`[student] student ${id} has been deleted`);
    } else {
        logger.info(`[student] student ${id} has not been found`);
        res.status(404).send('Student not found');
    }
});

module.exports = app;
// Start server
//app.listen(PORT, () => {
//    logger.info(`starting server on the port ${PORT}`);
//    console.log(`Server is running on http://localhost:${PORT}`);
//});
