import express from 'express';
import pool from '../dbconfig.js';

const router = express.Router();

/**
 * @route   GET /api/complaints/by-patient/:patientId
 * @desc    Get all complaints for a specific patient
 * @access  Public (for now, should be protected)
 */
router.get('/by-patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const [complaints] = await pool.query(
            'SELECT * FROM Complaints WHERE patientId = ? ORDER BY dateFiled DESC', 
            [patientId]
        );
        res.json(complaints);
    } catch (err) {
        console.error('Error fetching complaints:', err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/complaints
 * @desc    File a new complaint
 * @access  Public (for now)
 */
router.post('/', async (req, res) => {
    const { patientId, patientName, complaintText, preferredContactMethod } = req.body;

    if (!patientId || !patientName || !complaintText || !preferredContactMethod) {
        return res.status(400).json({ msg: 'Please provide all required fields for the complaint.' });
    }

    try {
        // In a real app, category and urgency might be set by an admin or an AI service later.
        // For now, we set sane defaults.
        const newComplaint = {
            patientId,
            patientName,
            filedBy: patientName, // Patient files it themselves
            complaintText,
            dateFiled: new Date(),
            status: 'Open',
            category: 'Uncategorized',
            urgency: 'Medium',
            preferredContactMethod,
        };

        const sql = `
            INSERT INTO Complaints (patientId, patientName, filedBy, complaintText, dateFiled, status, category, urgency, preferredContactMethod)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.query(sql, Object.values(newComplaint));

        const createdComplaint = {
            id: result.insertId.toString(),
            ...newComplaint,
            dateFiled: newComplaint.dateFiled.toISOString(), // ensure ISO string format
            actionLog: [] // A new complaint has no action log yet
        };

        console.log(`New complaint filed and stored in MySQL by patient ID ${patientId}`);
        res.status(201).json(createdComplaint);

    } catch (err) {
        console.error('Error filing complaint:', err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
