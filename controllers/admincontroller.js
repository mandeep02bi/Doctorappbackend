const user = require("../model/usermodel");
const db = require("../config/config");

exports.getpendinguser = (req, res) => {
  db.query(`SELECT * FROM user WHERE status = 'pending'`, (err, rows) => {
    if (err) {
      return res.status(500).json({
        statuscode:500,
        message: "Database error",
        error: err
      });
    }

    if (rows.length === 0) {
      return res.status(200).json({
        statuscode:200,
        message: "No pending users found",
        data: []
      });
    }

    return res.status(200).json({
      statuscode:200,
      message: "Pending users fetched successfully",
      data: rows
    });
  });
};

exports.getallusers = (req, res) => {
  user.getallusers((err, rows) => {
    if (err) {
      return res.status(500).json({
        statuscode:500,
        message: "Database error",
        error: err
      });
    }
    return res.status(200).json({
      statuscode:200,
      message: "Users fetched successfully",
      data: rows
    });
  });
};

exports.approveuser = (req, res) => {
  console.log("Approving ID:", req.params.id);

  user.updatestatus(req.params.id, "approved", (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        statuscode:500,
        message: "Error approving user",
        error: err.message,
      });
    }

    console.log("Update Result:", result);

    return res.status(200).json({
      statuscode:200,
      message: "User approved",
      data: result  
    });
  });
};

exports.rejectuser = (req, res) => {
  user.updatestatus(req.params.id, "rejected", (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Error rejecting user", error: err.message });
    return res.status(200).json({
      statuscode:200,
      message: "User rejected",
      data: result
    });
  });
};
