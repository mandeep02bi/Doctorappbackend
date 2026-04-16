const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "No token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (user.is_deleted) {
            return res.status(403).json({ message: "Account deleted" });
        }

        if (user.is_blocked) {
            return res.status(403).json({ message: "User blocked" });
        }

        req.user = user; 
        next();

    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};