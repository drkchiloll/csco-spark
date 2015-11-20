var request = require('request'),
    Promise = require('bluebird');

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
      resolve(body);
    });
  });
}

module.exports = (function() {
  var handler = {};

  handler.createRoom = function(room, token) {
    return makeReq({
      token: token,
      path: '/rooms',
      method: 'POST',
      body: room
    });
  };

  handler.sendMessage = function(message, token) {
    return makeReq({
      token: token,
      path: '/messages',
      method: 'POST',
      body: message
    });
  };

  handler.getPerson = function(options, token) {
    var userEmail = options.email;
    return makeReq({
      token: token,
      path: `/people?email=${userEmail}`,
      method: 'GET'
    }).then(function(data) {
      if(data) {
        return JSON.parse(data);
      }
    });
  };

  handler.addUserToRoom = function(args, token) {
    return makeReq({
      token: token,
      path: `/rooms/${args.roomId}/participants`,
      method: 'POST',
      body: args.participants
    });
  };
  return handler;
}());
