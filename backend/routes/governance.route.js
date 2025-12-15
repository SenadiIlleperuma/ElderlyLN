//route/governance.route.js

const express = require('express');
const router = express.Router();
const governanceService = require('../services/governance.service');
const { authenticateToken } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// POST /api/governance/fileComplaint
router.post('/fileComplaint', async (req, res) => {
    try {
        const { bookingId,reason } = req.body;

        if(!bookingId || !reason){
            return res.status(400).json({ message: 'Booking ID and reason are required to a file a complaint.' });

        }
        const result=await governanceService.fileComplaint(
            req.user.user_id,
            bookingId,
            reason,
            req.user.role
        );
        res.status(201).json({ message: 'Complaint filed successfully.', result });
    }
    catch (error) {
        console.error('Complaint filing error:', error.message);
        res.status(400).json({ message: 'Failed to file complaint.', error: error.message });

    }
});

// PUT /api/governance/resolveComplaint/:complaintId
router.put('/resolveComplaint/:complaintId', async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { resolutionNote, newStatus, grantBadge } = req.body;

        //in the final deployament, only admin can resolve complaints
        if(req.user.role !== 'caregiver'){
            return res.status(403).json({ message: 'Forbidden: Only admin users can resolve complaints.' });
        }
    if(!resolutionNote || !newStatus){
        return res.status(400).json({ message: 'Resolution note and new status are required.' });
    }
    
        const result = await governanceService.resolveComplaint(
            complaintId,
            resolutionNote,
            newStatus,
            grantBadge
        );
        res.status(200).json({ message: 'Complaint resolved successfully.', result });
    } catch (error) {
        console.error('Complaint resolution error:', error.message);
        res.status(400).json({ message: 'Failed to resolve complaint.', error: error.message });
    }

});

module.exports = router;