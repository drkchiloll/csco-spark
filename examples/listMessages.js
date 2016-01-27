var config = require('./config');
var spark = require('../lib/csco-spark')({
  uri: 'https://api.ciscospark.com/v1',
  token: config.token || 'your token here' //if you use your token rm cfg
});

// Getting Messages from a Room
var listMsges = spark.listItemEvt({
  item: 'messages',
  roomId: 'spark roomId you are a member of',
  max: '15' // If you leave blank Default = 50
});
// Using ES2015 Arrow Function with Implied Return Statement
listMsges.on('messages', (msges) => console.log(msges));
