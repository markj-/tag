var socket = io.connect('http://localhost'),
  form = document.querySelector('.join-game-form'),
  players = document.querySelector('.players'),
  username = form.querySelector('.join-game-form__username'),
  bluetooth = form.querySelector('.join-game-form__bluetooth'),
  reset = document.querySelector('.reset-button'),
  leave = document.querySelector('.leave-game-button'),
  leaveGame = function() {
    document.body.classList.remove( 'joined-game' );
    stopBeingAssassin();
  },
  joinGame = function() {
    document.body.classList.add( 'joined-game' );
  },
  becomeAssassin = function() {
    document.body.classList.add( 'is-assassin' );
  },
  stopBeingAssassin = function() {
    document.body.classList.remove( 'is-assassin' );
  },
  updatePlayers = function( data ) {
    if ( data.length ) {
      players.innerHTML = '';
      data.forEach(function( player ) {
        players.innerHTML += '<li data-bluetooth="' + player.bluetooth + '">' + player.username + '<span class="score">' + (player.score || '') + '</span></li>';
      });
    } else {
      document.body.classList.remove( 'is-ended' );
      players.innerHTML = '<li>Waiting for players</li>';
    }
  },
  setBluetoothId = function() {
    // temp until I am given bluetooth id from device
    bluetooth.value = Math.floor(Math.random()*100000);
  },
  endGame = function() {
    document.body.classList.add( 'is-ended' );
  },
  startGame = function() {
    document.body.classList.add( 'is-started' );
  };

setBluetoothId();

form.addEventListener('submit', function( e ) {
  e.preventDefault();
  socket.emit( 'newPlayer', {
    username: username.value,
    bluetooth: bluetooth.value,
    score: 0
  });
});

reset.addEventListener('click', function() {
  socket.emit( 'reset' );
});

leave.addEventListener('click', function() {
  socket.emit( 'leave', {
    bluetooth: bluetooth.value
  });
});

socket.on('join', joinGame );

socket.on('leave', leaveGame );

socket.on('chosen', becomeAssassin );

socket.on('unchosen', stopBeingAssassin );

socket.on( 'updatePlayers', updatePlayers );

socket.on( 'endGame', endGame );

socket.on( 'startGame', startGame );