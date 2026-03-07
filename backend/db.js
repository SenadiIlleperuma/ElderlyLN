//db.js

require('dotenv').config();

const {Pool}=require('pg');

const pool= new Pool({
    connectionString: process.env.SUPABASE_DB_URL
});

pool.query('SELECT NOW()',(err,res)=>{
    if(err){
        console.error('Database Connection Failed:' , err.stack);
    } else{
        console.log('Database Connection Connected successfully at:' , res.rows[0].now);
    }
});

module.exports={
    query: (text, params)=> pool.query(text,params),
    pool: pool
};

