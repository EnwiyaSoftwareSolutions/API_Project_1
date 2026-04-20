const express = require("express");
const sdk = require("node-appwrite")
const appwriteClient = require('../config/app')
const Router = express.Router();

const database = new sdk.Databases(appwriteClient);

//fetch single office info by id
// Router.get("/fetch-office-info/:_id", async (req, res) => {
//     const { _id } = req.params;
//     if (!_id) {
//         return res.status(400).json({ error: "Office ID is required" });
//     }
//     try {
//         const response = await database.getDocument("office_info", _id);
//         res.status(200).json(response);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// })
//get all office info
Router.get("/fetch-office-info", async (req, res) => {
    try {
          const databaseId = process.env.APPWRITE_DATABASE_ID;
    const collectionId = process.env.APPWRITE_OFFICE_INFO_COLLECTION_ID;
        const response = await database.listDocuments(databaseId, collectionId);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

module.exports = Router;