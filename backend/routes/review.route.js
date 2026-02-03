// routes/review.route.js

const express = require('express');
const router = express.Router();
const reviewService = require('../services/review.service');
const { authenticateToken } = require('../middleware/auth.middleware'); 

router.use(authenticateToken); 

// POST /api/reviews/add
router.post('/add', async (req, res) => {
    try {
        const { bookingId, ratingScore, comment } = req.body;
        
        if (req.user.role !== 'family') {
            return res.status(403).json({ message: 'Forbidden: Only family users can submit reviews.' });
        }
        
        // Validation check
        if (!bookingId || ratingScore === undefined || ratingScore < 1 || ratingScore > 5) {
            return res.status(400).json({ message: 'Invalid input: Booking ID and a 1-5 rating score are required.' });
        }

        const result = await reviewService.addReview(
            req.user.user_id, 
            bookingId, 
            ratingScore, 
            comment
        );
        
        res.status(201).json({ message: 'Review successfully submitted.', result });
    } catch (error) {
        console.error('Review submission error:', error.message);
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;