const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/token');
const Patient = require('../models/Patient');

exports.signup = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            device,
            device_id,
            device_version,
            device_os
        } = req.body;

        const exist = await User.findOne({ email });
        if (exist) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hash,
            role: 'patient',
            device,
            device_id,
            device_version,
            device_os
        });

        res.json({
            message: "Signup successful",
            user
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (user.is_deleted) {
            return res.status(403).json({ message: "Account deleted" });
        }

        if (user.is_blocked) {
            return res.status(403).json({ message: "User blocked" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user);

        res.json({
            message: "Login successful",
            token,
            user
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.deleteAccount = async (req, res) => {
    try {

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
        res.status(500).json({ error: err.message });
    }
};




/*
const User = require('../models/User')
const bcrypt = require('bcryptjs');
const {generateToken} = require('../utils/token')

// SignUp

exports.signup = async(req, res) =>{
    try{
        const{
            name,
            email,
            password,
            device,
            device_id,
            device_version,
            device_os
        } = req.body;

        const exist = await User.findOne({email});
        if(exist){
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hash,
            role: 'patient',
            device,
            device_id,
            device_version,
            device_os
        });

        res.json({
            message: "Signup successful",
            user
        });
    }
    catch (err){
        res.status(500).json({
            error: err.message
        })
    }
};

// Login

exports.login = async(req, res) =>{
    try{
        const{ email, password } = req.body;

        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        if(user.is_blocked){
            return res.status(403).json({
                message: "User blocked"
            });
        }
        const match = await bcrypt.compare(password, user.password);
        if(!match){
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        const token = generateToken(user);
        res.json({
            message: "Login successful",
            token,
            user
        });

    }
    catch (err){
        res.status(500).json({
            error: err.message
        });
    }
};


*/