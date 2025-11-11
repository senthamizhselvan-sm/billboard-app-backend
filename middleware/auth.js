const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_secret_here";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log("Auth Header received:", authHeader);
  
  if (!authHeader) {
    console.log("❌ No authorization header provided");
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token extracted:", token ? `${token.substring(0, 20)}...` : "No token");
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("✅ Token verified successfully for user:", decoded.id);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("❌ Token verification failed:", err.message);
    return res.status(401).json({ message: "Invalid token", error: err.message });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };
