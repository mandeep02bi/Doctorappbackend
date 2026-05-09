const reminder = require('../model/reminder');

exports.create = (req,res)=>{
    const data = {
        // 🔧 FIX: sender_id should come from authenticated user, not request body.
        sender_id: req.user.id,
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
    // ⚠️ IMPROVED: Non-admin users can read only their own records.
    if(req.user.role !== 'admin' && Number(receiver_id) !== Number(req.user.id)){
        return res.status(403).json({message:"Access denied for requested receiver"});
    }

    reminder.getbyuser(receiver_id , (err, result)=>{
        if(err) return res.status(500).json({message:"Error fetching reminders for receiver"});
        res.json(result);
    });
}

exports.getbysender =(req,res)=>{
    const sender_id = req.params.sender_id;
    // ⚠️ IMPROVED: Non-admin users can read only their own records.
    if(req.user.role !== 'admin' && Number(sender_id) !== Number(req.user.id)){
        return res.status(403).json({message:"Access denied for requested sender"});
    }

    reminder.getbysender(sender_id , (err, result)=>{
        if(err) return res.status(500).json({message:"Error fetching reminders for sender"});
        res.json(result);
    });
}