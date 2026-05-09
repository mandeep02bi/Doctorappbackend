const db = require('../config/config');

exports.create = (data , cb) =>{
    const {user_id , token , device_uuid , expires_at} = data;    
    const sql = `INSERT INTO refresh_token (user_id , token , device_uuid , expires_at) VALUES (?,?,?,?)`;
    db.query(sql , [user_id , token , device_uuid , expires_at] , cb);
}

exports.findvalid = (user_id, token, cb) => {

    const sql = `
        SELECT *
        FROM refresh_token
        WHERE user_id = ?
        AND token = ?
        AND expires_at > NOW()
    `;

    db.query(sql, [user_id, token], cb);
};


// REVOKE TOKEN
exports.revokebyhash = (token, cb) => {

    const sql = `
        DELETE FROM refresh_token
        WHERE token = ?
    `;

    db.query(sql, [token], cb);
};