const mongoose = require('mongoose');

async function connectDB (){
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Database Connected Successfully.')
    }
    catch(error){
        console.error('Database Connection error ', error);
    }
    
};

module.exports = connectDB;

