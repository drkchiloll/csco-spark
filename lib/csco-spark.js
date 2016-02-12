var request = require('request'),
    Promise = require('bluebird'),
    EventEmitter = require('events').EventEmitter;

//
// Helper Functions
//
/**
 * @param {Object} options - MOST Import REQ Options
 * @param {String} options.uri - URL to make REQ To
 * @param {String} options.method - HTTP GET/POST/PUT/DELETE
 * @param {String} [options.token] - AUTH Needed for REQ?
 */
var _reqOptions = (options) => {
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
};

var _makeReq = (args) => {
  if(!args.uri) reject('URL is missing.');
  var options = _reqOptions({
    uri: args.uri,
    token: args.token || undefined,
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
      if(res.headers.link || options.encoding) {
        return resolve(res);
      } else {
        return resolve(body);
      }
    });
  });
};

var getLink = (data) => {
  return data.split(';')[0]
    .replace('<', '')
    .replace('>', '');
};

/**
 * @param {Object} [params] - BootStrap the Exports Function
 * @param {String} [params.uri] - URI to the API being used
 * @param {String} [params.token] - OAuth Token for API Access
 */
module.exports = (params) => {
  var uri, token;
  if(params) {
    uri = params.uri || undefined;
    token = params.token || undefined;
  }

  /**
   * @param {Object} reqOptions - HTTP Request Options
   * @param {String} [reqOptions.uri]
   * @param {String} [reqOptions.token] - Auth Token for REQ Headers
   * @param {String} [reqOptions.path] - API Endpoint Appended to URI
   * @param {String} reqOptions.method - HTTP GET/POST/PUT/DELETE
   * @param {String} [reqOptions.body] - REQ POST/PUT Body (json/data)
   * @param {String} [reqOptions.encoding] - Set Encoding for File DLs
   * @param {String} [reqOptions.form] - Was Used for Auth REQ (AccessTokens)
   */
  var _handleReq = (reqOptions) => {
    return _makeReq({
      uri: reqOptions.uri || uri,
      token: reqOptions.token || token,
      path: reqOptions.path || '',
      method: reqOptions.method,
      body: reqOptions.body || '',
      encoding: reqOptions.encoding || undefined,
      form: reqOptions.form || undefined
    });
  };

  var handler = {};

  handler.getRoom = (id) => {
    return _handleReq({
      path: `/rooms/${id}`,
      method: 'GET'
    })
    .then(resp => JSON.parse(resp))
    .catch(err => JSON.parse(err))
  };

  handler.createRoom = (roomProps) => {
    return _handleReq({
      path: `/rooms`,
      method: 'POST',
      body: roomProps
    });
  };

  handler.removeRoom = (roomId) => {
    return _handleReq({
      path: `/rooms/${roomId}`,
      method: 'DELETE'
    });
  };

  handler.sendMessage = (messageProps) => {
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

  handler.getPerson = (opts) => {
    return _handleReq({
      path: (opts.email) ?
        `/people?email=${opts.email}` :
        `/people/${opts.personId}`,
      method: 'GET'
    });
  };

  handler.addMemberToRoom = (member) => {
    return _handleReq({
      path: '/memberships',
      method: 'POST',
      body: member
    });
  };

  handler.getRoomMembers = (id) => {
    return _handleReq({
      path: `/memberships?roomId=${id}`,
      method: 'GET'
    })
    .then(resp => JSON.parse(resp).items)
    .catch(err => JSON.parse(err));
  };

  handler.addUserToRoom = (args) => {
    return _handleReq({
      path: `/rooms/${args.roomId}/participants`,
      method: 'POST',
      body: args.participants
    });
  };

  handler.removeUserFromRoom = (id) => {
    return _handleReq({
      path: `/memberships/${id}`,
      method: 'DELETE'
    })
  };

  handler.getMessage = (messageId) => {
    return _handleReq({
      path: `/messages/${messageId}`,
      method: 'GET'
    });
  };

  var handlePaging = (args) => {
    var items;
    return new Promise((resolve, reject) => {
      (function nextPage(uri, newItems) {
        return _handleReq({
          uri: uri,
          method: 'GET'
        }).then((data) => {
          if(data) {
            (!data.body) ? items = newItems.concat(JSON.parse(data).items)
              : items = newItems.concat(JSON.parse(data.body).items)
            if(data.headers && data.headers.link) {
              var uri = getLink(data.headers.link);
              nextPage(uri, items);
            } else {
              resolve(items);
            }
          } else {
            resolve(newItems);
          }
        })
      }(args.link, args.items));
    })
  };

  handler.getMessages = (options) => {
    return _handleReq({
      path: `/messages?roomId=${options.roomId}&max=200`,
      method: 'GET'
    }).then((resp) => {
      if(resp.headers) {
        return handlePaging({
          items: JSON.parse(resp.body).items,
          link: getLink(resp.headers.link)
        });
      } else {
        return JSON.parse(resp).items;
      }
    });
  };

  handler.getRooms = (options) => {
    var client = this;
    return _handleReq({
      path: `/rooms?max=200`,
      method: 'GET'
    }).then((resp) => {
      if(resp.headers) {
        return handlePaging({
          items: JSON.parse(resp.body).items,
          link: getLink(resp.headers.link)
        });
      } else {
        return JSON.parse(resp).items;
      }
    });
  };

  var getPath = (path) => {
    var item = path.item;
    var max = path.max || '50';
    switch(item) {
      // Fall Through Rooms/Webhooks
      case 'rooms':
      case 'webhooks':
        return `/${item}?max=${max}`;
      case 'messages':
      case 'memberships':
      case 'people':
        return (
          path.roomId ? `/${item}?roomId=${path.roomId}&max=${max}` : //Messages & Members
          path.personId ? `/${item}?personId=${path.personId}` : //People & Members
          path.email ? `/${item}?email=${path.email}` : //People & Members
          path.displayName ? `/${item}?displayName=${path.displayName}` : //People & Members
          undefined
        );
    }
  };

  /**
   * @param {Object} opts - Reference to List Query
   * @param {String} opts.item - Obj to List (rooms/webhooks/messages/people)
   * @param {String} [opts.roomId] - Spark RoomId
   * @param {String} [opts.max] - Max No. of Obj Returned default is 100
   * @param {String} [opts.email] - Email of Address Of Spark User
   * @param {String} [opts.personId] - Spark User ID (key)
   * @param {String} [opts.displayName] - Spark Users Display Name
   * @param {String} [opts.uri] - Link URL for Pagination
   */
  handler.listItemEvt = (opts) => {
    var item = opts.item;
    var path = (!opts.uri) ? getPath(opts) : undefined;
    _handleReq({
      uri : opts.uri || undefined,
      path: !opts.uri ? path : undefined,
      method: 'GET'
    }).then((resp) => {
      if(resp.headers) {
        var link = getLink(resp.headers.link);
        handler.listItemEvt({uri: link, item: item});
        handler.emit(opts.item, JSON.parse(resp.body).items);
      } else {
        handler.emit(`${item}-end`, JSON.parse(resp).items);
      }
    });
    return handler;
  };

  /**
   * @param {Object} hooks - WebHook Parameters
   * @param {String} hooks.name - Name of the WebHook
   * @param {String} hooks.hookUrl - WebHook Endpoint to send Events To
   * @param {String} hooks.roomId - Spark Room where WebHook is Config'd for
   */
  handler.addWebhook = (hooks) => {
    return _handleReq({
      path: '/webhooks',
      method: 'POST',
      body: {
        name: hooks.name,
        targetUrl: hooks.hookUrl,
        resource: 'messages',
        event: 'created',
        filter: `roomId=${hooks.roomId}`
      }
    });
  };

  handler.deleteWebhook = (webhookId) => {
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
    }).then((resp) => {
      var headerFN = resp.headers['content-disposition'];
      fileName = headerFN
        .substring(headerFN.indexOf('"'))
        .replace(/"/gi, '')
      var contentType = resp.headers['content-type'];
      // Check for Image/ZIP/Office File Types for Conversion
      if(contentType.includes('image') ||
         contentType.includes('zip') ||
         contentType.includes('octet-stream') ||
         contentType.includes('officedocument') ||
         contentType.includes('pdf')) {
        payload = new Buffer(resp.body, 'binary').toString('base64');
      } else {
        payload = new Buffer(resp.body, 'binary');
      }
      return { fileName: fileName, blob: payload };
    });
  };

  // Add EventEmitter onto Handler
  EventEmitter.call(handler);
  Object.assign(handler, EventEmitter.prototype);
  return handler;
};
