const db = require('../config/config');

const user = {
   
    findbyemail:(email, cb)=>{
        const sql = `SELECT * FROM user WHERE email = ? LIMIT 1`;
        db.query(sql, [email], cb);
    },      

  
    create:(data, cb)=>{
        const {
            name, email, password, role, status,
            device_id, device_uuid, device_name, device_type, os_version
        } = data;
        const sql = `
            INSERT INTO user
            (name, email, password, role, status, device_id, device_uuid, device_name, device_type, os_version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [
            name, email, password, role, status,
            device_id || null, device_uuid || null, device_name || null, device_type || null, os_version || null
        ], cb);
    },

    // ➕ ADDED: Updates device info on every successful login.
    updatedevice:(id, device, cb)=>{
        const sql = `
            UPDATE user
            SET device_id = ?, device_uuid = ?, device_name = ?, device_type = ?, os_version = ?
            WHERE id = ?
        `;
        db.query(sql, [
            device.device_id || null,
            device.device_uuid || null,
            device.device_name || null,
            device.device_type || null,
            device.os_version || null,
            id
        ], cb);
    },

    
    getpending:(cb)=>{
        const sql = `SELECT id, name, email, role, status, created_at FROM user WHERE status = 'pending' ORDER BY id DESC`;
        db.query(sql, cb);
    },

    
    updatestatus:(id, status, cb)=>{
        const sql = `UPDATE user SET status = ? WHERE id = ?`;
        db.query(sql, [status, id], cb);
    },

    // ➕ ADDED: Password update used after OTP verification.
    updatepassword:(id, password, cb)=>{
        const sql = `UPDATE user SET password = ? WHERE id = ?`;
        db.query(sql, [password, id], cb);
    },

    // ➕ ADDED: Basic profile API helper.
    findbyid:(id, cb)=>{
        const sql = `SELECT id, name, email, role, status, device_id, device_uuid, device_name, device_type, os_version FROM user WHERE id = ? LIMIT 1`;
        db.query(sql, [id], cb);
    }
};

module.exports = user;