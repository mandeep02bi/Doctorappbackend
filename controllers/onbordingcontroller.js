const db = require('../model/onbordingmodel');

exports.getall = (req,res)=>{
    db.getall((err, results)=>{
        if(err) return res.send(err);
        res.send(results);
    })
};

exports.getbyid = (req,res)=>{
    db.getbyid(req.params.id , (err, results)=>{
        if(err) return res.send(err);
        res.send(results[0]);
    })
};

exports.create = (req,res)=>{

    if(!req.file){
        return res.status(400).send({message:"Image is required"});
    }
    const data = {
        image: req.file.filename,
        heading: req.body.heading,
        subheading: req.body.subheading
    }
    db.create(data , (err, results)=>{
        if(err) return res.send (err);
        res.json({message:"Post created" , id:results.insertId});
    });
};

exports.update = (req,res)=>{
    db.update(req.params.id , req.body , (err , result)=>{
        if(err) return res.send(err);
        res.send({message:"Post updated" , results:result});
    })
}

exports.delete = (req,res)=>{
    db.delete(req.params.id , (err) =>{
        if(err) return res.send(err);
        res.send({message:"Post deleted"});
    })
}