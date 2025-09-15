import jwt from "jsonwebtoken";

export const adminAuth = (req, res, next) => {
  console.log("Admin auth middleware called");
  console.log("Cookies:", req.cookies);
  const token = req.cookies.adminToken;

  if (!token) {
    console.log("No token found");
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified successfully:", decoded);
    req.admin = decoded; // store decoded admin info in request
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};
