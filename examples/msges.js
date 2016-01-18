var config = require('./config');
var spark = require('../index')({
  uri: 'https://api.ciscospark.com/v1',
  token: config.token
});

// Get All the Messages from my Room
spark.getMessages({
  roomId: config.roomId
}).then((msges) => {
  // MSGES is already PARSED
  console.log(msges);
  // msges.forEach((msg) => spark.deleteMessage(msg.id));
});
