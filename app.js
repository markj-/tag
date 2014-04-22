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

var duration = 10000;
var countDownTick;

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
    if ( assassin == null ) {
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

var addPlayer = function( data ) {
  var socket = this;
  data.socket = socket.id;
  var collection = db.get('users');
  var op = collection.insert( data );
  op.on('complete', function() {
    collection.count({}, function (error, count) {
      if ( count === 3 ) {
        startGame();
        updateAssassin();
      }
      updatePlayers();
      socket.emit('join');
      socket.join('players');
    });
  });
};

var removePlayer = function() {
  var socket = this;
  socket.get( 'assassin', function( err, isAssassin ) {
    if ( isAssassin ) {
      clearAssassin();
    }
    var collection = db.get('users');
    var op = collection.remove({
      socket: socket.id
    });
    op.on('complete', function() {
      collection.count({}, function (error, count) {
        if ( count < 3 ) {
          pauseGame();
          updateAssassin();
        } else {
          startGame();
        }
        updatePlayers();
        socket.emit('leave');
        socket.leave('players');
      });
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

var resetGame = function() {
  console.log('GAME RESET');
  clearPlayers();
  duration = 10000;
};

var endGame = function() {
  console.log('GAME ENDED');
  clearInterval( countDownTick );
  io.sockets.emit( 'endGame' );
};

var pauseGame = function() {
  console.log('GAME PAUSED');
  clearInterval( countDownTick );
};

var startGame = function() {
  console.log('GAME STARTED / RESUMED');
  countDownTick = setInterval(function() {
    duration = duration - 1000;
    console.log( 'TIME REMAINING: ', duration / 1000, 'seconds' );
    if ( duration === 0 ) {
      endGame();
    }
  }, 1000 );
  io.sockets.emit('startGame');
};

io.sockets.on('connection', function ( socket ) {
  socket.on( 'newPlayer', addPlayer );

  socket.on( 'leave', removePlayer );

  socket.on( 'disconnect', removePlayer );

  socket.on( 'reset', resetGame );
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