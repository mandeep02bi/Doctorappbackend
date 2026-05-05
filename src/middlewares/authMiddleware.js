const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    // Check if no token or invalid format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    try {
        const token = authHeader.split(' ')[1];
        
        // Verify token securely using secret from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Inject user info into request object
        req.user = decoded; // Contains { id, role } inside the JWT
        
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
