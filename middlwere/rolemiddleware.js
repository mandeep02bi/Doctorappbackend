const user = require('../model/usermodel');

exports.allowrole = (...role)=>{
    return (req,res,next) =>{
        // 🔧 FIX: Auth guard check to prevent role middleware crashes.
        if(!req.user || !req.user.role){
            return res.status(401).json({message:"Unauthenticated request"});
        }
        if(!role.includes(req.user.role)){
            return res.status(403).json({message:"Access denied"});
        }   
        next();
    }
}