const jwt = require("jsonwebtoken");

exports.generateaccesstoken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },

    process.env.JWT_SECRET,
    { expiresIn: "1m" },
  );
};

exports.generaterefreshtoken = (user) => {
  return jwt.sign(
    {id:user.id},
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );
};   
