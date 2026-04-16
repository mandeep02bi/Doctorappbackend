const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/token');
const Patient = require('../models/Patient');
const DeletedUser = require('../models/DeletedUser');

const sendEmail = require("../utils/email");

exports.signup = async (req, res) => {
    try {
        let {
            name,
            email,
            password,
            device,
            device_id,
            device_version,
            device_os
        } = req.body;

        email = email.toLowerCase().trim();

        const exist = await User.findOne({
            email,
            is_deleted: false
            });
        if (exist) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpiry: Date.now() + 5 * 60 * 1000,
            isVerified: false,
            role: 'patient',
            device,
            device_id,
            device_version,
            device_os
        });

        console.log("User saved:", user);

        await sendEmail(email, "OTP Verification", `Your OTP is ${otp}`);

        res.json({
            message: "OTP sent to email",
            user
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message });
    }
};



exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.toLowerCase().trim();

        const user = await User.findOne({
             email,
             is_deleted: false 
            });

        console.log("User found:", user);

        if (!user) {
            return res.status(400).json({
                 message: "Invalid email and password" 
                });
        }

        if (user.is_deleted) {
            return res.status(403).json({
                message: "Account deleted"
            });
        }
        

        if (user.is_blocked) {
            return res.status(403).json({ message: "User blocked" });
        }

        if (!user.isVerified) {
            return res.status(400).json({
                message: "Verify your email first"
            });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            console.log("Password mismatch:", user.password, password, match);
            return res.status(400).json({ 
                message: "Invalid email or password" 
            });
        }


        const token = generateToken(user);

        res.status(200).json({
            message: "Login successful",
            token,
            user
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        
        if (user.is_deleted) {
            return res.status(400).json({
                message: "Account already deleted"
            });
        }

       
        await DeletedUser.create({
            originalData: user.toObject()
        });

      
        await User.findByIdAndUpdate(req.user._id, {
            is_deleted: true,
            deleted_at: new Date()
        });

    
        await Patient.findOneAndUpdate(
            { userId: req.user._id },
            {
                is_deleted: true,
                deleted_at: new Date()
            }
        );

        res.json({
            message: "Account & Profile soft deleted"
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
};


const generateOTP = () =>{
    return Math.floor(100000 + Math.random() * 900000).toString();
};



exports.verifyOTP = async (req, res) =>{
    const {email, otp} = req.body

    try{
        const user  = await User.findOne({email});
        
        if(!user){
            return res.status(400).json({
                message: "User not found"
            });
        };
        if(user.otp !== otp){
            return res.status(400).json({
                message: "Invalid OTP"
            });
        };
        if(user.otpExpiry < Date.now()){
            return res.status(400).json({
                message: "OTP expired"
            });
        };

        user.isVerified = true;
        user.otp = null;

        await user.save();

        res.json({
            message: "Email verified successfully"
        });
    }
    catch(err){
        res.status(500).json({
            error: err.message
        });
    }
};
