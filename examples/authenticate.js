var authData = require('./config').auth,
    Spark = require('../index');

var spark = Spark({uri: '', token: ''});

spark.authenticate(authData).then((accessToken) => {
  console.log(accessToken);
})
