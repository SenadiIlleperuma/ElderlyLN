const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '150f6913e9b2c600d7463b2b27f027975459ff7416274fd051c33c42dac6a03a';

const authenticateToken = (req, res, next) => {
    const authHeader= req.headers ['authorization'];
    const token= authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Access Denied: No token provided.' });
    }

   jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Access Denied: Invalid or expired token.' });
        }
        req.user= user;
        next();

});

};

module.exports ={
    authenticateToken
};

