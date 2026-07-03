const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const appwriteClient = require("./config/app");
const app = express();
const emailRouter = require('./router/emailer');
const userRouter = require("./router/users");
const clientReviewRouter = require("./router/client_review");
const officeInfoRouter = require("./router/office_info")
const userRegisterRouter = require("./router/user_register")

const PORT = process.env.PORT || 9000;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', emailRouter);
app.use('/api', clientReviewRouter);
app.use('/api', userRegisterRouter);
app.use('/api', userRouter);
app.use('/api', officeInfoRouter);

app.get('/', (req, res) => {
  res.status(200).json({ ok: true, service: 'API_Project_1' });
});

if (require.main === module) {
  app.listen(PORT, (err) => {
    if (err) {
      console.error("Failed to start server:", err.message);
      process.exit(1);
    }
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
