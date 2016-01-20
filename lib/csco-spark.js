var request = require('request'),
    Promise = require('bluebird'),
    qs = require('querystring'),
    url = require('url');

var live = require('uncache')(require);

var AuthService = require('./authService');
var func = live.function('./authService');

function _reqOptions(options) {
  var opts = {
    url: options.uri,
    headers: {
      'Content-Type' : 'application/json',
      'Accept': 'application/json'
    },
    method: options.method,
    strictSSL: false
  };
  if(options.token) opts.headers.Authorization = `Bearer ${options.token}`
  return opts;
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
    // Add Form Data to the REQ Options
    options.form = args.form;
  }
  // Used in OAuth Flow
  if(args.qs && args.jar) {
    options.qs = args.qs;
    options.jar = true;
  }
  return new Promise(function(resolve, reject) {
    request(options, function(err, res, body) {
      if(err) return reject(err);
      if(res.statusCode.toString().startsWith('4')) return reject(body);
      /*
       * res.headers.link deals with Pagination and provides the nextPages uri
       * options.encoding tells me I'm dealing with files and I need the Content
       * Type from the RESP Object to provide the FileName etc of the file I'm
       * DLing
       * RES.HEADERS.LOCATION is used to send back the redirectUri with
       * AUTHORIZATION_CODE in the case of performing a OAuth Flow
       */
      if(res.headers.link || options.encoding || res.headers.location) {
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

var getAuthCode = (uri) => {
  var codes = qs.parse(url.parse(uri).query);
  if(codes.code) return codes.code;
  else return codes.security_code;
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
      form: params.form || '',
      qs: params.qs || '',
      jar: params.jar || false
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

  /**
   * @param {Object} auth
   * @param {string} auth.user - User's email addrs
   * @param {string} auth.pass - Spark password
   * @param {string} auth.id - User's App client_id
   * @param {string} auth.secret - User's App client_secret
   * @param {string} auth.redirectUri - User's App redirect_uri
   */
  handler.authenticate = (auth) => {
    // Pass {Object} auth to authService
    // var oauthFlow = AuthService(auth);
    // Get Login Request Options (authService)
    // Make Initial Login Request (_handleReq)
    return _handleReq(AuthService.loginReq(auth)).then((html) => {
      // Parse Login Code from HTML Body (authService)
      var loginCode = AuthService.parseLoginCode(html);
      // Get Authorization REQ Options using Login Code (authService)
      // Make Authorize Request (_handleReq)
      var authorize = {id: auth.id, redirectUri: auth.redirectUri, code: loginCode};
      return _handleReq(AuthService.authorize(authorize));
    }).then((resp) => {
      var authCode = getAuthCode(resp.headers.location);
      if(authCode === 'Authentication Denied') {
        throw new Error(`${authCode}: Please Check Your Auth Data`);
      } else {
        // Get Authorization Code from RESP (getAuthCode)
        // Get Access Token REQ Options using Auth_Code {code: authCode}
        // Make REQ to Get an AccessToken with RefreshToken
        return _handleReq(AuthService.accessToken({
          id: auth.id,
          secret: auth.secret,
          redirectUri: auth.redirectUri,
          code: authCode
        })).then((data) => JSON.parse(data));
      }
    });
  };

  /**
   * @param {Object} auth - Object needed to Refresh an Access Token
   * @param {string} auth.refreshToken - Token used to gen new Access_Token
   * @param {Object} auth.app - Used to create authService Instance
   * @param {string} auth.app.id - Users client_id
   * @param {string} auth.app.secret - Users client_secret
   */
  handler.refreshToken = (auth) => {
    var authParams = auth.app;
    authParams.user = '';
    authParams.pass = '';
    var refresh = AuthService(authParams);
    return _handleReq(refresh.accessToken({
      refreshToken: auth.refreshToken
    })).then((data) => JSON.parse(data));
  };

  return handler;
};
