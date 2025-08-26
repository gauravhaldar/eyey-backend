import jwt from "jsonwebtoken";

export const adminAuth = (req, res, next) => {
  const token = req.cookies.adminToken;

  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // store decoded admin info in request
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};
