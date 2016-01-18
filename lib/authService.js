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

module.exports = (authData) => {
  var username = authData.user || '',
      password = authData.pass || '',
      clientId = authData.id,
      clientSecret = authData.secret,
      redirectUri = authData.redirectUri;

  // Helper FNs
  var loginQS = () => ({
    IDToken0: '',
    IDToken1: username,
    IDToken2: password,
    IDButton:'Sign+In',
    goto: goToUrl(),
    SunQueryParamsString: sunQuery(),
    encoded:'true',
    loginid: username,
    isAudioCaptcha: 'false',
    gx_charset: 'UTF-8'
  });

  var sunQuery = () => (
    new Buffer(qs.stringify({
      isCookie: false,
      fromGlobal: 'yes',
      realm: 'consumer',
      type: 'login',
      encodedParamString: 'dHlwZT1sb2dpbg==',
      gotoUrl: goToUrl(),
      email: username
    })).toString('base64')
  );

  var goToUrl = () => (
    new Buffer(`${authUrl}?response_type=code&client_id=${clientId}`+
      `&redirect_uri=${encodeURIComponent(redirectUri)}`+
      `&scope=${encodeURIComponent(scopes)}`).toString('base64')
  );

  var authQS = () => ({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    service: 'webex-squared',
    scope: scopes
  });

  var authorizeForm = (authCode) => ({
    security_code : authCode,
    response_type: 'code',
    client_id: clientId,
    decision: 'accept'
  });

  var accessTokenForm = (auth) => {
    var tok = {};
    tok = {
      grant_type: (auth.code) ? 'authorization_code' : 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
    };
    if(auth.code) {
      tok.code = auth.code;
      tok.redirect_uri = redirectUri;
    } else {
      tok.refresh_token = auth.refreshToken;
    }
    return tok;
  };

  var authService = {};

  authService.loginReq = () => ({
    uri: initLoginUrl,
    method: 'GET',
    qs: loginQS(),
    jar: true,
    token: undefined
  });

  authService.parseLoginCode = (html) => {
    var $ = cheerio.load(html);
    var code = $(`input[type='hidden']`)
      .attr(`name`, `security_code`)
      .val();
    return (code.length === 64) ?
      code :
      'Authentication Denied';
  };

  authService.authorize = (loginCode) => ({
    uri: authUrl,
    method: 'POST',
    qs: authQS(),
    jar: true,
    form: authorizeForm(loginCode),
    token: undefined
  });

  /**
   * @param {Object} authTokCode - Retrieve Access Token
   * @param {String} [authTokCode.code] - Obtain Intial Access Token
   * @param {String} [authTokCode.refreshToken] - Get Token from Refresh Token
   */
  authService.accessToken = (authTokCode) => ({
    uri: axxUrl,
    method: 'POST',
    form: accessTokenForm(authTokCode),
    token: undefined
  })

  return authService;
};
