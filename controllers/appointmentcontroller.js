const model = require("../model/appoitmentmodel");

exports.create = (req, res) => {
  const data = {
    sender_id: req.user.id,
    receiver_id: req.body.receiver_id,
    appointment_type: req.body.appointment_type,
    appointment_datetime: req.body.appointment_datetime,
  };

  model.create(data, (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ statuscode:500,message: "Error scheduling appointment", error: err.message });

    return res
      .status(201)
      .json({ statuscode:201,message: "Appointment scheduled successfully", data: result });
  });
};

exports.getbyreceiver = (req, res) => {
  const receiver_id = req.params.receiver_id;

  if (
    req.user.role !== "admin" &&
    Number(receiver_id) !== Number(req.user.id)
  ) {
    return res
      .status(403)
      .json({ statuscode:403, message: "Access denied for requested receiver" });
  }

  model.getbyreceiver(receiver_id, (err, result) => {
    if (err)
      return res
        .status(500)
        .json({
          statuscode:500,
          message: "Error fetching appointments for receiver",
          error: err.message,
        });

    return res
      .status(200)
      .json({ statuscode:200, message: "Appointments fetched successfully", data: result });
  });
};

exports.getbysender = (req, res) => {
  const sender_id = req.params.sender_id;

  if (req.user.role !== "admin" && Number(sender_id) !== Number(req.user.id)) {
    return res
      .status(403)
      .json({ statuscode:403, message: "Access denied for requested sender" });
  }

  model.getbysender(sender_id, (err, result) => {
    if (err)
      return res
        .status(500)
        .json({
          statuscode:500,
          message: "Error fetching appointments for sender",
          error: err.message,
        });

    return res
      .status(200)
      .json({ statuscode:200, message: "Appointments fetched successfully", data: result });
  });
};

exports.updatestatus = (req, res) => {
  const id = req.params.id;
  const status = req.body.status;
  model.updatestatus(id, status, (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ statuscode:500, message: "Error updating appointment status", error: err.message });

    return res
      .status(200)
      .json({
        statuscode:200,
        message: "Appointment status updated successfully",
        data: result,
      });
  });
};

exports.updatedatetime = (req, res) => {
  const id = req.params.id;
  const appointment_datetime = req.body.appointment_datetime;
  model.updatedatetime(id, appointment_datetime, (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ statuscode:500, message: "Error updating appointment datetime", error: err.message });

    return res
      .status(200)
      .json({
        statuscode:200,
        message: "Appointment datetime updated successfully",
        data: result,
      });
  });
};

exports.delete = (req, res) => {
  const id = req.params.id;
  model.delete(id, (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ statuscode:500, message: "Error deleting appointment", error: err.message });

    return res
      .status(200)
      .json({ statuscode:200, message: "Appointment deleted successfully", data: result });
  });
};
