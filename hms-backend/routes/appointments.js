import express from 'express';
import pool from '../dbconfig.js';

const router = express.Router();

/**
 * @route   GET /api/appointments
 * @desc    Get all appointments
 * @access  Public (for now; should be protected in a real app)
 */
router.get('/', async (req, res) => {
    try {
        // Assuming your appointments table is named 'Appointments'
        const [appointments] = await pool.query('SELECT * FROM Appointments ORDER BY date, time ASC');
        res.json(appointments);
    } catch (err) {
        console.error('Error fetching appointments:', err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/appointments
 * @desc    Create a new appointment
 * @access  Public (for now)
 */
router.post('/', async (req, res) => {
    const {
        patientName,
        department,
        doctorName,
        date,
        time,
        reason,
        appointmentType,
        isFollowUp
    } = req.body;

    if (!patientName || !department || !doctorName || !date || !time || !reason) {
        return res.status(400).json({ msg: 'Please provide all required fields.' });
    }

    try {
        const sql = `
            INSERT INTO Appointments (patientName, department, doctorName, date, time, reason, status, appointmentType, isFollowUp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const status = 'Scheduled'; // Default status for new appointments
        
        const [result] = await pool.query(sql, [
            patientName,
            department,
            doctorName,
            date,
            time,
            reason,
            status,
            appointmentType,
            isFollowUp
        ]);

        const newAppointment = {
            id: result.insertId.toString(),
            patientName,
            department,
            doctorName,
            date,
            time,
            reason,
            status,
            appointmentType,
            isFollowUp: !!isFollowUp, // Ensure boolean
        };
        
        console.log(`New appointment created and stored in MySQL for ${patientName}`);
        res.status(201).json(newAppointment);

    } catch (err) {
        console.error('Error creating appointment:', err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update an appointment's status (cancel/reschedule)
 * @access  Public (for now)
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, date, time } = req.body;

    if (!status || (status !== 'Cancelled' && status !== 'Rescheduled')) {
        return res.status(400).json({ msg: 'Invalid status provided.' });
    }
    
    if (status === 'Rescheduled' && (!date || !time)) {
        return res.status(400).json({ msg: 'Date and time are required for rescheduling.' });
    }

    try {
        let sql = 'UPDATE Appointments SET status = ?';
        const params = [status];
        
        if (status === 'Rescheduled') {
            sql += ', date = ?, time = ?';
            params.push(date, time);
        }
        
        sql += ' WHERE id = ?';
        params.push(id);
        
        const [result] = await pool.query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Appointment not found.' });
        }
        
        // Fetch the updated appointment to return it
        const [updatedAppointments] = await pool.query('SELECT * FROM Appointments WHERE id = ?', [id]);

        console.log(`Appointment ${id} updated in MySQL. Status: ${status}`);
        res.json(updatedAppointments[0]);

    } catch (err) {
        console.error(`Error updating appointment ${id}:`, err.message);
        res.status(500).send('Server Error');
    }
});


export default router;