const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const appwriteClient = require("./config/app");
const app = express();
const emailRouter = require('./router/emailer');
const userRouter = require("./router/users");
const clientReviewRouter = require("./router/client_review");

const PORT = process.env.PORT || 9000;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(emailRouter);
app.use(clientReviewRouter);
app.use(userRouter)

app.listen(PORT, (err) => {
  if (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
  console.log(`Server is running on port ${PORT}`);
});
