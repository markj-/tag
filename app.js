var express = require('express');
var path = require('path');
var mongo = require('mongodb');
var monk = require('monk');
var http = require('http');

var db = monk('192.168.0.7:27017/tag');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var assassin = null;

var chooseAssassin = function( count ) {
  var choice = Math.floor( Math.random()*(count + 1) );
  io.sockets.clients().forEach(function (socket, i) {
    if ( i === choice ) {
      assassin = socket;
      socket.emit( 'chosen' );
    }
  });
};

var updateAssassin = function() {
  var collection = db.get('users');
  collection.count({}, function (error, count) {
    if ( count >= 3 && assassin == null ) {
      chooseAssassin( count );
    }
  });
};

var updatePlayers = function() {
  var collection = db.get('users');
  collection.find({},function(e,docs){
    io.sockets.emit( 'updatePlayers', docs );
  });
};

var addPlayer = function( data, socket ) {
  var collection = db.get('users');
  var op = collection.insert( data );
  op.on('complete', function() {
    updateAssassin();
    updatePlayers();
    socket.emit('join');
  });
};

var removePlayer = function( data, socket ) {
  if ( data.isAssassin ) {
    clearAssassin();
  }
  var collection = db.get('users');
  var op = collection.remove({
    bluetooth: data.bluetooth
  });
  op.on('complete', function() {
    updateAssassin();
    updatePlayers();
    socket.emit('leave');
  });
};

var clearAssassin = function() {
  assassin = null;
};

var clearPlayers = function() {
  db.get( 'users' ).drop( updatePlayers );
  updatePlayers();
  io.sockets.emit('leave');
};

io.sockets.on('connection', function (socket) {
  socket.on( 'newPlayer', function( data ) {
    addPlayer( data, socket );
  });

  socket.on( 'reset', function() {
    clearPlayers();
  });

  socket.on( 'leave', function( data ) {
    removePlayer( data, socket );
  });
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

app.get('/', routes.index(db));

server.listen(3000);