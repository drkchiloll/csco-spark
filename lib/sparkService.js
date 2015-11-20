var config = require('../config');
var spark = require('./csco-spark');
var roomId = '47b530be-6990-3336-8cdd-22c93beb11cd';
var token = config.token;

// spark.sendMessage({
//   token: token,
//   method: 'POST',
//   path: 'messages',
//   body : { roomId: roomId, text: 'A Simple Message' }
// }).then(function(data) {
//   console.log(data);
// });

spark.addUserToRoom({
  token: token,
  method: 'POST',
  path: 'memberships',
  body : {
    roomId: roomId,
    personEmail: 'samuel.womack1@gmail.com',
    isModerator: false
  }
}).then(function(data) {
  console.log(data);
});
