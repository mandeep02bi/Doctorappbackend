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
        .json({ message: "name, email and password are required" });
    }
    if (!validroles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    usermodel.findbyemail(email, async (finderr, users) => {
      if (finderr)
        return res
          .status(500)
          .json({ message: "Error checking email", error: finderr.message });
      if (users.length)
        return res.status(409).json({ message: "Email already registered" });

      const hashedpassword = await bcrypt.hash(password, 10);
      // 🔧 FIX: Enforce signup rule: admin approved directly, others pending.
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
              message: "Error creating user",
              error: createerr.message,
            });
          return res.status(201).json({
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
    return res.status(400).json({ message: "email and password are required" });
  }

  usermodel.findbyemail(email, async (err, users) => {
    if (err) return res.status(500).json({ message: "Error during login" });
    if (!users.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = users[0];
    const isvalid = await bcrypt.compare(password, user.password);
    if (!isvalid)
      return res.status(401).json({ message: "Invalid credentials" });

    // 🔧 FIX: Block login for non-approved users.
    if (user.status === "pending")
      return res
        .status(403)
        .json({ message: "Account pending admin approval" });
    if (user.status === "rejected")
      return res.status(403).json({ message: "Account rejected by admin" });
    if (user.status !== "approved")
      return res
        .status(403)
        .json({ message: "Account status not allowed for login" });

    // ⚠️ IMPROVED: Keep latest device info stored for audit and session traceability.
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
      "1m",
    );

    // 🔧 FIX: Admin uses access-token-only flow by requirement.
    if (user.role === "admin") {
      return res.status(200).json({
        message: "Login successful",
        accesstoken,
        token_type: "access_only",
      });
    }

    if (!refreshroles.includes(user.role)) {
      return res.status(403).json({ message: "Role not allowed" });
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
            message: "Error creating refresh session",
            error: saveerr.message,
          });
        return res.status(200).json({
          message: "Login successful",
          accesstoken,
          refreshtoken,
          token_type: "access_refresh",
        });
      },
    );
  });
};

// ➕ ADDED: Refresh endpoint for doctor/nurse/staff long-session experience.
exports.refreshtoken = (req, res) => {

  const { token } = req.body;
  
  if (!token)
    return res.status(400).json({ message: "Token is required" });

  const tokenhash = hashvalue(token);

  jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,

    (err, decoded) => {
    
      if (err)
        return res.status(401).json({ message: "Invalid refresh token" });

      if (decoded.role === "admin")
        return res
          .status(403)
          .json({ message: "Admin does not use refresh token flow" });


      refreshtokenmodel.findvalid(
        decoded.id,
        tokenhash, 
        (dberr, rows) => {
        
          if (dberr)
          return res
            .status(500)
            .json({ message: "Error validating refresh token" , error:dberr.message });

        if (!rows.length)
          return res
            .status(401)
            .json({ message: "Refresh token expired or revoked" });


        const newaccess = generateaccesstoken(
          { id: decoded.id, role: decoded.role },
          "30m",
        );

        return res.status(200).json({ message: "New access token generated", accesstoken: newaccess });
      });
    },
  );
};

// ➕ ADDED: Logout endpoint for revoking refresh token.
exports.logout = (req, res) => {
  const { refreshtoken } = req.body;
  if (!refreshtoken) return res.status(200).json({ message: "Logged out" });
  const tokenhash = hashvalue(refreshtoken);
  refreshtokenmodel.revokebyhash(tokenhash, (err) => {
    if (err) return res.status(500).json({ message: "Error during logout" });
    return res.status(200).json({ message: "Logged out successfully" });
  });
};

exports.forgotpassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "email is required" });

  usermodel.findbyemail(email, (err, users) => {
    if (err) return res.status(500).json({ message: "Error finding user" });
    if (!users.length)
      return res.status(404).json({ message: "User not found" });

    const user = users[0];
    const otp = String(generateOtp());
    const otphash = hashvalue(otp);
    const expiresat = new Date(Date.now() + 10 * 60 * 1000);

    // 🔧 FIX: Invalidate existing active OTPs before issuing new OTP.
    otpmodel.invalidateallactive(user.id, () => {
      otpmodel.create(
        { user_id: user.id, otp_code: otphash, expires_at: expiresat },
        async (createerr) => {
          if (createerr)
            return res.status(500).json({
              message: "Error generating OTP",
              error: createerr.message,
            });
          try {
            await sendotpemail(email, otp);
            return res.status(200).json({ message: "OTP sent successfully" });
          } catch (mailerr) {
            return res
              .status(500)
              .json({ message: "Failed to send OTP", error: mailerr.message });
          }
        },
      );
    });
  });
};

// ➕ ADDED: Separate OTP verify endpoint before password reset.
exports.verifyotp = (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "email and otp are required" });

  usermodel.findbyemail(email, (err, users) => {
    if (err) return res.status(500).json({ message: "Error finding user" });
    if (!users.length)
      return res.status(404).json({ message: "User not found" });
    const user = users[0];

    const otphash = hashvalue(String(otp));
    otpmodel.verify(user.id, otphash, (otperr, rows) => {
      if (otperr)
        return res.status(500).json({ message: "Error verifying OTP" });
      if (!rows.length)
        return res.status(400).json({ message: "Invalid or expired OTP" });
      return res.status(200).json({ message: "OTP verified" });
    });
  });
};

exports.resetpassword = async (req, res) => {
  const { email, otp, newpassword } = req.body;
  if (!email || !otp || !newpassword) {
    return res
      .status(400)
      .json({ message: "email, otp and newpassword are required" });
  }

  usermodel.findbyemail(email, async (err, users) => {
    if (err) return res.status(500).json({ message: "Error finding user" });
    if (!users.length)
      return res.status(404).json({ message: "User not found" });
    const user = users[0];
    const otphash = hashvalue(String(otp));

    otpmodel.verify(user.id, otphash, async (otperr, rows) => {
      if (otperr)
        return res.status(500).json({ message: "Error validating OTP" });
      if (!rows.length)
        return res.status(400).json({ message: "Invalid or expired OTP" });

      const otpentry = rows[0];
      const hashedpassword = await bcrypt.hash(newpassword, 10);

      // 🔧 FIX: Update password only after OTP validation and then consume OTP.
      usermodel.updatepassword(user.id, hashedpassword, (passerr) => {
        if (passerr)
          return res.status(500).json({ message: "Error resetting password" });

        otpmodel.markused(otpentry.id, (markerr) => {
          if (markerr)
            return res
              .status(500)
              .json({ message: "Password reset but OTP status update failed" });
          return res.status(200).json({ message: "Password reset successful" });
        });
      });
    });
  });
};

// ➕ ADDED: Protected user profile endpoint.
exports.profile = (req, res) => {
  usermodel.findbyid(req.user.id, (err, users) => {
    if (err) return res.status(500).json({ message: "Error fetching profile" });
    if (!users.length)
      return res.status(404).json({ message: "User not found" });
    return res.status(200).json(users[0]);
  });
};
