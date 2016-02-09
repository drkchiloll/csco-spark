var config = require('./config'),
    SparkFactory = require('../index');

var spark = SparkFactory({
  uri: 'https://api.ciscospark.com/v1',
  token: config.token
});

spark.addWebhook({
  name: 'pubHooks',
  hookUrl: 'http://45.55.244.195:8181/hooker',
  roomId: config.expRoomId
}).then(function(resp) {
  // Do Not have to Perform JSON.parse()
  console.log(resp.id);
})

// spark.deleteWebhook('Y2lzY29zcGFyazovL3VzL1dFQkhPT0svNTRkZmVjMzgtMmVlYy00ZDU4LWIyNjEtNzk2MTY2ZDlmY2Fm').then((resp) => {
//   console.log(resp); // Expect Null
// })
