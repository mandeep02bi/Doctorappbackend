const blood = require("../model/bloodmodel");

exports.postblood = (req, res) => {
  const { name } = req.body;
  if (!name)
    return res
      .status(400)
      .json({ statuscode: 400, message: "Blood group name is required" });

  blood.create(name, (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ statuscode: 500, message: "Error creating blood group" });
    res.json({
      statuscode: 200,
      message: "Blood group created",
      id: result.insertId,
      data: { name },
    });
  });
};

exports.getblood = (req, res) => {
  blood.getall((err, result) => {
    if (err)
      return res
        .status(500)
        .json({ statuscode: 500, message: "Error fetching blood groups" });

    res
      .status(200)
      .json({
        statuscode: 200,
        message: "Blood groups fetched successfully",
        data: result,
      });
  });
};
