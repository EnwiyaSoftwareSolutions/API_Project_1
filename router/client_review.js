const express = require("express");
const sdk = require("node-appwrite");
const appwriteClient = require("../config/app");
const Router = express.Router();
const knex = require("../db/knex");

const databases = new sdk.Databases(appwriteClient);

Router.get("/fetch_reviews", async (req, res) => {
  try {
    // const reviews = await knex("reviews").select("*");
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const collectionId = process.env.APPWRITE_REVIEW_COLLECTION_ID;

    if (!databaseId || !collectionId) {
      return res
        .status(500)
        .json({ error: "Appwrite database or collection not configured" });
    }

    const result = await databases.listDocuments(databaseId, collectionId);
    const reviews = result.documents;
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});
Router.get("/fetch_single_review/:id", async (req, res) => {
  try {
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const collectionId = process.env.APPWRITE_REVIEW_COLLECTION_ID;

    if (!databaseId || !collectionId) {
      return res
        .status(500)
        .json({ error: "Appwrite database or collection not configured" });
    }

    const reviewId = req.params.id;
    const result = await databases.getDocument(databaseId, collectionId, reviewId);
    res.json(result);
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

Router.post("/create_review/", async (req, res) => {
  const item = req.body;
  if (!item.reviewer_name) {
    return res
      .status(400)
      .json({ error: "Missing required field: reviewer_name" });
  }

  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_REVIEW_COLLECTION_ID;

  if (!databaseId || !collectionId) {
    return res
      .status(500)
      .json({ error: "Appwrite database or collection not configured" });
  }

  try {
    const document = await databases.createDocument(
      databaseId,
      collectionId,
      sdk.ID.unique(),
      { reviewer_name: item.reviewer_name, comment: item.comment, rating: item.rating },
    );

    res
      .status(201)
      .json({ id: document.$id, reviewer_name: document.reviewer_name });
  } catch (error) {
    console.error("Error creating review:", error.message);
    res.status(500).json({ error: "Failed to create review" });
  }
});

Router.patch("/update_review/:id", async (req, res) => {
  const reviewId = req.params.id;
  const reviewer_name = req.body.reviewer_name;
  if (!reviewer_name) {
    return res
      .status(400)
      .json({ error: "Missing required field: reviewer_name" });
  }
  try {
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const collectionId = process.env.APPWRITE_REVIEW_COLLECTION_ID;

    if (!databaseId || !collectionId) {
      return res
        .status(500)
        .json({ error: "Appwrite database or collection not configured" });
    }

    const updatedDocument = await databases.updateDocument(
      databaseId,
      collectionId,
      reviewId,
      { reviewer_name },
    );

    res.json({
      id: updatedDocument.$id,
      reviewer_name: updatedDocument.reviewer_name,
    });
  } catch (error) {
    console.error("Error updating review:", error.message);
    res.status(500).json({ error: "Failed to update review" });
  }
});

module.exports = Router;
