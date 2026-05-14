const db = require('../config/config');

const patientmodel = {
    create:(data , cb)=>{
        const { 
            name , 
            age , 
            gender , 
            phone,
            email,
            blood_group,
            address,
            created_by } = data;
  

    const sql= `
        INSERT INTO patient(
        name , age,
        gender, phone , email, 
        blood_group , address,
        created_by) VALUES (?,?,?,?,?,?,?,?)`
    
        db.query(sql , [name , age , gender , phone , email , blood_group , address , created_by ], cb);
 },

 getall:(cb)=>{
    const sql = ` SELECT 
            patient.*,
            blood_grp.name AS blood_group
        FROM patient
        JOIN blood_grp
        ON patient.blood_group = blood_grp.id
        ORDER BY patient.id DESC`;
    db.query(sql, cb);
 },
    getbyid:(id , cb)=>{
        const sql = ` SELECT 
            patient.*,
            blood_grp.name AS blood_group
        FROM patient
        JOIN blood_grp
        ON patient.blood_group = blood_grp.id
        WHERE patient.id = ?`;
        db.query(sql, [id], cb);        
    },

    findbyphoneoremail :(phone , email , cb)=>{
        const sql = `SELECT * FROM patient WHERE phone = ? OR email = ?`;
        db.query(sql, [phone , email], cb);
    }
}

module.exports = patientmodel;