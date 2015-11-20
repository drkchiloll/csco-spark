var request = require('request'),
    Promise = require('bluebird'),
    token = require('../config').token;

function reqOptions(token) {
  return {
    url: 'https://api.ciscospark.com/hydra/api/v1/',
    headers: {
      'Content-Type' : 'application/json',
      'Accept': 'application/json',
      'Authorization' : token
    },
    strictSSL: false
  };
}

function makeReq(args) {
  var options = reqOptions(args.token);
  options.method = args.method;
  options.url += args.path;
  options.json = args.body;
  return new Promise(function(resolve, reject) {
    request(options, function(err, res, body) {
      if(err) resolve(err);
      console.log(res.statusCode);
      resolve(body);
    });
  });
}

module.exports = (function() {
  var handler = {};
  handler.sendMessage = function(args) {
    return makeReq(args);
  };

  handler.addUserToRoom = function(args) {
    return makeReq(args);
  };
  return handler;
}());
