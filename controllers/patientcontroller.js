const patient = require('../model/patientmodel');

exports.createpatient = (req,res)=>{
    const {
        name , 
        age , 
        gender , 
        phone , 
        email,
        blood_group,
        address
    } = req.body;

    if(!name || !age || !gender || !phone || !email || !blood_group || !address){
        return res.status(400).json({statuscode: 400, message:"All fields are required"});
    }

    if (phone.length !== 10) {
        return res.status(400).json({ statuscode: 400, message: "Phone number must be 10 digits" });
    }

    if(email && !/^\S+@\S+\.\S+$/.test(email)){
        return res.status(400).json({statuscode: 400, message:"Invalid email format"});
    }

    patient.findbyphoneoremail(phone , email , (err, result) =>{
        if(err) return res.status(500).json({statuscode: 500, message:"Error checking existing patient"});

        if(result.length > 0){
            return res.status(400).json({statuscode: 400, message:"Patient with this phone or email already exists"});
        }       
    })
    const data = {
            name,
            age,
            gender,
            phone,
            email,
            blood_group,
            address,
            created_by: req.user.id
        };


    patient.create(data , (err ,result)=>{
        if(err) return res.status(500).json({statuscode: 500, message:"Error creating patient", error: err.message});

        res.json({statuscode: 200, message:"Patient created", id: result.insertId , data: data});
    });
}

exports.getallpatient = (req,res)=>{
    patient.getall((err , result)=>{
        if(err) return res.status(500).json({statuscode: 500, message:"Error fetching patients" , error : err.message});

        res.json({statuscode: 200,message: "Patients fetched Successfully", data: result});
    })
}

exports.getpatientbyid = (req,res)=>{
    const id = req.params.id;
    patient.getbyid(id , (err , result)=>{
        if(err) return res.status(500).json({statuscode: 500, message:"Error fetching patient"});

        if(result.length === 0) return res.status(404).json({statuscode: 404, message:"Patient not found"});
        
        res.json({statuscode: 200,message: "Patient fetched Successfully", data: result[0]});
    })
}