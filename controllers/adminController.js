import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

// Generate JWT token
const generateToken = () => {
  return jwt.sign({ email: ADMIN_EMAIL, id: "admin_user_id" }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Admin login
export const adminLogin = (req, res) => {
  const { email, password } = req.body;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (email.trim() === ADMIN_EMAIL.trim() && password.trim() === ADMIN_PASSWORD.trim()) {
    const token = jwt.sign({ email: ADMIN_EMAIL, id: "admin_user_id" }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.cookie("adminToken", token, {
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
  secure: true,        // ✅ Set to true for SameSite=None, and works on localhost
  sameSite: "none",    // ✅ Required for cross-site cookies with secure:true
});


    return res.status(200).json({ message: "Admin logged in successfully" });
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
};


// Get current admin
export const getCurrentAdmin = (req, res) => {
  const token = req.cookies.adminToken;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ email: decoded.email });
  } catch (error) {
    console.error("JWT verification error in getCurrentAdmin:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Admin logout
export const adminLogout = (req, res) => {
  res.cookie("adminToken", "", {
  httpOnly: true,
  expires: new Date(0),
  secure: true,       // ✅ Same as above
  sameSite: "none",   // ✅ Same as above
});

  return res.status(200).json({ message: "Admin logged out successfully" });
};

//get all users info
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "name email"); // Only select name and email
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
