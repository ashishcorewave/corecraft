
const jwt = require("jsonwebtoken");
const Tokens = {
  // Get access token
  get: async function (user_id, isAdmin = false) {
    console.log("Hello token");
    return new Promise(resolve => {
      if (!process.env.JWT_SECRET) {
        return resolve({
          status: 0,
          message: "JWT Secret key is missing!",
          access_token: null
        });
      }

      const payload = { user_id, isAdmin };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "20d"
      });

      resolve({
        status: 1,
        message: "Authentication successful",
        accessToken: token
      });
    });
  }
};

module.exports = Tokens;


// var jwt = require('jsonwebtoken');
// var config = require('config');
// const Tokens = {
//   // Get access token
//   get: async function (user_id, isAdmin = false) {

//     return new Promise(async resolve => {
//       var secretKey = config.get('jwt')
//       var payload = {
//         user_id: user_id,
//         isAdmin: isAdmin
//       }
//       var token = jwt.sign(payload, secretKey.secret, {
//                   expiresIn: "20d" 
//                 });
//       var result = {
//         status: 1,
//         message: 'Authentication done ',
//         access_token: token,
//       }
//       resolve(result);
//     })
//   }

// }

// module.exports = Tokens;