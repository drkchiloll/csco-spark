var authData = require('./config').auth,
    Spark = require('../index');

var spark = Spark({uri: '', token: ''});

spark.authenticate(authData).then((accessToken) => {
  console.log(accessToken);
}).catch((err) => {
  console.log(err);
})

// var refreshToken =
//   'NDVmNzVhZTMtMjVhMC00MGZhLTgyNmItOGM5MTNhODE3MGY5NjkwZWU4YmMtYjhm';

// spark.refreshToken({
//   app : { id : authData.id, secret: authData.secret },
//   refreshToken: refreshToken
// }).then((accessTokens) => {
//   console.log(accessTokens);
// })
