/**
 * SETTINGS CONTROLLER
 * Handles profile update, password change, delete saved routes, delete account
 * All routes are protected by verifyToken middleware — req.user.id is always set
 */

import User from '../models/User.js';
import SavedRoute from '../models/SavedRoute.js';
import bcrypt from 'bcryptjs';

// ── GET PROFILE ────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user: user.getPublicProfile() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
};

// ── UPDATE PROFILE (name, email, phone) ────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // check if new email is taken by another user
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...(name && { name }), ...(email && { email }), ...(phone !== undefined && { phone }) },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ success: true, user: user.getPublicProfile() });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages[0] });
    }
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

// ── CHANGE PASSWORD ────────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // fetch user WITH password (password field has select: false in schema)
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword; // pre-save hook hashes it
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password', error: err.message });
  }
};

// ── UPDATE PREFERENCES (optimizationMode) ────────────────────────────────
export const updatePreferences = async (req, res) => {
  try {
    const { optimizationMode } = req.body;
    if (!optimizationMode) return res.status(400).json({ message: 'No optimization mode provided' });

    const validModes = ['fastest', 'cheapest', 'less_walking', 'fewest_transfers'];
    if (!validModes.includes(optimizationMode)) {
      return res.status(400).json({ message: 'Invalid optimization mode' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { 'preferences.optimizationMode': optimizationMode } },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ success: true, user: user.getPublicProfile() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update preferences', error: err.message });
  }
};

// ── CLEAR ALL SAVED ROUTES ─────────────────────────────────────────────────
export const clearSavedRoutes = async (req, res) => {
  try {
    const result = await SavedRoute.deleteMany({ userId: req.user.id });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear saved routes', error: err.message });
  }
};

// ── DELETE ACCOUNT ─────────────────────────────────────────────────────────
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required to delete account' });

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });

    // delete all user data then the account
    await SavedRoute.deleteMany({ userId: req.user.id });
    await User.findByIdAndDelete(req.user.id);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete account', error: err.message });
  }
};

// ── UPDATE LANGUAGE ───────────────────────────────────────────────────────
export const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    if (!['en', 'ar'].includes(language)) {
      return res.status(400).json({ message: 'Invalid language' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { 'preferences.language': language } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user: user.getPublicProfile() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update language', error: err.message });
  }
};