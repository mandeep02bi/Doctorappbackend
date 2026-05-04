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
    db.create(req.body , (err, results)=>{
        if(err) return res.send (err);
        res.send({message:"Post created" , id:results.insertId});
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