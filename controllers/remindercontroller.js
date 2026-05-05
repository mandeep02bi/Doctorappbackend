const reminder = require('../model/reminder');

exports.create = (req,res)=>{
    const data = {
        sender_id: req.body.sender_id,
        receiver_id: req.body.receiver_id,
        type: req.body.type,
        title: req.body.title,
        description: req.body.description,
        reminder_datetime: req.body.reminder_datetime
    };

    reminder.create(data , (err, result)=>{
       if (err) {
    console.log("DB ERROR:", err);  
    return res.status(500).json({ message: err.message });
}
        res.json({message:"Reminder created" , id:result.insertId});
    });
}

exports.getbyreceiver =(req,res)=>{
    const receiver_id = req.params.receiver_id;

    reminder.getbyuser(receiver_id , (err, result)=>{
        if(err) return res.status(500).json({message:"Error fetching reminders for receiver"});
        res.json(result);
    });
}

exports.getbysender =(req,res)=>{
    const sender_id = req.params.sender_id;

    reminder.getbysender(sender_id , (err, result)=>{
        if(err) return res.status(500).json({message:"Error fetching reminders for sender"});
        res.json(result);
    });
}