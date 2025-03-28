const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");
const Admin = require("../models/AdminModel");
const Guide = require("../models/GuideModel");
const Student = require("../models/StudentModel");
const TokenBlacklist = require("../models/TokenBlacklist");

/** Extract token from header or cookies */
const extractToken = (req) => {
  return req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
};

/** Check if token is blacklisted */
const isTokenBlacklisted = async (token) => {
  const blacklisted = await TokenBlacklist.findOne({ token });
  return !!blacklisted; // Returns true if the token is blacklisted
};

/** Validate JWT token */
const validateToken = async (req, res, next) => {
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  try {
    // Optional: Check if token is blacklisted (for logout security)
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ success: false, message: "Token revoked" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error("[TOKEN ERROR]", { error: error.message });

    return res.status(401).json({ 
      success: false, 
      message: error.name === "TokenExpiredError" 
        ? "Token expired" 
        : "Invalid token" 
    });
  }
};

/** Role-based access middleware */
const checkRoleAccess = (allowedRoles) => {
  return async (req, res, next) => {
    await validateToken(req, res, async () => {
      try {
        let user = null;
        if (req.user.role === "admin") {
          user = await Admin.findById(req.user.id, { isDeleted: false });        
        } else if (req.user.role === "guide") {
          user = await Guide.findById(req.user.id, { isDeleted: false });
        } else if (req.user.role === "student") {
          user = await Student.findById(req.user.id, { isDeleted: false });
        }

        if (!user || !allowedRoles.includes(req.user.role)) {
          return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
        }

        req.user = user; // Attach user details
        next();
      } catch (error) {
        logger.error("[AUTH ERROR]", { error: error.message });
        return res.status(500).json({ success: false, message: "Internal Server Error" });
      }
    });
  };
};

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: "Too many login attempts. Please try again later." }
});

// Rate limiter for refresh token attempts
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { message: "Too many refresh attempts. Please try again later." }
});


module.exports = {
  loginLimiter,
  refreshLimiter,
  validateToken,
  checkRoleAccess,
};