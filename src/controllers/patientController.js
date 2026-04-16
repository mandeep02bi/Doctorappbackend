const Patient = require('../models/Patient');

exports.createProfile = async (req, res) => {
    try {
        const existing = await Patient.findOne({
            userId: req.user.id,
            is_deleted: false
        });

        if (existing) {
            return res.status(400).json({
                message: "Profile already exists"
            });
        }

        const patient = await Patient.create({
            userId: req.user.id,
            ...req.body
        });

        res.status(201).json({
            message: "Profile created",
            patient
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



exports.getMyProfile = async (req, res) => {
    try {
        const patient = await Patient.findOne({
            userId: req.user.id,
            is_deleted: false
        });

        if (!patient) {
            return res.status(404).json({
                message: "Profile not found"
            });
        }

        res.json(patient);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



exports.updateProfile = async (req, res) => {
    try {
        const patient = await Patient.findOneAndUpdate(
            { userId: req.user.id, is_deleted: false },
            req.body,
            { new: true }
        );

        if (!patient) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.json({
            message: "Profile updated",
            patient
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



exports.deleteProfile = async (req, res) => {
    try {
        const patient = await Patient.findOneAndUpdate(
            { userId: req.user.id },
            {
                is_deleted: true,
                deleted_at: new Date()
            },
            { new: true }
        );

        if (!patient) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.json({
            message: "Profile soft deleted"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



/*
const Patient = require('../models/Patient')

exports.createProfile = async (req, res) =>{
    try{
        const existing = await Patient.findOne({
            userId: req.user.id
        });
        if(existing){
            return res.status(400).json({
                message: "Profile already exists"
            })
        }

        const patient = await Patient.create({
            userId: req.user.id,
            ...req.body
        });

        res.status(201).json({
            message: "Profile created",
            patient
        });
    }
    catch (err){
        res.status(500).json({error: err.message});
    }
};


exports.getMyProfile = async (req, res) =>{
    try{
        const patient = await Patient.findOne({
            userId: req.user.id
        });
        if(!patient){
            return res.status(404).json({
                message: "Profile not found"
            });
        }
        res.json(patient)
    }
    catch(err){
        res.status(500).json({
            error: err.message
        });
    }
}


exports.updateProfile = async (req, res) => {
    try {
        const patient = await Patient.findOneAndUpdate(
            { userId: req.user.id },
            req.body,
            { new: true }
        );

        if (!patient) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.json({
            message: "Profile updated",
            patient
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.deleteProfile = async (req, res) => {
    try {
        const patient = await Patient.findOneAndDelete({
            userId: req.user.id
        });

        if (!patient) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.json({
            message: "Profile deleted"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


*/