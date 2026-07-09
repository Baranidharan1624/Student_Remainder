const User = require("../models/User");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password, whatsappNumber } = req.body;

    if (!name || !email || !password || !whatsappNumber) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    // Basic E.164 format validation for WhatsApp number
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanWhatsappNumber = whatsappNumber.replace(/\s+/g, "");
    if (!phoneRegex.test(cleanWhatsappNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid WhatsApp number format. Must include country code (e.g., +919876543210).",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        { whatsappNumber: cleanWhatsappNumber }
      ]
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
      return res.status(400).json({
        success: false,
        message: "WhatsApp number already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      whatsappNumber: cleanWhatsappNumber,
    });

    res.status(201).json({
      success: true,
      message: "Registration Successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        whatsappNumber: user.whatsappNumber,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log("DEBUG - Login Email:", normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });
    console.log("DEBUG - User Found:", user ? { id: user._id, email: user.email } : null);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const tokenPayload = { id: user._id.toString() };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });
    console.log("DEBUG - JWT Payload:", tokenPayload);
    console.log("DEBUG - Token:", token);

    res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        whatsappNumber: user.whatsappNumber,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// Get Profile
exports.getProfile = async (req, res) => {
  try {
    console.log("DEBUG - Profile req.user:", { id: req.user._id, email: req.user.email });
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    console.log("DEBUG - Change Password req.user._id:", req.user._id);

    const user = await User.findById(req.user._id);

    console.log("DEBUG - Change Password User Found:", user ? { id: user._id, email: user.email } : null);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    console.log("DEBUG - Password Updated for user:", user._id);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, whatsappNumber, preferredReminderMethod, avatar } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check email if changed
    if (email && email.trim().toLowerCase() !== user.email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email",
        });
      }
      const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another account",
        });
      }
      user.email = email.trim().toLowerCase();
    }

    if (whatsappNumber && whatsappNumber.replace(/\s+/g, "") !== user.whatsappNumber) {
      const cleanNumber = whatsappNumber.replace(/\s+/g, "");
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(cleanNumber)) {
        return res.status(400).json({
          success: false,
          message: "Invalid WhatsApp number format.",
        });
      }
      
      const existingUser = await User.findOne({ whatsappNumber: cleanNumber });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "WhatsApp number is already in use by another account",
        });
      }
      
      user.whatsappNumber = cleanNumber;
    }

    // Validate notification settings
    const validPreferences = ["Email", "WhatsApp", "Both"];
    if (preferredReminderMethod) {
      if (!validPreferences.includes(preferredReminderMethod)) {
        return res.status(400).json({
          success: false,
          message: "Invalid preferred reminder method",
        });
      }

      if (preferredReminderMethod === "WhatsApp" || preferredReminderMethod === "Both") {
        if (!user.whatsappNumber) {
          return res.status(400).json({
            success: false,
            message: "WhatsApp number is required when WhatsApp notifications are enabled",
          });
        }
      }
      
      user.preferredReminderMethod = preferredReminderMethod;
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    user.name = name.trim();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        whatsappNumber: user.whatsappNumber,
        preferredReminderMethod: user.preferredReminderMethod,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Delete Account
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete all reminders belonging to this user
    const Reminder = require("../models/Reminder");
    await Reminder.deleteMany({ user: req.user._id });

    // Delete the user
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
