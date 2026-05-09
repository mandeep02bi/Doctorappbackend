const jwt = require('jsonwebtoken');

// 🔧 FIX: Correct middleware naming and keep backward-compatible alias.
exports.verifytoken = (req , res, next) =>{
    const token = req.headers.authorization?.split(" ")[1];

    if(!token) return res.status(401).json({message:"No token provided"});

    try {
        const decode = jwt.verify(token , process.env.JWT_SECRET);
        req.user = decode;
        next();
    } catch (error) {
        return res.status(401).json({message:"Invalid token"});
    }
};

// ⚠️ IMPROVED: Preserve old export to avoid breaking existing imports.
exports.berifytoken = exports.verifytoken;