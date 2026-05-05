const db = require('../config/config');
const { getbyreceiver } = require('../controllers/remindercontroller');

const appointment = {
    
    create:(data , cb)=>{
        const {sender_id , receiver_id, appointment_type , appointment_datetime}=data;

        const sql = `INSERT INTO appointment (sender_id , receiver_id , appointment_type , appointment_datetime) VALUES (?,?,?,?)`;

        db.query(sql , [sender_id , receiver_id , appointment_type , appointment_datetime] , cb);
    },

    getbyreceiver:(receiver_id , cb ) =>{
        const sql = `SELECT * FROM appointment WHERE receiver_id = ?`;
        db.query(sql , [receiver_id] , cb);
    },

    getbysender:(sender_id , cb) =>{
        const sql = `SELECT * FROM appointment WHERE sender_id = ?`;
        db.query(sql , [sender_id] , cb);
    },
    
    updatestatus:(id , status , cb) =>{
        const sql = `UPDATE appointment SET status = ? WHERE id = ?`;
        db.query(sql , [status , id] , cb);
    },
    
    updatedatetime:(id , appointment_datetime , cb) =>{
        const sql = `UPDATE appointment SET appointment_datetime = ? WHERE id = ?`;
        db.query(sql , [appointment_datetime , id] , cb);
    },       

    delete:(id , cb) =>{
        const sql = `DELETE FROM appointment WHERE id = ?`;
        db.query(sql , [id] , cb);
    }   
}

module.exports = appointment;