const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const generateToken = require('../utils/tokenUtils');
const { redactSensitiveData } = require('../utils/security');
const TokenBlacklist = require('../models/TokenBlacklist');
const Admin = require('../models/AdminModel');
const Guide = require('../models/GuideModel');
const Student = require('../models/StudentModel');
const { loginLimiter, refreshLimiter } = require('../middleware/authMiddleware');


const ROLE_MODEL_MAP = {
  admin: Admin,
  guide: Guide,
  student: Student
};

/**
 * Helper function to generate secure cookie options
 * @param {number} maxAge - Cookie max age in milliseconds
 * @returns {Object} Cookie configuration object
 */
const createCookieOptions = (maxAge) => {
  // Validate domain configuration
  if (!process.env.COOKIE_DOMAIN) {
    logger.warn('[COOKIE CONFIG] No domain configured for cookies');
  }

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    domain: process.env.COOKIE_DOMAIN || undefined
  };
};

/**
 * Helper function to check if a token is blacklisted
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} True if token is blacklisted
 */
const isTokenBlacklisted = async (token) => {
  const blacklistedToken = await TokenBlacklist.findOne({ token: token });
  return !!blacklistedToken;
};

/**
 * Helper function to set authentication cookies
 * @param {Response} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  const ACCESS_TOKEN_AGE = 24 * 60 * 60 * 1000; // 1 day
  const REFRESH_TOKEN_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  const cookieOptions = createCookieOptions(ACCESS_TOKEN_AGE);
  const refreshCookieOptions = createCookieOptions(REFRESH_TOKEN_AGE);

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  if (process.env.NODE_ENV !== 'production') {
    logger.debug('[COOKIES SET]', {
      accessTokenExpiry: new Date(Date.now() + ACCESS_TOKEN_AGE),
      refreshTokenExpiry: new Date(Date.now() + REFRESH_TOKEN_AGE),
      cookieConfig: redactSensitiveData({ ...cookieOptions }, ['domain'])
    });
  }
};

/**
 * Helper function to set role-specific cookies
 * @param {Response} res - Express response object
 * @param {Object} user - User object
 * @param {string} role - User role
 */
const setRoleSpecificCookies = (res, user, role) => {
  const roleHandlers = {
    student: (user, options) => {
      if (user._id && user.studentName) {
        res.cookie("userId", user._id, options); // Set userId cookie
        res.cookie("studentName", user.studentName, options);
        logger.debug('[STUDENT COOKIES SET]', {
          hasUserId: !!user._id,
          hasStudentName: !!user.studentName
        });
      }
    }
    // Add other role handlers here as needed
  };

  const handler = roleHandlers[role.toLowerCase()];
  if (handler) {
    handler(user, createCookieOptions(24 * 60 * 60 * 1000));
  }
};

/**
 * @desc    Login User
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = [
  loginLimiter,
  async (req, res) => {
    const startTime = process.env.NODE_ENV !== 'production' ? Date.now() : null;
    try {
      const { role, username, password, studentId, semester } = req.body;

      // Input validation with detailed logging
      if (!role || !password || (!username && !studentId) || (role === 'student' && !semester)) {
        const missingFields = ['role', 'password'];
        if (!username && role !== 'student') missingFields.push('username');
        if (!studentId && role === 'student') missingFields.push('studentId');
        if (role === 'student' && !semester) missingFields.push('semester');

        logger.warn('[LOGIN ATTEMPT] Missing fields', { missingFields });
        return res.status(400).json({
          success: false,
          message: "All fields are required"
        });
      }

      // Role validation
      const UserModel = ROLE_MODEL_MAP[role.toLowerCase()];
      if (!UserModel) {
        logger.warn('[LOGIN ATTEMPT] Invalid role', {
          attemptedRole: role,
          validRoles: Object.keys(ROLE_MODEL_MAP)
        });
        return res.status(400).json({
          success: false,
          message: "Invalid role selected"
        });
      }

      // Determine the login identifier based on role
      const loginIdentifier = role.toLowerCase() === 'student' ? { studentId, semester } : { username };

      // User authentication
      const user = await UserModel.findOne(loginIdentifier)
        .select('+password')
        .exec();

      if (!user || !(await user.comparePassword(password))) {
        logger.warn('[LOGIN FAILED]', {
          [role.toLowerCase() === 'student' ? 'studentId' : 'username']: role.toLowerCase() === 'student' ? studentId : username,
          role,
          semester: role.toLowerCase() === 'student' ? semester : undefined,
          reason: !user ? 'User not found' : 'Invalid password'
        });
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }

      // Token generation
      const accessToken = generateToken(user);
      const refreshToken = generateToken(user, true);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Set cookies
      setAuthCookies(res, accessToken, refreshToken);
      setRoleSpecificCookies(res, user, role);

      // Log success (with performance metrics in non-production)
      const logData = {
        userId: user._id,
        role,
        loginTime: new Date()
      };

      if (role.toLowerCase() === 'student') {
        logData.studentId = user.studentId;
        logData.semester = user.semester;
      } else {
        logData.username = user.username;
      }

      if (startTime) {
        logData.processDuration = Date.now() - startTime;
      }

      logger.info('[LOGIN SUCCESS]', logData);

      return res.json({
        success: true,
        message: "Login successful",
        user: {
          id: user._id, // Include _id in the response
          role: user.role,
          [role.toLowerCase() === 'student' ? 'studentId' : 'username']: role.toLowerCase() === 'student' ? user.studentId : user.username,
          semester: role.toLowerCase() === 'student' ? user.semester : undefined,
          lastLogin: user.lastLogin
        },
        tokens: {
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      const errorLog = {
        error: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        requestBody: redactSensitiveData({ ...req.body }, ['password'])
      };

      if (startTime) {
        errorLog.processDuration = Date.now() - startTime;
      }

      logger.error('[LOGIN ERROR]', errorLog);

      return res.status(500).json({
        success: false,
        message: "An error occurred during login"
      });
    }
  }
];

/**
 * @desc    Refresh Access Token
 * @route   POST /api/auth/refresh-token
 * @access  Private
 */
exports.refreshToken = [
  refreshLimiter,
  async (req, res) => {
    const startTime = process.env.NODE_ENV !== 'production' ? Date.now() : null;
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        logger.warn('[REFRESH TOKEN] Missing token', {
          availableCookies: Object.keys(req.cookies)
        });
        return res.status(401).json({
          success: false,
          message: "Refresh token is required"
        });
      }

      // Check if token is blacklisted
      if (await isTokenBlacklisted(refreshToken)) {
        logger.warn('[REFRESH TOKEN] Attempted use of blacklisted token');
        return res.status(401).json({
          success: false,
          message: "Token has been revoked"
        });
      }

      // Verify token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      // Validate token type
      if (decoded.type !== "refresh") {
        logger.warn('[REFRESH TOKEN] Invalid token type', {
          expectedType: 'refresh',
          receivedType: decoded.type
        });
        return res.status(403).json({
          success: false,
          message: "Invalid token type"
        });
      }

      // Check token expiration
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        logger.warn('[REFRESH TOKEN] Expired token', {
          expiry: new Date(decoded.exp * 1000),
          currentTime: new Date()
        });
        return res.status(401).json({
          success: false,
          message: "Refresh token has expired"
        });
      }

      // Find and validate user
      const UserModel = ROLE_MODEL_MAP[decoded.role];
      const user = await UserModel.findById(decoded.id);

      if (!user) {
        logger.warn('[REFRESH TOKEN] User not found', {
          userId: decoded.id,
          role: decoded.role
        });
        return res.status(401).json({
          success: false,
          message: "User not found"
        });
      }

      // Generate new access token
      const newAccessToken = generateToken(user);

      // Set new access token cookie
      res.cookie("accessToken", newAccessToken, createCookieOptions(24 * 60 * 60 * 1000));

      // Log success (with performance metrics in non-production)
      const logData = {
        userId: user._id,
        username: user.username,
        role: user.role
      };

      if (startTime) {
        logData.processDuration = Date.now() - startTime;
      }

      logger.info('[TOKEN REFRESHED]', logData);

      return res.json({
        success: true,
        message: "Token refreshed successfully"
      });

    } catch (error) {
      const errorLog = {
        error: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        cookies: {
          hasRefreshToken: !!req.cookies.refreshToken,
          hasAccessToken: !!req.cookies.accessToken
        }
      };

      if (startTime) {
        errorLog.processDuration = Date.now() - startTime;
      }

      logger.error('[REFRESH TOKEN ERROR]', errorLog);
      
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }
  }
];

/**
 * @desc    Logout User
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    // If there's a refresh token, blacklist it
    if (refreshToken) {
      await TokenBlacklist.create({
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Match refresh token expiry
      });
    }

    // Clear all cookies
    const cookieOptions = createCookieOptions(0);
    res.cookie('accessToken', '', { ...cookieOptions, maxAge: 0 });
    res.cookie('refreshToken', '', { ...cookieOptions, maxAge: 0 });
    res.cookie('studentId', '', { ...cookieOptions, maxAge: 0 });
    res.cookie('studentName', '', { ...cookieOptions, maxAge: 0 });

    logger.info('[LOGOUT SUCCESS]', {
      tokenBlacklisted: !!refreshToken
    });

    return res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    logger.error('[LOGOUT ERROR]', {
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });

    return res.status(500).json({
      success: false,
      message: "An error occurred during logout"
    });
  }
};

// Backend: Fetch user by _id
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user by _id
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "An error occurred while fetching user data" });
  }
};

/**
 * @desc    Get current authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from the authentication middleware
    const role = req.user.role.toLowerCase(); // Extract role from token payload

    // Ensure a valid role is provided
    const UserModel = ROLE_MODEL_MAP[role];
    if (!UserModel) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role"
      });
    }

    // Fetch user details (excluding password)
    const user = await UserModel.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.json({
      success: true,
      user
    });

  } catch (error) {
    logger.error('[GET ME ERROR]', { error: error.message });
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching user details"
    });
  }
};
