var socket = io.connect('http://192.168.0.7'),
  form = document.querySelector('.join-game-form'),
  players = document.querySelector('.players'),
  username = form.querySelector('.join-game-form__username'),
  bluetooth = form.querySelector('.join-game-form__bluetooth'),
  reset = document.querySelector('.reset-button'),
  leave = document.querySelector('.leave-game-button')
  updateState = function( state ) {
    var bodyCl = document.body.classList;
    if ( state === 'left-game' ) {
      bodyCl.remove( 'joined-game' );
    } else if ( state === 'joined-game' ) {
      bodyCl.add( 'joined-game' );
    } else if ( state === 'is-assassin' ) {
      bodyCl.add( 'is-assassin' );
    }
  };

form.addEventListener('submit', function( e ) {
  e.preventDefault();
  socket.emit( 'newPlayer', {
    username: username.value,
    bluetooth: bluetooth.value
  });
  updateState( 'joined-game' );
});

reset.addEventListener('click', function() {
  socket.emit( 'reset' );
  updateState( 'left-game' );
});

leave.addEventListener('click', function() {
  socket.emit( 'leave', {
    bluetooth: bluetooth.value
  });
  updateState( 'left-game' );
});

socket.on('reset', function() {
  updateState( 'left-game' );
});

socket.on('chosen', function() {
  updateState( 'is-assassin' );
});

socket.on( 'updatePlayers', function( data ) {
  if ( data.length ) {
    players.innerHTML = '';
    data.forEach(function( player ) {
      players.innerHTML += '<li data-bluetooth="' + player.bluetooth + '">' + player.username + '</li>';
    });
  } else {
    players.innerHTML = '<li>Waiting for players</li>';
  }
});