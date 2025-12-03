const express = require('express');
const router = express.Router();
const matchingService = require('../services/matching.service');
const { authenticateToken } = require('../middleware/auth.middleware'); 

router.post('/search', authenticateToken,async(req, res)=>{
    try{
        const filters = req.body;
        if(req.user.role !== 'family'){
            return res.status(403).json({message: 'Forbidden: Only families can search for caregivers.'});
        }
        const matches= await matchingService.servicecaregivers(filters);
        res.status(200).json(matches);
    }catch (error){
        console.error('Search error:', error.message);
        res.status(500).json({message: 'Search failed.'});

    }
});

module.exports= router;