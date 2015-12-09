# Cisco Spark API Integration

##### Install

```
npm install --save csco-spark
```

##### Usage

```javascript
var sparkFactory = require('spark'),

var spark = sparkFactory({
  uri: 'https://api.ciscospark.com/v1',
  token: 'token'
});

spark.sendMessage({
  roomId:'roomId',
  text: 'message'
}).then(function(res) {
  //Store the res data?
});
```

##### Special Note

This requires NodeJS version 4+ as it utilizes some ES2015 (ES6) features not found in other versions of Node.
