# Cisco Spark API Integration

##### Install

```
npm install --save csco-spark
```

##### Special Note

** This requires __NodeJS version 4+__ as it utilizes some ES2015 (ES6) features not found in other versions of Node.

##### Usage

```javascript
var sparkFactory = require('csco-spark'),

var spark = sparkFactory({
  uri: 'https://api.ciscospark.com/v1',
  token: 'token'
});

// Send a Message
spark.sendMessage({
  roomId:'roomId',
  text: 'message'
}).then((res) => {
  /*Store the res data?*/
});

// Create a Spark Room
spark.createRoom({ title: 'title'}).then((res) => {
  /*Store the res data?*/
});

// Delete a Room
spark.removeRoom(roomId).then((res) {
  /* resp should be null */
});

// Add User To a Spark Room
spark.addMemberToRoom({
  roomId: 'id',
  personEmail: 'someone@example.com' || null,
  personId: 'spark personId' || null,
  isModerator: true || false
}).then((resp) => {
  /* handle response */
});

// Download Files from Spark Room
spark.dlFiles('uri of file location', 'optional token').then((resp) => {
  /*
   * RESP is a List of Objects Consisting of the Below:
   * [{fileName: `filename`, blob: `buffered contents of file`}]
   * The buffered contents of the file is ready to be written to disk
   * it is not human readable
   */
});

// Get ALL Messages from a Spark Room
spark.getMessages({ roomId: 'spark roomId'}).then((messages) => {
  /*
   * The LIB handles Pagination for You; it DLs 200 Messages at a time
   * and adds them to a List. All the properties of the Messages object
   * are untouched
   */
});

// Get all the Rooms a Spark User is In
spark.getRooms().then((rooms) => {
  /*
   * Like Messages, pagination is handled for you.
   */
});

// Get Access/Refresh Token
// Authentication on Behalf of a User (Granting App Permissions)
// Refer to https://developer.ciscospark.com/authentication.html
spark.getAccessToken({
  code: 'code received from /authorize step1',
  id: 'application clientId',
  secret: 'application clientSecret',
  redirectUri: 'application redirect_uri'
}).then((resp) => {
  var authData = resp;
  /*
   * {access_token: 'token', refresh_token: 'token', ...}
   */
});
```
