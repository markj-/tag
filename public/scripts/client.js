var socket = io.connect('http://localhost');

var button = document.querySelector('button');

button.addEventListener('click', function() {
  console.log('it');
  socket.emit('it');
});