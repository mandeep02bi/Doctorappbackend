const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const usermodel = require("../model/usermodel");
const otpmodel = require("../model/otpmodel");
const refreshtokenmodel = require("../model/refershtokenmodel");
const { generateOtp } = require("../utils/otpgeneratorutil");
const { sendotpemail } = require("../utils/emailutil");
const {
  generateaccesstoken,
  generaterefreshtoken,
} = require("../utils/jwtutil");
const { error } = require("console");

const validroles = ["admin", "doctor", "nurse", "staff"];
const refreshroles = ["doctor", "nurse", "staff"];

const hashvalue = (val) =>
  crypto.createHash("sha256").update(val).digest("hex");

const getdevice = (body = {}) => ({
  device_id: body.device_id,
  device_uuid: body.device_uuid,
  device_name: body.device_name,
  device_type: body.device_type,
  os_version: body.os_version,
});

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const role = (req.body.role || "staff").toLowerCase();
    const device = getdevice(req.body);

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({
          statuscode: 400,
          message: "name, email and password are required",
        });
    }
    if (!validroles.includes(role)) {
      return res.status(400).json({ statuscode: 400, message: "Invalid role" });
    }

    usermodel.findbyemail(email, async (finderr, users) => {
      if (finderr)
        return res
          .status(500)
          .json({
            statuscode: 500,
            message: "Error checking email",
            error: finderr.message,
          });
      if (users.length)
        return res
          .status(409)
          .json({ statuscode: 409, message: "Email already registered" });

      const hashedpassword = await bcrypt.hash(password, 10);

      const status = role === "admin" ? "approved" : "pending";

      usermodel.create(
        {
          name,
          email,
          password: hashedpassword,
          role,
          status,
          ...device,
        },
        (createerr, result) => {
          if (createerr)
            return res.status(500).json({
              statuscode: 500,
              message: "Error creating user",
              error: createerr.message,
            });
          return res.status(201).json({
            statuscode: 201,
            message:
              role === "admin"
                ? "Admin signup successful"
                : "Signup successful. Waiting for admin approval",
            id: result.insertId,

            status,
          });
        },
      );
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  const device = getdevice(req.body);
  if (!email || !password) {
    return res
      .status(400)
      .json({ statuscode: 400, message: "email and password are required" });
  }

  usermodel.findbyemail(email, async (err, users) => {
    if (err)
      return res
        .status(500)
        .json({ statuscode: 500, message: "Error during login",  error:err.message });
    if (!users.length)
      return res
        .status(401)
        .json({ statuscode: 401, message: "Invalid credentials" });

    const user = users[0];
    const isvalid = await bcrypt.compare(password, user.password);
    if (!isvalid)
      return res
        .status(401)
        .json({ statuscode: 401, message: "Invalid credentials" });

    if (user.status === "pending")
      return res
        .status(403)
        .json({ statuscode: 403, message: "Account pending admin approval" });
    if (user.status === "rejected")
      return res
        .status(403)
        .json({ statuscode: 403, message: "Account rejected by admin" });
    if (user.status !== "approved")
      return res
        .status(403)
        .json({
          statuscode: 403,
          message: "Account status not allowed for login",
        });

    const safeDevice = {
      device_id: device.device_id || user.device_id,
      device_uuid: device.device_uuid || user.device_uuid,
      device_name: device.device_name || user.device_name,
      device_type: device.device_type || user.device_type,
      os_version: device.os_version || user.os_version,
    };
    if (safeDevice.device_uuid) {
      usermodel.updatedevice(user.id, safeDevice, (err) => {
        if (err) console.log(err);
      });
    }

    const accesstoken = generateaccesstoken(
      { id: user.id, role: user.role },
      "30m",
    );

    if (user.role === "admin") {
      return res.status(200).json({
        statuscode: 200,
        message: "Login successful",
        accesstoken,
        token_type: "access_only",
      });
    }

    if (!refreshroles.includes(user.role)) {
      return res
        .status(403)
        .json({ statuscode: 403, message: "Role not allowed" });
    }

    const refreshtoken = generaterefreshtoken(
      { id: user.id, role: user.role },
      "7d",
    );
    const tokenhash = hashvalue(refreshtoken);
    const expiresat = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    refreshtokenmodel.create(
      {
        user_id: user.id,
        token: tokenhash,
        device_uuid: device.device_uuid,
        expires_at: expiresat,
      },
      (saveerr) => {
        if (saveerr)
          return res.status(500).json({
            statuscode: 500,
            message: "Error creating refresh session",
            error: saveerr.message,
          });
        return res.status(200).json({
          statuscode: 200,
          message: "Login successful",
          data: {
            accessToken: accesstoken,
            refreshToken: refreshtoken,
            tokenType: "access_refresh",
            role: user.role,
            status: user.status,
          },
          error: null,
        });
      },
    );
  });
};

exports.refreshtoken = (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({statuscode: 400, message: "Token is required"  });

  const tokenhash = hashvalue(token);

  jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,

    (err, decoded) => {
      if (err)
        return res.status(401).json({ statuscode: 401, message: "Invalid refresh token" });

      if (decoded.role === "admin")
        return res
          .status(403)
          .json({ statuscode: 403, message: "Admin does not use refresh token flow" });

      refreshtokenmodel.findvalid(decoded.id, tokenhash, (dberr, rows) => {
        if (dberr)
          return res
            .status(500)
            .json({
              statuscode: 500,
              message: "Error validating refresh token",
              error: dberr.message,
            });

        if (!rows.length)
          return res
            .status(401)
            .json({
              statuscode: 401,
              message: "Refresh token expired or revoked",
            });

        const newaccess = generateaccesstoken(
          { id: decoded.id, role: decoded.role },
          "30m",
        );

        return res
          .status(200)
          .json({
            statuscode: 200,
            message: "New access token generated",
            accesstoken: newaccess,
          });
      });
    },
  );
};

exports.logout = (req, res) => {
  const { refreshtoken } = req.body;
  if (!refreshtoken) return res.status(200).json({ statuscode: 200, message: "Logged out" });
  const tokenhash = hashvalue(refreshtoken);
  refreshtokenmodel.revokebyhash(tokenhash, (err) => {
    if (err) return res.status(500).json({ statuscode: 500, message: "Error during logout" });
    return res.status(200).json({ statuscode: 200, message: "Logged out successfully" });
  });
};

exports.forgotpassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ statuscode: 400, message: "email is required" });

  usermodel.findbyemail(email, (err, users) => {
    if (err) return res.status(500).json({ statuscode: 500, message: "Error finding user" });
    if (!users.length)
      return res.status(404).json({ statuscode: 404, message: "User not found" });

    const user = users[0];
    const otp = String(generateOtp());
    const otphash = hashvalue(otp);
    const expiresat = new Date(Date.now() + 10 * 60 * 1000);

    otpmodel.invalidateallactive(user.id, () => {
      otpmodel.create(
        { user_id: user.id, otp_code: otphash, expires_at: expiresat },
        async (createerr) => {
          if (createerr)
            return res.status(500).json({
              statuscode: 500,
              message: "Error generating OTP",
              error: createerr.message,
            });
          try {
            await sendotpemail(email, otp);
            return res.status(200).json({ statuscode: 200, message: "OTP sent successfully" });
          } catch (mailerr) {
            return res
              .status(500)
              .json({ statuscode: 500, message: "Failed to send OTP", error: mailerr.message });
          }
        },
      );
    });
  });
};

exports.verifyotp = (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ statuscode: 400, message: "email and otp are required" });

  usermodel.findbyemail(email, (err, users) => {
    if (err) return res.status(500).json({ statuscode: 500, message: "Error finding user" });
    if (!users.length)
      return res.status(404).json({ statuscode: 404, message: "User not found" });
    const user = users[0];

    const otphash = hashvalue(String(otp));
    otpmodel.verify(user.id, otphash, (otperr, rows) => {
      if (otperr)
        return res.status(500).json({ statuscode: 500, message: "Error verifying OTP" });
      if (!rows.length)
        return res.status(400).json({ statuscode: 400, message: "Invalid or expired OTP" });
      return res.status(200).json({ statuscode: 200, message: "OTP verified" });
    });
  });
};

exports.resetpassword = async (req, res) => {
  const { email, otp, newpassword } = req.body;
  if (!email || !otp || !newpassword) {
    return res
      .status(400)
      .json({ statuscode: 400, message: "email, otp and newpassword are required" });
  }

  usermodel.findbyemail(email, async (err, users) => {
    if (err) return res.status(500).json({ statuscode: 500, message: "Error finding user" });
    if (!users.length)
      return res.status(404).json({ statuscode: 404, message: "User not found" });
    const user = users[0];
    const otphash = hashvalue(String(otp));

    otpmodel.verify(user.id, otphash, async (otperr, rows) => {
      if (otperr)
        return res.status(500).json({ statuscode: 500, message: "Error validating OTP" });
      if (!rows.length)
        return res.status(400).json({ statuscode: 400, message: "Invalid or expired OTP" });

      const otpentry = rows[0];
      const hashedpassword = await bcrypt.hash(newpassword, 10);

      // 🔧 FIX: Update password only after OTP validation and then consume OTP.
      usermodel.updatepassword(user.id, hashedpassword, (passerr) => {
        if (passerr)
          return res.status(500).json({ statuscode: 500, message: "Error resetting password" });

        otpmodel.markused(otpentry.id, (markerr) => {
          if (markerr)
            return res
              .status(500)
              .json({ statuscode: 500, message: "Password reset but OTP status update failed" });
          return res.status(200).json({ statuscode: 200, message: "Password reset successful" });
        });
      });
    });
  });
};

exports.profile = (req, res) => {
  usermodel.findbyid(req.user.id, (err, users) => {
    if (err) return res.status(500).json({ statuscode: 500, message: "Error fetching profile" });
    if (!users.length)
      return res.status(404).json({ statuscode: 404, message: "User not found" });
    return res.status(200).json({ statuscode: 200, ...users[0] });
  });
};
