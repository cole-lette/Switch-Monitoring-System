const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "f5836cd1fe850de341f48f635d115daed1d89f5982a449dcb01bff686e9ffd0d0e79c2bf4d6a1ac923d6c108fbd7660e65e4a2281c081b688ab2179eb150fda7";
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Auth header:", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No token or wrong header");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  const token = authHeader.split(" ")[1];
  console.log("Token received:", token);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded JWT:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("JWT verification failed:", err.message);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = authenticateJWT;
