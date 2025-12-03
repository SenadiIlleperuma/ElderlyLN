// services/auth.service.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 

const JWT_SECRET = process.env.JWT_SECRET || '150f6913e9b2c600d7463b2b27f027975459ff7416274fd051c33c42dac6a03a'; 

const insertProfile = async (userId, role, profileData, client) => {
    const sql = (role === 'caregiver') ? 
        'INSERT INTO caregiver (user_fk, full_name, district) VALUES ($1, $2, $3)' :
        'INSERT INTO family (user_fk, full_name, district) VALUES ($1, $2, $3)';
    
    const values = [userId, profileData.full_name, profileData.district];
    await client.query(sql, values);
};

const registerUser = async (role, email, password, phone_no, full_name, district) => {
    const client = await db.pool.connect(); 
    try {
        await client.query('BEGIN'); 

        const hashedPassword = await bcrypt.hash(password, 10); 

        const userSql = `INSERT INTO "user" (email, phone_no, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING user_id, role, email`;
        const userResult = await client.query(userSql, [email, phone_no, hashedPassword, role]);
        const newUser = userResult.rows[0];
        
        const profileData = { full_name, district };
        await insertProfile(newUser.user_id, role, profileData, client);

        await client.query('COMMIT'); 
        return newUser;

    } 
    catch (error) {
        await client.query('ROLLBACK'); 
        if (error.code === '23505') { 
            throw new Error(`Email or phone number already registered.`);
        }
        throw error;
    } 
    finally {
        client.release();
    }
};

const loginUser = async (email, password) => {
    const userResult = await db.query(
        'SELECT user_id, password_hash, role, email, phone_no FROM "user" WHERE email = $1',
        [email]
    );
    const user = userResult.rows[0];

    if (!user) {
        throw new Error('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
        throw new Error('Invalid email or password.');
    }

    const token = jwt.sign(
        { user_id: user.user_id, role: user.role },
        JWT_SECRET,
        { expiresIn: '1d' } 
    );

    return { token, user_id: user.user_id, role: user.role, email: user.email };
};


module.exports = {
    registerUser,
    loginUser 
};