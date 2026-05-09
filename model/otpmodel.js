const db = require("../config/config");

const otp = {
  create: (data, cb) => {
    const { user_id, otp_code, expires_at } = data;

    const sql = `INSERT INTO otp_verify (user_id , otp_code , expires_at, is_used) VALUES (?,?,?,0)`;
    db.query(sql, [user_id, otp_code, expires_at], cb);
  },

  verify: (user_id, otp_code, cb) => {
    const sql = `SELECT * FROM otp_verify WHERE user_id = ? AND otp_code = ? AND expires_at > NOW() AND is_used = 0 ORDER BY id DESC LIMIT 1`;
    db.query(sql, [user_id, otp_code], cb);
  },

  getlatestactive: (user_id, cb) => {
    const sql = `SELECT * FROM otp_verify WHERE user_id = ? AND expires_at > NOW() AND is_used = 0 ORDER BY id DESC LIMIT 1`;
    db.query(sql, [user_id], cb);
  },

  markused: (id, cb) => {
    const sql = `UPDATE otp_verify SET is_used = 1 WHERE id = ?`;
    db.query(sql, [id], cb);
  },

  invalidateallactive: (user_id, cb) => {
    const sql = `UPDATE otp_verify SET is_used = 1 WHERE user_id = ? AND is_used = 0`;
    db.query(sql, [user_id], cb);
  },
};

module.exports = otp;
