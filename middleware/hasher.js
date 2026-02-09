let bcrypt = require("bcrypt");
const saltRounds = 10;

module.exports = {
  hash: function (user) {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(saltRounds, function (err, salt) {
        if (err) return reject(err);

        bcrypt.hash(user.password, salt, function (err, hash) {
          if (err) {
            reject(err);
          } else {
            user.password = hash;
            resolve(user);
          }
        });
      });
    });
  },
  check: function (encryptedUser, user) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(
        user.password,
        encryptedUser.password,
        function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        },
      );
    });
  },
};
