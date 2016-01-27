var config = require('./config');
var spark = require('../lib/csco-spark')({
  uri: 'https://api.ciscospark.com/v1',
  token: config.token || 'your token here' //if you use your token rm cfg
});

var listMemberships = spark.listItemEvt({
  item: 'memberships',
  max: '15' // Default = 50
  // Only ONE of the Following Must have a Value
  roomId: 'your roomId here',
  personId: 'your spark personId',
  email: 'your email address'
});

listMemberships.on('memberships', function(members) {
  console.log(members);
});
