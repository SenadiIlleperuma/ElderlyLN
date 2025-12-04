
const express = require('express');
const router = express.Router();
//const authService = require('../services/auth.service'); 
const authService= require('../services/auth.service');

router.post("/register", async (req, res) => {
    try {
        const { role, email, password, phone_no, full_name, district } = req.body; 

        if (!role || !email || !password || !phone_no || !full_name || !district) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }
        if (!['caregiver', 'family', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified.' });
        }
        
        const newUser = await authService.registerUser(
            role, email, password, phone_no, full_name, district
        );
        res.status(201).json({ 
            message: 'User registered successfully. Proceed to profile completion.',
            user: newUser
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({ message: 'Registration failed.', error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const loginData = await authService.loginUser(email, password);
        
        res.status(200).json({ 
            message: 'Login successful.',
            ...loginData 
        });

    } catch (error) {
        res.status(401).json({ message: 'Authentication failed. Invalid credentials.' });
    }
});

module.exports = router;