var express = require('express');
var app = express();

//Cart search logic
var capture = require('./logic/capture.js');

var bodyParser = require('body-parser')
app.use(bodyParser());
// healthcheck
// var healthcheck = require('./logic/healthcheck.js');


app.post('/capture', capture.capture);

// app.get('/healthcheck', healthcheck.healthcheck);

var server;
server = app.listen(3000, function() {


  var host = server.address().address;
  var port = server.address().port;

  console.log('Search app listening at http://%s:%s', host, port);
});

module.export = {
  app: server
};
