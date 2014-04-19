var express = require('express');
var path = require('path');
var mongo = require('mongodb');
var monk = require('monk');
var http = require('http');

var db = monk('localhost:27017/tag');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var assassin = null;

var clearAssassin = function() {
  if ( assassin ) {
    assassin.set( 'assassin', false, function() {
      assassin.emit( 'unchosen' );
      assassin = null;
    });
  }
};

var chooseAssassin = function( count ) {
  var choice = Math.floor( Math.random()*(count) );
  io.sockets.clients('players').forEach(function (socket, i) {
    if ( i === choice ) {
      socket.set( 'assassin', true, function() {
        assassin = socket;
        assassin.emit( 'chosen' );
      });
    }
  });
};

var updateAssassin = function() {
  var collection = db.get('users');
  collection.count({}, function (error, count) {
    if ( count >= 3 && assassin == null ) {
      chooseAssassin( count );
    } else if ( count < 3 && assassin ) {
      clearAssassin();
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
  data.socket = socket.id;
  var collection = db.get('users');
  var op = collection.insert( data );
  op.on('complete', function() {
    updateAssassin();
    updatePlayers();
    socket.emit('join');
    socket.join('players');
  });
};

var removePlayer = function( socket ) {
  socket.get( 'assassin', function( err, isAssassin ) {
    if ( isAssassin ) {
      clearAssassin();
    }
    var collection = db.get('users');
    var op = collection.remove({
      socket: socket.id
    });
    op.on('complete', function() {
      updateAssassin();
      updatePlayers();
      socket.emit('leave');
      socket.leave('players');
    });
  });
};

var clearPlayers = function() {
  db.get( 'users' ).drop( updatePlayers );
  clearAssassin();
  updatePlayers();
  io.sockets.emit('leave');
  io.sockets.clients('players').forEach(function( socket, i ) {
    socket.leave('players');
  });
};

var incrementScore = function( socket ) {
  socket.get( 'assassin', function( err, isAssassin ) {
    if ( isAssassin ) {
      var collection = db.get( 'users' );
      collection.update({
        socket: socket.id
      }, {
        $inc: {
          score: 1
        }
      }).on('success', updatePlayers);
    }
  });
};

io.sockets.on('connection', function ( socket ) {
  socket.on( 'newPlayer', function( data ) {
    addPlayer( data, this );
  });

  socket.on( 'increment', function() {
    incrementScore( this );
  });

  socket.on( 'leave', function() {
    removePlayer( this );
  });

  socket.on( 'disconnect', function() {
    removePlayer( this );
  });

  socket.on( 'reset', function() {
    clearPlayers();
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