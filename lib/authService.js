var cheerio = require('cheerio'),
    url = require('url'),
    qs = require('qs');

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
  var username = authData.user,
      password = authData.password,
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
    new Buffer(`${authUrl}?response_type=code&client_id=${clienId}`+
      `&redirect_uri=${encodeURIComponent(redirectUri)}`+
      `&scope=${encodeURIComponent(scopes)}`).toString('base64')
  );

  var authService = {};

  authService.loginReq = () => ({
    uri: initLoginUrl,
    qs: loginQS(),
    jar: true
  });

  authService.parseLoginCode = (html) => {
    var $ = cheerio.load(html);
    var code = $(`input[type='hidden']`)
      .attr(`name`, `security_code`)
      .val();
    return (code.length === 64) ?
      code :
      'Authentication Denied';
  }

  return authService;
};
