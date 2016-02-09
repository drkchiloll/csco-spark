var config = require('./config');
var spark = require('../index')({
  uri: 'https://api.ciscospark.com/v1',
  token: config.token
});

var getMsges = (id) => spark.getMessages({roomId: id});

// getMsges(config.roomId).then(function(data) {
//   console.log(data);
// })

spark.getRooms().then(function(data) {
  console.log(data);
})
