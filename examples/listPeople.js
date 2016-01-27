var config = require('./config');
var spark = require('../lib/csco-spark')({
  uri: 'https://api.ciscospark.com/v1',
  token: config.token || 'your token here' //if you use your token rm cfg
});

// Getting People
var listPeople = spark.listItemEvt({
  item: 'people',
  max: '15' || undefined, // Default = 50
  // Only ONE of the Following 3 Have to have a Value
  email: 'email',
  displayName: 'displayName',
  personId: 'spark id'
});

listPeople.on('people', (peeps) => {
  console.log(peeps);
});
