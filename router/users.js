const express = require("express");
const sdk = require("node-appwrite");
const appwriteClient = require("../config/app");
const Router = express.Router();
const hasher = require("../middleware/hasher");
const { generateToken } = require("../utils/jwt");

const databases = new sdk.Databases(appwriteClient);

Router.post("/login", async (req, res) => {
  const { username, email, password } = req.body || {};
  const identityField = username ? "username" : "email";
  const identifier =
    typeof (username || email) === "string"
      ? (username || email).trim()
      : "";
  const normalizedIdentifier =
    identityField === "email" ? identifier.toLowerCase() : identifier;
  if (
    !normalizedIdentifier ||
    typeof password !== "string" ||
    !password ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      error: "Username or email and password are required (maximum password size: 72 UTF-8 bytes)",
    });
  }

  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_USER_COLLECTION_ID;
  const secret = process.env.AUTH_TOKEN_NUM;
  if (!databaseId || !collectionId) {
    return res
      .status(500)
      .json({ error: "Appwrite database or collection not configured" });
  }
  if (!secret) {
    return res.status(500).json({ error: "Authentication is not configured" });
  }

  try {
    const result = await databases.listDocuments(databaseId, collectionId, [
      sdk.Query.equal(identityField, normalizedIdentifier),
      sdk.Query.limit(1),
    ]);
    const user = result.documents[0];
    if (
      !user ||
      user.is_active === false ||
      !(await hasher.check(user.password, password))
    ) {
      return res.status(401).json({ error: "Invalid username/email or password" });
    }

    const publicUser = {
      id: user.$id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
    };
    const token = generateToken(
      {
        sub: publicUser.id,
        username: publicUser.username,
        role: publicUser.role,
      },
      secret,
      { expiresIn: process.env.AUTH_TOKEN_EXPIRY || "1h" },
    );

    return res.status(200).json({ user: publicUser, token, token_type: "Bearer" });
  } catch (error) {
    console.error("Error logging in:", error.message);
    return res.status(500).json({ error: "Failed to log in" });
  }
});

Router.post("/register", async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body || {};
  if (
    typeof username !== "string" ||
    username.trim().length < 3 ||
    username.trim().length > 64 ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== "string" ||
    Buffer.byteLength(password, "utf8") < 8 ||
    Buffer.byteLength(password, "utf8") > 72 ||
    typeof firstName !== "string" ||
    !firstName.trim() ||
    typeof lastName !== "string" ||
    !lastName.trim()
  ) {
    return res.status(400).json({
      error:
        "A username, valid email, password of 8-72 UTF-8 bytes, first name, and last name are required",
    });
  }

  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_USER_COLLECTION_ID;
  if (!databaseId || !collectionId) {
    return res
      .status(500)
      .json({ error: "Appwrite database or collection not configured" });
  }

  try {
    const hashedPassword = await hasher.hash(password);
    const document = await databases.createDocument(
      databaseId,
      collectionId,
      sdk.ID.unique(),
      {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: "user",
      },
    );
    return res.status(201).json({
      id: document.$id,
      username: document.username,
      email: document.email,
      role: document.role,
    });
  } catch (error) {
    console.error("Error creating user:", error.message);
    if (error.code === 409) {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    return res.status(500).json({ error: "Failed to create user" });
  }
});

module.exports = Router;
