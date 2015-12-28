var config = require('../config');
var Promise = require('bluebird');
var spark = require('../csco-spark')({
  uri: 'https://api.ciscospark.com/v1',
  token: config.token
});

spark.getMessages({roomId: config.roomId}).then(function(data) {
  var messages = JSON.parse(data).items;

  var fileUris = messages
                .filter((message) => message.files)
                .map((message) => message.files)
                .reduce((arr, files) => arr.concat(files), []);
  return Promise.each(fileUris, function(uri) {
    return spark.dlFiles(uri).then(function(payload) {
      console.log(payload);
    });
  }).then(function() {
    //Results have been settled
    console.log('files have been stored')
  })
})
