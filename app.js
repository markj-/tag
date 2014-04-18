var express = require('express');
var path = require('path');
var mongo = require('mongodb');
var monk = require('monk');
var http = require('http');

var db = monk('localhost:27017/tag');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
  socket.on('it', function() {
    console.log('works');
  })
});

var routes = require('./routes');

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

app.get('/users', routes.users);

server.listen(3000);