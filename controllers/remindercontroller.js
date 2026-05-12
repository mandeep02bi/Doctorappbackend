const reminder = require('../model/reminder');


exports.create = (req, res) => {

    const data = {

        sender_id: req.user.id,
        receiver_id: req.body.receiver_id,
        type: req.body.type,
        title: req.body.title,
        description: req.body.description,
        reminder_datetime: req.body.reminder_datetime

    };

    reminder.create(data, (err, result) => {

        if (err) {

            console.log("DB ERROR:", err);

            return res.status(500).json({
                statusCode: 500,
                message: "Error creating reminder",
                userId: req.user.id,
                data: null,
                error: err.message
            });

        }

        return res.status(201).json({
            statusCode: 201,
            message: "Reminder created successfully",
            userId: req.user.id,
            data: {
                reminderId: result.insertId,
                ...data
            },
            error: null
        });

    });

};


exports.getbyreceiver = (req, res) => {

    const receiver_id = req.params.receiver_id;

    if (
        req.user.role !== 'admin' &&
        Number(receiver_id) !== Number(req.user.id)
    ) {

        return res.status(403).json({
            statusCode: 403,
            message: "Access denied for requested receiver",
            userId: req.user.id,
            data: null,
            error: null
        });

    }

    reminder.getbyuser(receiver_id, (err, result) => {

        if (err) {

            return res.status(500).json({
                statusCode: 500,
                message: "Error fetching reminders for receiver",
                userId: req.user.id,
                data: null,
                error: err.message
            });

        }

        if (result.length === 0) {

            return res.status(200).json({
                statusCode: 200,
                message: "No reminders found for receiver",
                userId: req.user.id,
                data: [],
                error: null
            });

        }

        return res.status(200).json({
            statusCode: 200,
            message: "Receiver reminders fetched successfully",
            userId: req.user.id,
            data: result,
            error: null
        });

    });

};


exports.getbysender = (req, res) => {

    const sender_id = req.params.sender_id;

    if (
        req.user.role !== 'admin' &&
        Number(sender_id) !== Number(req.user.id)
    ) {

        return res.status(403).json({
            statusCode: 403,
            message: "Access denied for requested sender",
            userId: req.user.id,
            data: null,
            error: null
        });

    }

    reminder.getbysender(sender_id, (err, result) => {

        if (err) {

            return res.status(500).json({
                statusCode: 500,
                message: "Error fetching reminders for sender",
                userId: req.user.id,
                data: null,
                error: err.message
            });

        }

        if (result.length === 0) {

            return res.status(200).json({
                statusCode: 200,
                message: "No reminders found for sender",
                userId: req.user.id,
                data: [],
                error: null
            });

        }

        return res.status(200).json({
            statusCode: 200,
            message: "Sender reminders fetched successfully",
            userId: req.user.id,
            data: result,
            error: null
        });

    });

};