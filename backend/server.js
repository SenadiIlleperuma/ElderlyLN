require('dotenv').config();
const express= require('express');
const db = require('./db');
const cors = require('cors');
const authRouter= require('./routes/auth.route');
const matchingRouter = require('./routes/matching.route');
const reviewRouter= require('./routes/review.route');
const bookingRouter= require('./routes/booking.route');
const governanceRouter= require('./routes/governance.route');

 const app= express();
const PORT =process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

//routes
app.use('/api/auth',authRouter)
app.use('/api/matching',matchingRouter);
app.use('/api/review',reviewRouter);
app.use('/api/booking',bookingRouter);
app.use('/api/governance',governanceRouter);


//test API
app.get ('/api/test',async(req, res)=>{
    try{
        const result= await db.query('SELECT \'Server is running and DB is connected\' AS message;');
        res.status(200).json(result.rows[0]);
    }catch (error){
        res.status(500).send('Server error.Check DB connection logs.');
    }
});

//starting the server
app.listen(PORT, ()=>{
    console.log(`ElderlyLN Backend running on port ${PORT}`);
    console.log(`Test API at: http://localhost:${PORT}/api/test\n`);
});

