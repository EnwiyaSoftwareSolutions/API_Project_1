const express = require("express");
const sdk = require("node-appwrite");
const appwriteClient = require("../config/app");
const Router = express.Router();
const knex = require("../db/knex");

const databases = new sdk.Databases(appwriteClient);

Router.get("fetch_achievements", async (req, res) => {
  try {
    const achievements = await knex("achievements").select("*");
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

Router.get("fetch_single_achievement/:id", async (req, res) => {
  try {
    const achievements = await knex("achievements").select("*");
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

Router.post("create_achievement", async (req, res) => {
  const achievements = req.body.achievements;
  if (!achievements) {
    return res
      .status(400)
      .json({ error: "Missing required field: achievements" });
  }
});
Router.patch("update_achievement/:id", async (req, res) => {
  const { id } = req.params;
  const achievements = req.body.achievements;
  if (!achievements) {
    return res
      .status(400)
      .json({ error: "Missing required field: achievements" });
  }
});

Router.delete("delete_achievement/:id", async (req, res) => {
  const { id } = req.params;
  try {
    result = await knex("achievements").where({ id }).del();
    if (result === 0) {
      return res.status(404).json({ error: "Achievement not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to delete achievement" });
  }
});
module.exports = Router;
