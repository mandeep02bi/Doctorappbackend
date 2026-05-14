const db = require('../config/config');

const bloodmodel = {
    create:(name , cb) =>{
        const sql = `INSERT INTO blood_grp (name) VALUES (?)`;
        db.query(sql, [name], cb);
    },

    getall:(cb)=>{
        const sql = "SELECT * FROM blood_grp ORDER BY name DESC";
        db.query(sql, cb);
    }
}
module.exports = bloodmodel;