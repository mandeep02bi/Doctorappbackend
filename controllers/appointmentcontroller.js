const model = require('../model/appoitmentmodel');

exports.create = (req,res)=>{
    const data = {
        sender_id: req.body.sender_id,
        receiver_id: req.body.receiver_id,
        appointment_type: req.body.appointment_type,
        appointment_datetime: req.body.appointment_datetime
    }

    model.create(data, (err, result) =>{
        if(err) return res.status(500).json({message:"Error scheduling appointment" , error:err});

        return res.status(201).json({message:"Appointment scheduled successfully" , data:result});
    })

}

exports.getbyreceiver = (req,res)=>{
    const receiver_id = req.params.receiver_id;

    model.getbyreceiver(receiver_id , (err,result)=>{
        if(err) return res.status(500).json({message:"Error fetching appointments for receiver" , error:err});

        return res.status(200).json({message:"Appointments fetched successfully" , data:result});
    })
}

exports.getbysender = (req,res)=>{
    const sender_id = req.params.sender_id;

    model.getbysender(sender_id , (err,result)=>{
        if(err) return res.status(500).json({message:"Error fetching appointments for sender" , error:err});        

        return res.status(200).json({message:"Appointments fetched successfully" , data:result});
    })
}   

exports.updatestatus = (req,res)=>{
    const id = req.params.id;
    const status = req.body.status; 
    model.updatestatus(id , status , (err,result)=>{
        if(err) return res.status(500).json({message:"Error updating appointment status" , error:err}); 

        return res.status(200).json({message:"Appointment status updated successfully" , data:result});
    })
}   

exports.updatedatetime = (req,res)=>{  
    const id = req.params.id;
    const appointment_datetime = req.body.appointment_datetime;
    model.updatedatetime(id , appointment_datetime , (err,result)=>{
        if(err) return res.status(500).json({message:"Error updating appointment datetime" , error:err});

        return res.status(200).json({message:"Appointment datetime updated successfully" , data:result});
    })
}

exports.delete = (req,res)=>{
    const id = req.params.id;   
    model.delete(id , (err,result)=>{
        if(err) return res.status(500).json({message:"Error deleting appointment" , error:err});

        return res.status(200).json({message:"Appointment deleted successfully" , data:result});
    })
}

