var config = require('./config');
var Promise = require('bluebird');
var spark = require('../lib/csco-spark')({
  uri: 'https://api.ciscospark.com/v1',
  token: config.token
});

spark.getRoom(config.expRoomId).then((resp) => {
  // console.log(resp);
  spark.getRoomMembers(config.expRoomId).then((resp) => {
    console.log(resp);
  })
});
