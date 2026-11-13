const express = require("express");
const blogPostRouter = require("./blog_post.Router");
const blogAuthorRouter = require("./blog_author.router");

const Router = express.Router();
Router.use(blogPostRouter);
Router.use(blogAuthorRouter);

module.exports = Router;