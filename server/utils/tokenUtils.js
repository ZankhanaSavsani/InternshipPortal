const jwt = require("jsonwebtoken");

const generateToken = (user, isRefreshToken = false) => {
  // Validate inputs
  if (!user || !user._id || !user.role) {
    throw new Error("Invalid user object provided for token generation");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const payload = {
    id: user._id.toString(), // Ensure _id is stringified (especially for MongoDB ObjectId)
    role: user.role,
    type: isRefreshToken ? 'refresh' : 'access'
  };

  const options = {
    expiresIn: isRefreshToken ? "7d" : "1d",
    algorithm: "HS256" // Explicit algorithm
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

module.exports = generateToken;