const db = require('../model/banner');
exports.get = (req, res) => {
    db.getall((err, result)=>{
        if(err) return req.status(500).json({message:"Error fetching banner data"});
        res.json(result);
    })
}

exports.create = (req,res)=>{
    if(!req.file){
        return res.status(400).json({message:"Image is required "});
    }
    const data = {
        image: req.file.filename,
        heading: req.body.heading,
        subheading: req.body.subheading
    }

    db.create(data , (err, result)=>{
        if(err) return res.status(500).json({message:"Error creating banner"});
        res.json({message:"Banner created" , id:result.insertId});
    })
}