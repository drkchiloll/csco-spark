var config = require('./config');
var spark = require('../lib/csco-spark')({
  uri: 'https://api.ciscospark.com/v1',
  token: config.token || 'your token here' //if you use your token rm cfg
});

// Getting Spark Rooms
var listRooms = spark.listItemEvt({
  item: 'webhooks',
  max: '15' // If property is excluded Default = 50
});
// Listen for Rooms
listRooms.on('webhooks', function(webhooks) {
  console.log(webhooks)
});
