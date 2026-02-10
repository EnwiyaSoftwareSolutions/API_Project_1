const express = require("express");
const sdk = require("node-appwrite");
const appwriteClient = require("../config/app");
const Router = express.Router();
const knex = require("../db/knex");
const hasher = require("../middleware/hasher");
// const auth = new sdk.Auth(appwriteClient);

const databases = new sdk.Databases(appwriteClient);

Router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_USER_COLLECTION_ID;
  if (!databaseId || !collectionId) {
    return res
      .status(500)
      .json({ error: "Appwrite database or collection not configured" });
  }
  try {
    const users = await knex("users").select("*");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

Router.post("/register", async (req, res) => {
  const { username, email, password, firstName, lastName, role } = req.body;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_USER_COLLECTION_ID;
  if (!databaseId || !collectionId) {
    return res
      .status(500)
      .json({ error: "Appwrite database or collection not configured" });
  }
  try {
    // Hash the password before saving
    const hashedPassword = await hasher.hash(password);
    const document = await databases.createDocument(
      databaseId,
      collectionId,
      sdk.ID.unique(),
      { username, email, password: hashedPassword, firstName, lastName, role },
    );
    res.status(201).json({ id: document.$id, username: document.username, email: document.email });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ error: "Failed to create user" });
  }
});

module.exports = Router;
