const express = require("express");
const sdk = require('node-appwrite');
const appwriteClient = require('../config/app');
const Router = express.Router();

const database = new sdk.Databases(appwriteClient);
const databaseID = process.env.APPWRITE_DATABASE_ID;
const collectionID = process.env.APPWRITE_USER_REGISTER;

// Register a new user
Router.post("/client_register", async (req, res) => {
    if (!databaseID || !collectionID) {
        return res.status(500).json({ error: "Appwrite database or collection not configured" });
    }

    const review = req.body;
    if (!review.user_email) {
        return res.status(400).json({ error: "Missing user email" });
    }

    try {
        const response = await database.createDocument(databaseID, collectionID, sdk.ID.unique(), {
            full_name: review.full_name,
            user_email: review.user_email,
            user_phonenumber: review.user_phonenumber,
            is_client: review.is_client,
            is_active: review.is_active
        });
        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
Router.get("/fetch_users", async (req, res) => {
    if (!databaseID || !collectionID) {
        return res.status(500).json({ error: "Appwrite database or collection not configured" });
    }

    try {
        const response = await database.listDocuments(databaseID, collectionID);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = Router;
