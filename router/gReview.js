const express = require("express");

const Router = express.Router();

Router.get("/get_g_review", (req, res) => {
  try {
    res.status(200).json({
      message: "Google review data fetched successfully.",
      data: { reviews: [], rating: 0 },
    });
  } catch (err) {
    res.status(500).json({
      message: "An error occurred while fetching Google review data.",
      error: err.message,
    });
  }
});

module.exports = Router;
