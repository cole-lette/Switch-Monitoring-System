const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "f373bbea06dace245c7c364e7fa77403ad3794e08cf042154dd33313a6caf63fca5ab27c0daa32e071af259f3f482a0e3280ea5be8f7f8c0a2bc05cd5519cd0b";

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  //console.log("Auth header:", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No token or wrong header");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  const token = authHeader.split(" ")[1];
  //console.log("Token received:", token);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    //console.log("Decoded JWT:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("JWT verification failed:", err.message);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};


module.exports = authenticateJWT;