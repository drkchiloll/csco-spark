var request = require('request'),
    Promise = require('bluebird');

function _reqOptions(options) {
  return {
    url: options.uri,
    headers: {
      'Content-Type' : 'application/json',
      'Accept': 'application/json',
      'Authorization' : 'Bearer ' + options.token
    },
    strictSSL: false
  };
}

function _makeReq(args) {
  var options = _reqOptions({
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

  var _handleReq = (params) => {
    return _makeReq({
      uri: uri,
      token: token,
      path: params.path,
      method: params.method,
      body: params.body || ''
    });
  };

  var handler = {};

  handler.createRoom = function(roomProps) {
    return _handleReq({
      path: `/rooms`,
      method: 'POST',
      body: roomProps
    });
  };

  handler.removeRoom = function(roomId) {
    return _handleReq({
      path: `/rooms/${roomId}`,
      method: 'DELETE'
    });
  };

  handler.sendMessage = function(messageProps) {
    return _handleReq({
      path: `/messages`,
      method: 'POST',
      body: messageProps
    });
  };

  handler.getPerson = function(opts) {
    return _handleReq({
      path: (opts.email) ?
        `/people?email=${opts.email}` :
        `/people/${opts.personId}`,
      method: 'GET'
    });
  };

  handler.addMemberToRoom = function(member) {
    return _handleReq({
      path: '/memberships',
      method: 'POST',
      body: member
    });
  };

  handler.addUserToRoom = function(args) {
    return _handleReq({
      path: `/rooms/${args.roomId}/participants`,
      method: 'POST',
      body: args.participants
    });
  };

  handler.removeUserFromRoom = function(id) {
    return _handleReq({
      path: `/memberships/${id}`,
      method: 'DELETE'
    })
  };

  handler.getMessage = function(messageId) {
    return _handleReq({
      path: `/messages/${messageId}`,
      method: 'GET'
    });
  };

  handler.getMessages = function(options) {
    return _handleReq({
      path: `/messages?roomId=${options.roomId}&max=1000`,
      method: 'GET'
    });
  };

  handler.addWebhook = function(data) {
    return _handleReq({
      path: '/webhooks',
      method: 'POST',
      body: data
    });
  };

  handler.removeWebHook = function(webhookId) {
    return _handleReq({
      path: `/webhooks/${webhookId}`,
      method: 'DELETE'
    });
  };

  handler.dlFiles = (uri, authToken) => {
    var fileName, payload;
    if(!authToken) authToken = token;
    return new Promise((resolve, reject) => {
      request.get({
        uri: uri,
        headers: {Authorization: `Bearer ${authToken}`},
        encoding: 'binary'
      }, (err, resp, body) => {
        if(resp.statusCode === 200) {
          var headerFN = resp.headers['content-disposition'];
          fileName = headerFN
            .substring(headerFN.indexOf('"'))
            .replace(/"/gi, '')
          var contentType = resp.headers['content-type'];
          if(contentType.includes('image')) {
            payload = new Buffer(resp.body, 'binary').toString('base64');
          } else {
            payload = new Buffer(resp.body, 'binary');
          }
          resolve({
            fileName: fileName,
            blob: payload
          });
        }
      })
    })
  }

  return handler;
};
