const user = require('../model/usermodel');
const db = require('../config/config');

exports.getpendinguser = (req,res)=>{
   db.query(
        `SELECT * FROM user WHERE status = 'pending'`,
        (err, rows) => {

            if(err){
                return res.status(500).json({
                    message: "Database error"
                });
            }

            res.json(rows);
        }
    );
}

exports.approveuser = (req,res)=>{

    console.log("Approving ID:", req.params.id);

    user.updatestatus(req.params.id , 'approved' , (err , result)=>{

        if(err){
            console.log(err);
            return res.status(500).json({
                message:"Error approving user",
                error : err
            });
        }

        console.log("Update Result:", result);

        res.json({
            message:"User approved",
            result
        });
    });
}

exports.rejectuser = (req,res)=>{
    user.updatestatus(req.params.id , 'rejected' , (err , result)=>{
        if(err) return res.status(500).json({message:"Error rejecting user" , error : err});
        res.json({message:"User rejected"});
    })
}