const jwt = require("jsonwebtoken");
// const User = require("../module/userModule");
// const Unotes = require('../modules/PatientNotes')
//this code block taked in the users username and password and hases it to unreadable format called token for sacurity
//  then the token and be time sensitive where we can have the code automaticly log out if there is not activity in a certain time.
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.AUTH_TOKEN_NUM);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error();
    }
    req.token = token;
    req.user = user;

    next();
  } catch (err) {
    res.status(401).send({ err: `Please Authenticate` });
  }
};
module.exports = auth;
