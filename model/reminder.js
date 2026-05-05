const db = require('../config/config');

const reminder = {
    create:(data , cb)=>{
        const {sender_id , receiver_id, type, title, description , reminder_datetime} = data;

        const sql = `INSERT INTO reminder (sender_id, receiver_id, type, title, description, reminder_datetime) VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(sql , [sender_id , receiver_id , type , title , description , reminder_datetime] , cb);
    },

    getbyuser:(receiver_id , cb ) =>{
        const sql = `SELECT * FROM reminder WHERE receiver_id = ?`;
        db.query(sql , [receiver_id] , cb);

    },

    getbysender:(sender_id , cb) =>{
        const sql = `SELECT * FROM reminder WHERE sender_id = ?`;
        db.query(sql , [sender_id] , cb);
    }

}

module.exports = reminder;