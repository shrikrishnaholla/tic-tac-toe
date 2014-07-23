var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.get('/', function(req, res) {
  res.redirect('/' + Math.random().toString(36).substr(2, 5)); // Create a new room
})

app.get(/\/[a-zA-Z0-9]+$/, function(req, res){
  res.sendfile('public/index.html');
});

io.on('connection', function(socket){

  socket.on('roomname', function(roomname) {
    socket.join(roomname);
    socket.roomname = roomname;
  });

  socket.on('move', function(data) {
    socket.broadcast.to(socket.roomname).emit('move', data);
  });

  socket.on('disconnect', function(reason){
    console.log('user disconnected because ' + reason);
    socket.broadcast.to(socket.roomname).emit('left');
  });
});

app.use(express.static(path.join(__dirname, 'public')));

http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:' + (process.env.PORT || 3000));
});
