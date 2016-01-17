var config = require('./config');
var spark = require('../csco-spark')({
  uri: 'https://api.ciscospark.com/v1',
  token: config.token
});

// Get All the Messages from my Room
spark.getMessages({
  roomId: config.roomId
}).then((msges) => {
  // MSGES is already PARSED
  msges.forEach((msg) => spark.deleteMessage(msg.id));
});
