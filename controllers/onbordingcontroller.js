const db = require('../model/onbordingmodel');


exports.getall = (req, res) => {

    db.getall((err, results) => {

        if (err) {
            return res.status(500).json({
                statusCode: 500,
                message: "Error fetching onboarding data",
                data: results,
                error: err.message
            });
        }

        // EMPTY DATA
        if (results.length === 0) {
            return res.status(200).json({
                statusCode: 200,
                message: "No onboarding data found",
                data: null,
               
            });
        }

        return res.status(200).json({
            statusCode: 200,
            message: "Onboarding data fetched successfully",
            data: results,
           
        });

    });

};


exports.getbyid = (req, res) => {

    db.getbyid(req.params.id, (err, results) => {

        if (err) {
            return res.status(500).json({
                statusCode: 500,
                message: "Error fetching onboarding record",
                data: results,
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(200).json({
                statusCode: 200,
                message: "Onboarding record not found",
                data: null,
            });
        }

        return res.status(200).json({
            statusCode: 200,
            message: "Onboarding record fetched successfully",
            data: results[0],
            error: null
        });

    });

};



exports.create = (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            statusCode: 400,
            message: "Image is required",
           
        });
    }

    const data = {
        image: req.file.filename,
        heading: req.body.heading,
        subheading: req.body.subheading
    };

    db.create(data, (err, results) => {

        if (err) {
            return res.status(500).json({
                statusCode: 500,
                message: "Error creating onboarding post",
                error: err.message
            });
        }

        return res.status(201).json({
            statusCode: 201,
            message: "Post created successfully",
            data: {
                id: results.insertId,
                ...data
            },
            error: null
        });

    });

};



exports.update = (req, res) => {

    const data = {
        image: req.file ? req.file.filename : undefined,
        heading: req.body.heading,
        subheading: req.body.subheading
    };

    db.update(req.params.id, data, (err, result) => {

        if (err) {
            return res.status(500).json({
                statusCode: 500,
                message: "Error updating onboarding post",
                error: err.message
            });
        }

        return res.status(200).json({
            statusCode: 200,
            message: "Post updated successfully",
            data: result,
            error: null
        });

    });

};



exports.delete = (req, res) => {

    db.delete(req.params.id, (err) => {

        if (err) {
            return res.status(500).json({
                statusCode: 500,
                message: "Error deleting onboarding post",
                error: err.message
            });
        }

        return res.status(200).json({
            statusCode: 200,
            message: "Post deleted successfully",
            userID: req.params.id,
           
        });

    });

};