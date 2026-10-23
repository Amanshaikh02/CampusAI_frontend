const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware (authMiddleware / protect)
 * 
 * 1. Reads 'Authorization: Bearer <token>' header
 * 2. Verifies JWT signature using JWT_SECRET
 * 3. Handles expired, malformed, or missing tokens -> HTTP 401
 * 4. Fetches authenticated user from DB and attaches to req.user (do NOT trust frontend)
 */
const authMiddleware = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Reject missing token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No token provided.'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'campus_ai_super_secret_jwt_key_2026';
    const decoded = jwt.verify(token, secret);

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload: missing user ID.'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with this token no longer exists.'
      });
    }

    // Verify that the user has an active, non-revoked session in MongoDB
    const Session = require('../models/Session');
    let sessionQuery = {
      userId: user._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    };
    if (decoded.sessionId) {
      sessionQuery._id = decoded.sessionId;
    }

    const activeSession = await Session.findOne(sessionQuery);

    if (!activeSession) {
      return res.status(401).json({
        success: false,
        message: 'Session has been revoked or expired. Please log in again.'
      });
    }

    // Attach authenticated user and session information to request
    req.user = user;
    req.user.userId = user._id.toString();
    req.session = activeSession;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Token has expired. Please log in again.'
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Malformed or invalid token.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized. Token verification failed.'
    });
  }
};

/**
 * Role Authorization Middleware (requireRole / authorize)
 * 
 * Enforces role-based access control.
 * Example: requireRole('admin'), requireRole('faculty', 'admin'), requireRole('student')
 */
const requireRole = (...roles) => {
  const allowed = roles.map((r) => r.toLowerCase());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in first.'
      });
    }

    const currentRole = req.user.role.toLowerCase();

    // Map 'faculty' <-> 'teacher' for flexible configuration
    const isAllowed = allowed.some((role) => {
      if (role === currentRole) return true;
      if (
        (role === 'faculty' && currentRole === 'teacher') ||
        (role === 'teacher' && currentRole === 'faculty')
      ) {
        return true;
      }
      return false;
    });

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  protect: authMiddleware, // Alias for backward compatibility
  requireRole,
  authorize: requireRole // Alias for backward compatibility
};
