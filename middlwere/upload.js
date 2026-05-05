const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req,res,cb)=>{
        cb(null, 'uploads/');
    },
    filename: (req,file,cb)=>{
        const name = Date.now()+path.extname(file.originalname);
        cb(null, name);
    }
})

const filefilter = (req,file, cb)=>{
   const allowedtypes = ["image/jpeg", "image/png", "image/jpg" , "image/webp"];


    if (!file) {
        return cb(new Error("No file uploaded"), false);
    }
    if(allowedtypes.includes(file.mimetype)){
        cb(null, true);

    }else{
        cb(new Error("Only jpeg, png and jpg files are allowed"), false);
    }
}

const upload = multer({
    storage: storage,
    fileFilter: filefilter,
    limits: {fileSize: 1920 * 1024 * 15}
})

module.exports = upload;