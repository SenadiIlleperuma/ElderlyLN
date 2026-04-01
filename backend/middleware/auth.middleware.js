const jwt = require('jsonwebtoken');

// Load JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;


const authenticateToken = (req, res, next) => {
    const authHeader= req.headers ['authorization'];
    const token= authHeader && authHeader.split(' ')[1];

    // Reject if token is null
    if (token == null) {
        return res.status(401).json({ message: 'Access Denied: No token provided.' });
    }
// Verify the token
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

