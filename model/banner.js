const db = require('../config/config');

const banner = {
    getall:(cb) => {
        const sql = "SELECT * FROM banner";
        db.query(sql, cb);
    },

    create:(data , cb) =>{
        const { image , heading , subheading } = data;
        if(!heading ){
            return cb(new Error("Heading is required"));
        }
        const sql = "INSERT INTO banner (image , heading , subheading) VALUES (?, ?, ?)";
        db.query(sql, [image, heading, subheading], cb);
    }
}

module.exports = banner;