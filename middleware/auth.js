const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const secret = process.env.AUTH_TOKEN_NUM;
  if (!secret) {
    return res.status(500).json({ error: "Authentication is not configured" });
  }

  const authorization = req.get("Authorization");
  const match = authorization && authorization.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    return res.status(401).json({ error: "Please authenticate" });
  }

  try {
    const decoded = jwt.verify(match[1], secret);
    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      typeof decoded.username !== "string" ||
      typeof decoded.role !== "string"
    ) {
      return res.status(401).json({ error: "Please authenticate" });
    }

    req.token = match[1];
    req.user = {
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Please authenticate" });
  }
};

auth.requireRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Please authenticate" });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  return next();
};

module.exports = auth;
