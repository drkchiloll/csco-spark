var cheerio = require('cheerio'),
    url = require('url'),
    qs = require('querystring');

// Constants
const initLoginUrl = 'https://idbroker.webex.com/idb/UI/Login';
const authUrl = 'https://idbroker.webex.com/idb/oauth2/v1/authorize';
const axxUrl = 'https://api.ciscospark.com/v1/access_token';
const scopes = (
  `spark:memberships_write spark:memberships_read `+
  `spark:rooms_read spark:rooms_write `+
  `spark:messages_write spark:messages_read`
);

module.exports = (() => {
  // var username = authData.user || '',
  //     password = authData.pass || '',
  //     clientId = authData.id,
  //     clientSecret = authData.secret,
  //     redirectUri = authData.redirectUri;

  // Helper FNs
  var loginQS = (args) => {
    var goToParams = {
      id: args.id,
      redirectUri: args.redirectUri,
    };
    return {
      IDToken0: '',
      IDToken1: args.user,
      IDToken2: args.pass,
      IDButton:'Sign+In',
      goto: goToUrl(goToParams),
      SunQueryParamsString: sunQuery({
        id: args.id, user: args.user, redirectUri: args.redirectUri
      }),
      encoded:'true',
      loginid: args.user,
      isAudioCaptcha: 'false',
      gx_charset: 'UTF-8'
    };
  };


  var sunQuery = (params) => {
    var goToParams = {
      id: params.id,
      redirectUri: params.redirectUri
    };
    return new Buffer(qs.stringify({
      isCookie: false,
      fromGlobal: 'yes',
      realm: 'consumer',
      type: 'login',
      encodedParamString: 'dHlwZT1sb2dpbg==',
      gotoUrl: goToUrl(goToParams),
      email: params.user
    })).toString('base64');
  };

  var goToUrl = (params) => (
    new Buffer(`${authUrl}?response_type=code&client_id=${params.id}`+
      `&redirect_uri=${encodeURIComponent(params.redirectUri)}`+
      `&scope=${encodeURIComponent(scopes)}`).toString('base64')
  );

  var authQS = (auth) => ({
    response_type: 'code',
    client_id: auth.id,
    redirect_uri: auth.redirectUri,
    service: 'webex-squared',
    scope: scopes
  });

  var authorizeForm = (auth) => ({
    security_code : auth.code,
    response_type: 'code',
    client_id: auth.id,
    decision: 'accept'
  });

  var accessTokenForm = (auth) => {
    var tok = {};
    tok = {
      grant_type: (auth.code) ? 'authorization_code' : 'refresh_token',
      client_id: auth.id,
      client_secret: auth.secret,
    };
    if(auth.code) {
      tok.code = auth.code;
      tok.redirect_uri = auth.redirectUri;
    } else {
      tok.refresh_token = auth.refreshToken;
    }
    return tok;
  };

  var authService = {};

  authService.loginReq = (authData) => {
    return {
      uri: initLoginUrl,
      method: 'GET',
      qs: loginQS(authData),
      jar: true,
      token: undefined
    };
  };

  authService.parseLoginCode = (html) => {
    var $ = cheerio.load(html);
    var code = $(`input[type='hidden']`)
      .attr(`name`, `security_code`)
      .val();
    if(!code) throw new Error('Authentication Failure');
    return (code.length === 64) ?
      code :
      'Authentication Denied';
  };

  authService.authorize = (authData) => ({
    uri: authUrl,
    method: 'POST',
    qs: authQS({
      id: authData.id,
      redirectUri: authData.redirectUri
    }),
    jar: true,
    form: authorizeForm({
      code: authData.code,
      id: authData.id
    }),
    token: undefined
  });

  /**
   * @param {Object} authTokCode - Retrieve Access Token
   * @param {String} [authTokCode.code] - Obtain Intial Access Token
   * @param {String} [authTokCode.refreshToken] - Get Token from Refresh Token
   */
  authService.accessToken = (authData) => ({
    uri: axxUrl,
    method: 'POST',
    form: accessTokenForm({
      id: authData.id,
      secret: authData.secret,
      redirectUri: authData.redirectUri,
      code: authData.code
    }),
    token: undefined
  })

  return authService;
}());
