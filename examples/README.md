##### Directions

If you want to use any of these Examples of using the Module do the following:

1. Create a config.js file in the directory where you are copying the example.js file; below is an example of the config module:

```javascript
module.exports = {
  token: 'api token',
  //any thing else you need to reference in the config such as roomId etc
};
```

2. require the Spark module like below (not as I reference in the file: require('../csco-spark')):

```javascript
var spark = require('csco-spark');
```

3. Ensure you satisfy any dependencies the example might have (bluebird/request et al)
