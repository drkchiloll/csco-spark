var config = require('./config');
var Promise = require('bluebird');
var spark = require('../lib/csco-spark')({
  uri: 'https://api.ciscospark.com/v1',
  token: config.token
});

var members = (roomId, mems) => (
  mems.map((mem) => {
    return {roomId: roomId, personEmail: mem}
  })
)

var addToRoom = (member) => (spark.addMemberToRoom(member));

var roomId;
spark.createRoom({
  title: 'Experiemental'
}).then((resp) => {
  console.log(resp.id);
  roomId = resp.id;
  return;
}).then(() => {
  var mems = members(roomId, ['cscospark@gmail.com', 'cscopsirt@outlook.com']);
  return Promise.all([
    addToRoom(mems[0]),
    addToRoom(mems[1])
  ])
}).then((results) => {
  console.log(results);
})
