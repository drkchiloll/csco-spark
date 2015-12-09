var request = require('request'),
    Promise = require('bluebird');

function reqOptions(options) {
  return {
    url: options.uri,
    headers: {
      'Content-Type' : 'application/json',
      'Accept': 'application/json',
      'Authorization' : 'Bearer' + options.token
    },
    strictSSL: false
  };
}

function makeReq(args) {
  var options = reqOptions({
    uri: args.uri, token: args.token
  });
  options.method = args.method;
  options.url += args.path;
  if(args.body) {
    options.json = args.body;
  }
  return new Promise(function(resolve, reject) {
    request(options, function(err, res, body) {
      if(err) resolve(err);
      resolve(body);
    });
  });
}

module.exports = function(params) {
  var uri = params.uri,
      token = params.token;

  var handler = {};

  handler.createRoom = function(room) {
    return makeReq({
      uri: uri,
      token: token,
      path: '/rooms',
      method: 'POST',
      body: room
    });
  };

  handler.sendMessage = function(message) {
    return makeReq({
      uri: uri,
      token: token,
      path: '/messages',
      method: 'POST',
      body: message
    });
  };

  handler.getPerson = function(options) {
    var userEmail = options.email;
    return makeReq({
      uri: uri,
      token: token,
      path: `/people?email=${userEmail}`,
      method: 'GET'
    });
  };

  handler.addMemberToRoom = function(member) {
    return makeReq({
      uri: uri,
      token: token,
      path: '/memberships',
      method: 'POST',
      body: member
    });
  };

  handler.addUserToRoom = function(args) {
    return makeReq({
      uri: uri,
      token: token,
      path: `/rooms/${args.roomId}/participants`,
      method: 'POST',
      body: args.participants
    });
  };

  handler.removeUserFromRoom = function(id) {
    return makeReq({
      uri: uri,
      token: token,
      path: `/memberships/${id}`,
      method: 'DELETE'
    })
  };

  handler.getMessage = function(messageId) {
    return makeReq({
      uri: uri,
      token: token,
      path: `/messages/${messageId}`,
      method: 'GET'
    });
  };

  handler.getMessages = function(options) {
    return makeReq({
      uri: uri,
      token: token,
      path: `/messages?roomId=${options.roomId}`,
      method: 'GET'
    });
  };

  handler.addWebhook = function(data) {
    return makeReq({
      uri: uri,
      token: token,
      path: '/webhooks',
      method: 'POST',
      body: data
    });
  };

  return handler;
};
