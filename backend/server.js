require('dotenv').config();
const express= require('express');
const cors = require('cors');
const authRouter= require('./routes/auth.route');
const app= express();
const PORT =process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

//routes
app.use('/app/auth',authRouter)
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

