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
    method: options.method,
    strictSSL: false
  };
}

function _makeReq(args) {
  var options = _reqOptions({
    uri: args.uri,
    token: args.token,
    method: args.method
  });
  if(args.path) options.url += args.path;
  if(args.body) options.json = args.body;
  // Used for File Downloads
  if(args.encoding) options.encoding = args.encoding;
  // REQ for Authorize App/Access & Refresh Tokens
  if(args.form) {
    // URLEncoded POST
    options.headers['content-type'] = 'application/x-www-form-urlencoded';
    // Remove Token Auhorization
    delete options.headers.authorization;
    // Add Form Data to the REQ Options
    options.form = args.form;
  }

  return new Promise(function(resolve, reject) {
    request(options, function(err, res, body) {
      if(err) resolve(err);
      if(res.headers.link || options.encoding) {
        return resolve(res);
      } else {
        return resolve(body);
      }
    });
  });
}

// Helper Functions
var getLink = (data) => {
  return data.split(';')[0]
    .replace('<', '')
    .replace('>', '');
};

module.exports = function(params) {
  var uri = params.uri || '',
      token = params.token || '';

  var _handleReq = (params) => {
    return _makeReq({
      uri: params.uri || uri,
      token: params.token || token,
      path: params.path || '',
      method: params.method,
      body: params.body || '',
      encoding: params.encoding || '',
      form: params.form || ''
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

  handler.deleteMessage = (msgId) => {
    return _handleReq({
      path: `/messages/${msgId}`,
      method: `DELETE`
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

  var handlePaging = (client, args) => {
    return new Promise((resolve, reject) => {
      var items = args.items;
      var link = args.link;
      (function nextPage() {
        return client.handlePages(link).then((data) => {
          items = items.concat(data.items);
          if(data.link) {
            link = data.link;
            nextPage();
          } else {
            resolve(items);
          }
        })
      }());
    })
  };

  handler.getMessages = function(options) {
    var client = this;
    return _handleReq({
      path: `/messages?roomId=${options.roomId}&max=200`,
      method: 'GET'
    }).then(function(resp) {
      if(resp.headers) {
        return handlePaging(client, {
          items: JSON.parse(resp.body).items,
          link: getLink(resp.headers.link)
        });
      } else {
        return JSON.parse(resp).items;
      }
    });
  };

  handler.getRooms = function(options) {
    var client = this;
    return _handleReq({
      path: `/rooms?max=200`,
      method: 'GET'
    }).then(function(resp) {
      if(resp.headers) {
        return handlePaging(this, {
          items: JSON.parse(resp.body).items,
          link: getLink(resp.headers.link)
        });
      } else {
        return JSON.parse(resp).items;
      }
    });
  };

  handler.handlePages = (uri) => {
    return new Promise((resolve, reject) => {
      request.get({
        uri: uri,
        headers: {Authorization: `Bearer ${token}`}
      }, function(err, res, body) {
        if(res.headers.link) {
          resolve({
            items: JSON.parse(body).items,
            link: getLink(res.headers.link)
          });
        } else {
          resolve({items: JSON.parse(body).items});
        }
      })
    })
  };

  handler.addWebhook = function(params) {
    return _handleReq({
      path: '/webhooks',
      method: 'POST',
      body: {
        name: params.name,
        targetUrl: params.hookUrl,
        resource: 'messages',
        event: 'created',
        filter: `roomId=${params.roomId}`
      }
    });
  };

  handler.deleteWebhook = function(webhookId) {
    return _handleReq({
      path: `/webhooks/${webhookId}`,
      method: 'DELETE'
    });
  };

  handler.getFileUris = (msges) => {
    return Promise.filter(msges, (msg) => msg.files)
      .map((msg) => msg.files)
      .reduce((arr, files) => arr.concat(files));
  };

  handler.dlFiles = (uri, authToken) => {
    var fileName, payload;
    if(!authToken) authToken = token;
    return _handleReq({
      uri: uri,
      token: authToken,
      method: 'GET',
      encoding: 'binary'
    }).then(function(resp) {
      var headerFN = resp.headers['content-disposition'];
      fileName = headerFN
        .substring(headerFN.indexOf('"'))
        .replace(/"/gi, '')
      var contentType = resp.headers['content-type'];
      // Check for Image/ZIP File Types (convert Buffer to BASE64 String)
      if(contentType.includes('image') || contentType.includes('zip') ||
         contentType.includes('octet-stream')) {
        payload = new Buffer(resp.body, 'binary').toString('base64');
      } else {
        payload = new Buffer(resp.body, 'binary');
      }
      return { fileName: fileName, blob: payload };
    });
  };

  handler.getAccessToken = (params) => {
    var formFields = {};
    formFields = {
      grant_type: params.code ? 'authorization_code' : 'refresh_token',
      client_id: params.id,
      client_secret: params.secret,
    };
    // Get New Access Token or Refresh Token
    if(params.code) {
      formFields.code = params.code,
      formFields.redirect_uri = params.redirectUri
    } else {
      formFields.refresh_token = params.refreshToken;
    }
    return _handleReq({
      uri: 'https://api.ciscospark.com/v1/access_token',
      method: 'POST',
      form: formFields
    });
  };

  return handler;
};
