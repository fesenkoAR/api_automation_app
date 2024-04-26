const express = require('express');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const moment = require('moment');

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
    { id: 'c6', name: 'Michael Kon', seniority: 10 }
];
let debts = [
    { id: 'debt1', studentId: 's1', amount: 1000, totalAmount: 1040.67, monthyPercent: 20, creationDate: '2024-04-20', lastUpdateDate: '' },
    { id: 'debt2', studentId: 's2', amount: 2000, totalAmount: 2081.21, monthyPercent: 30, creationDate: '2024-04-22', lastUpdateDate: '' }
];
let students = [
    { id: 's1', name: 'John', age: 18, sex: false, fearFactor: 2 },
    { id: 's2', name: 'Alice', age: 22, sex: true, fearFactor: 1 },
];

function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

function isCollectorAvailable(collectorId, appointmentDate, studentFearFactor) {
    // Check if the collector's fear factor is at least 2 times bigger than the student's fear factor
    const collector = collectors.find(collector => collector.id === collectorId);
    return collector && collector.seniority >= 2 * studentFearFactor &&
        // Check if the collector has no appointments for the provided date
        !appointments.some(appointment => appointment.collectorId === collectorId && appointment.date === appointmentDate);
}

// Appointment Management APIs
app.get('/api/appointment', (req, res) => {
    res.json(appointments);
});

app.post('/api/appointment', [
    body('date').custom((value, { req }) => {
        // Check if the date is in YYYY-MM-DD format
        if (!moment(value, 'YYYY-MM-DD', true).isValid()) {
            throw new Error('Date must be in YYYY-MM-DD format');
        }
        // Check if the date is in the future
        if (moment(value).isBefore(moment().startOf('day'))) {
            throw new Error('Appointment date cannot be in the past');
        }
        return true;
    }),
    body('studentId').notEmpty()
], (req, res) => {
    console.log('Received POST request to /api/appointment');
    console.log('Request body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Check if there are available collectors for the appointment
    const appointmentDate = req.body.date;
    const studentFearFactor = req.body.studentFearFactor;
    const availableCollectors = collectors.filter(collector => isCollectorAvailable(collector.id, appointmentDate, studentFearFactor));

    if (availableCollectors.length === 0) {
        return res.status(400).json({ message: 'No available collectors for the appointment' });
    }

    // Check if the student has any existing debt
    const studentId = req.body.studentId
    const studentDebt = debts.find(debt => debt.studentId === studentId);
    const debtId = studentDebt ? studentDebt.id : null;

    // Assign the appointment to the first available collector
    const collector = availableCollectors[0];
    const newAppointment = {
        id: generateId(),
        date: appointmentDate,
        studentId: studentId,
        collectorId: collector.id,
        debtId: debtId // Assigning the student's debt ID to the appointment
    };

    // Add the new appointment to the appointments array
    appointments.push(newAppointment);
    res.status(201).json(newAppointment);
});


app.get('/api/appointment/:id', (req, res) => {
    const appointment = appointments.find(appt => appt.id === req.params.id);
    if (!appointment) {
        res.status(404).send('Appointment not found');
    } else {
        res.json(appointment);
    }
});

app.delete('/api/appointment/:id', (req, res) => {
    const index = appointments.findIndex(appt => appt.id === req.params.id);
    if (index === -1) {
        res.status(404).send('Appointment not found');
    } else {
        appointments.splice(index, 1);
        res.status(204).send('appointment has been deleted');
    }
});

// Collector Management APIs
app.get('/api/collector', (req, res) => {
    res.json(collectors);
});

app.post('/api/collector',[
    body('name').notEmpty(),
    body('seniority').notEmpty().isInt({ min: 2, max: 10 }).withMessage('seniority of collector must be an integer between 2 and 10')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const newCollector = req.body;
    newCollector.id = generateId(); // Assign a unique ID
    collectors.push(newCollector);
    res.status(201).json(newCollector);
});


app.put('/api/collector/:id', (req, res) => {
    const { id } = req.params;
    const updatedCollector = req.body;

    const index = collectors.findIndex(collector => collector.id === id);
    if (index !== -1) {
        updatedCollector.id = id; // Assign the existing ID
        collectors[index] = updatedCollector;
        res.json(updatedCollector);
    } else {
        res.status(404).send('Collector not found');
    }
});

app.delete('/api/collector/:id', (req, res) => {
    const { id } = req.params;
    const index = collectors.findIndex(collector => collector.id === id);
    if (index !== -1) {
        collectors.splice(index, 1);
        res.status(204).send();
    } else {
        res.status(404).send('Collector not found');
    }
});

// GET endpoint to retrieve all debts
app.get('/api/debt', (req, res) => {
    res.json(debts);
});

// POST endpoint to add a new debt
app.post('/api/debt', (req, res) => {
    const { studentId, amount, lastUpdateDate } = req.body;

    // Find the student by their ID
    const student = students.find(student => student.id === studentId);
    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }

    const debtorAge = student.age;
    const isFemale = student.sex;

    // Calculate interest rate based on age and gender
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

    // Check if the debt creation date is in the future
    const currentDate = new Date();
    if (currentDate < new Date(lastUpdateDate)) {
        const daysSinceCreation = Math.ceil((new Date(lastUpdateDate) - currentDate) / (1000 * 60 * 60 * 24));
        const dailyRate = interestRate / 30;
        for (let i = 0; i < daysSinceCreation; i++) {
            totalAmount *= (1 + dailyRate); // Apply daily interest rate
        }
    }

    // Create a new debt object
    const newDebt = {
        id: generateId(),
        studentId: studentId,
        amount: amount,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        monthlyPercent: interestRate * 100, // Convert interest rate to percentage
        creationDate: currentDate,
        lastUpdateDate: currentDate
    };

    // Add the new debt to the debts array
    debts.push(newDebt);

    // Return the newly created debt object in the response
    res.status(201).json(newDebt);
});

// GET endpoint to retrieve a specific debt by id
app.get('/api/debt/:id', (req, res) => {
    const debt = debts.find(debt => debt.id === req.params.id);
    if (debt) {
        res.json(debt);
    } else {
        res.status(404).send('Debt not found');
    }
});

app.put('/api/debt', (req, res) => {
    const currentDate = new Date();
    
    debts.forEach(debt => {
        // Check if lastUpdateDate is today
        const lastUpdateDate = debt.lastUpdateDate ? new Date(debt.lastUpdateDate) : new Date(debt.creationDate);
        if (lastUpdateDate.toDateString() === currentDate.toDateString()) {
            // If lastUpdateDate is today, do not update data
            return;
        }

        // Calculate the daily interest rate from the monthly percent
        const dailyRate = (debt.monthyPercent / 30) / 100;
        
        // Calculate the days elapsed since the last update date or creation date
        const daysElapsed = Math.ceil((currentDate - lastUpdateDate) / (1000 * 60 * 60 * 24));
        
        // Apply the daily interest rate to update the total amount
        let totalAmount = debt.totalAmount || debt.amount; // Initialize totalAmount with amount if not set
        totalAmount *= Math.pow((1 + dailyRate), daysElapsed); // Apply interest rate
        
        // Update the totalAmount and lastUpdateDate for the debt
        debt.totalAmount = parseFloat(totalAmount.toFixed(2));
        debt.lastUpdateDate = currentDate.toISOString();
    });

    // Return the updated debts array in the response
    res.json(debts);
});

// DELETE endpoint to delete a debt
app.delete('/api/debt/:id', (req, res) => {
    const { id } = req.params;
    const index = debts.findIndex(debt => debt.id === id);
    if (index !== -1) {
        debts.splice(index, 1);
        res.status(204).send();
    } else {
        res.status(404).send('Debt not found');
    }
});

// GET endpoint to retrieve all students
app.get('/api/student', (req, res) => {
    res.json(students);
});

// POST endpoint to add a new student
app.post('/api/student', (req, res) => {
    const { name, age, sex, fearFactor } = req.body;

    // Check if age and fearFactor are provided and valid
    if (!age || isNaN(age) || !fearFactor || isNaN(fearFactor)) {
        return res.status(400).json({ error: 'Invalid age or fearFactor provided' });
    }

    // Determine if the student is female based on the sex field
    const isFemale = sex.toLowerCase() === 'female';

    // Create a new student object
    const newStudent = {
        id: generateId(),
        name: name,
        age: age,
        sex: isFemale,
        fearFactor: fearFactor
    };

    // Add the new student to the students array
    students.push(newStudent);

    // Return the newly created student object in the response
    res.status(201).json(newStudent);
});

// PUT endpoint to update an existing student
app.put('/api/student/:id', (req, res) => {
    const { id } = req.params;
    const updatedStudent = req.body;

    const index = students.findIndex(student => student.id === id);
    if (index !== -1) {
        // Update the student record with the provided ID
        students[index] = { ...updatedStudent, id: id };
        res.json(students[index]);
    } else {
        res.status(404).send('Student not found');
    }
});

// GET endpoint to retrieve a specific student by id
app.get('/api/student/:id', (req, res) => {
    const student = students.find(student => student.id === req.params.id);
    if (student) {
        res.json(student);
    } else {
        res.status(404).send('Student not found');
    }
});

// DELETE endpoint to delete a student
app.delete('/api/student/:id', (req, res) => {
    const { id } = req.params;
    const index = students.findIndex(student => student.id === id);
    if (index !== -1) {
        students.splice(index, 1);
        res.status(204).send();
    } else {
        res.status(404).send('Student not found');
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
