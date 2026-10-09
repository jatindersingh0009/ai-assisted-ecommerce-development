const { sendSuccess, sendError } = require('../utils/response');
const authService = require('../services/authService');
const { env } = require('../config/env');

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const existingUser = await authService.findUserByEmail(email);

    if (existingUser) {
      return sendError(res, 409, 'A user with this email already exists');
    }

    const user = await authService.createUser({
      firstName,
      lastName,
      email,
      password,
    });

    const token = authService.createToken(user);

    return sendSuccess(res, 201, 'Registration successful', {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.findUserByEmail(email);

    if (!user || user.status !== 'active') {
      return sendError(res, 401, 'Invalid email or password');
    }

    const isPasswordValid = await authService.comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const token = authService.createToken(user);

    return sendSuccess(res, 200, 'Login successful', {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions || {},
      },
      token,
    });
  } catch (error) {
    return next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'User profile retrieved', user);
  } catch (error) {
    return next(error);
  }
};

const updateCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.updateUserProfile(req.user.id, req.body);
    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'Profile updated successfully', user);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return sendError(res, 409, 'That email address is already in use');
    return next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const changed = await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    if (!changed) return sendError(res, 400, 'Current password is incorrect');
    return sendSuccess(res, 200, 'Password updated successfully');
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const reset = await authService.createPasswordReset(req.body.email);
    let resetToken;
    if (reset) {
      try {
        const delivered = await authService.sendPasswordResetEmail(reset);
        if (!delivered && env.nodeEnv !== 'production') resetToken = reset.token;
      } catch (mailError) {
        console.error('Password reset email delivery failed');
        if (env.nodeEnv !== 'production') resetToken = reset.token;
      }
    }
    return sendSuccess(res, 200, 'If the account exists, password reset instructions have been sent',
      resetToken ? { resetToken } : null);
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const reset = await authService.resetPassword(req.body.token, req.body.password);
    if (!reset) return sendError(res, 400, 'Reset link is invalid or expired');
    return sendSuccess(res, 200, 'Password reset successfully');
  } catch (error) {
    return next(error);
  }
};

const logout = (req, res) => {
  return sendSuccess(res, 200, 'Logout successful');
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  updateCurrentUser,
  updatePassword,
  forgotPassword,
  resetPassword,
};
