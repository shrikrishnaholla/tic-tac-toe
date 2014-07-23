TicTacToe = function() {
  this.wait = false,
  this.player_grid = [
              [[false, false, false], [false, false, false], [false, false, false]],
              [[false, false, false], [false, false, false], [false, false, false]]
              ]
};

miniJQuery = function() {
  this.select = function(string) {
    return document.querySelector(string);
  };

  this.selectAll = function(string) {
    return document.querySelectorAll(string);
  };

  this.allWithClass = function(string) {
    return document.getElementsByClassName(string);
  };

  this.elWithID = function(string) {
    return document.getElementById(string);
  };

  this.allWithTag = function(string) {
    return document.getElementsByTagName(string);
  };
};

$ = new miniJQuery();

TicTacToe.prototype.init = function() {
  this.initializeSocket();
  var socket = this.socket;
  var ttt_block = $.allWithClass('block');
  var self = this;
  for (var i = ttt_block.length - 1; i >= 0; i--) {
    ttt_block[i].onclick = function(e) {
      var wait = self.wait;
      var targetCanvas = e.target;
      var el = this;
      var row = parseInt(this.getAttribute('ttt-row'));
      var col = parseInt(this.getAttribute('ttt-col'));
      var turn = $.elWithID('turn');
      var player = parseInt(turn.getAttribute('player'));
      var drawn = el.getAttribute('drawn') === 'true';
      if (!drawn && !wait) {
        self.wait = true;
        socket.emit('move', { player: player, row: row, col: col });

        self.draw(self, targetCanvas, player, el, row, col, self.drawingHelper);
      } else if (wait) {
        self.warn("Other player's turn!");
      } else {
        self.warn("That tile is already drawn on!");
      }
    };
  };
};

TicTacToe.prototype.warn = function(warning_msg) {
  $.select('div.warning').innerHTML = $.select('div.warning').innerHTML + warning_msg +
    '<br>This message will autodestruct<br>';
  setTimeout(function() { $.select('div.warning').innerHTML = ''; }, 5000);
};

TicTacToe.prototype.result = function(result_message, timeout, callback) {
  $.select('div.result').innerHTML = result_message;
  if (typeof timeout === 'function') {
    callback = timeout;
    callback();
  } else {
    setTimeout(callback, timeout);
  }
};

TicTacToe.prototype.initializeSocket = function() {
  this.socket = io();
  var self = this;
  var socket = this.socket;


  // Handle socket.io events
  socket.on('connect', function() {
    var location_parts = location.href.split('/')
    socket.emit('roomname', location_parts[location_parts.length -1]);
  });

  socket.on('reconnect', function() {
    var location_parts = location.href.split('/')
    socket.emit('roomname', location_parts[location_parts.length -1]);
  });

  socket.on('left', function() {
    self.result('Seems like the other player left. Restarting game', 5000, self.reset_grid());
  });

  socket.on('move', function(data) {
    var wait = self.wait;
    var player = data.player;
    var row = data.row;
    var col = data.col;
    var blocks = $.selectAll('div.block');
    var drawn_block = blocks[row*3 + col];
    var targetCanvas = drawn_block.firstElementChild;
    var turn = $.elWithID('turn');
    if (drawn_block.getAttribute('drawn') === 'true' && !wait) {alert('Breakdown!')}; // Check error. Should never execute

    self.wait = false;
    self.draw(self, targetCanvas, player, drawn_block, row, col, self.drawingHelper);
  });
};

TicTacToe.prototype.isDrawn = function() {
  var blocks = $.allWithClass('block');
  for (var i = blocks.length - 1; i >= 0; i--) {
    if(blocks[i].getAttribute('drawn') !== 'true') return false;
  };
  return true;
}

TicTacToe.prototype.draw = function(self, canvas, player, block, row, col, callback) {
  // var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');
  
  switch(player) {
    case 0 : 
      var centerX = canvas.width / 2;
      var centerY = canvas.height / 2;
      var radius = (canvas.width / 2) - 5;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      context.lineWidth = 1;
      context.strokeStyle = '#000000';
      context.stroke();
      break;
    case 1:
      context.beginPath();
      context.moveTo(5, 5);
      context.lineTo(canvas.width - 5, canvas.height - 5);
      context.stroke();
      context.beginPath();
      context.moveTo(canvas.width - 5, 5);
      context.lineTo(5, canvas.height - 5);
      context.stroke();
      break;
  }

  callback(self, player, block, row, col);
}

TicTacToe.prototype.drawingHelper = function(self, player, el, row, col) {
  var turn = $.elWithID('turn');
  var new_player = player===0?1:0;
  turn.setAttribute('player', new_player.toString());
  turn.innerHTML=(new_player + 1).toString();
  el.setAttribute('drawn', true);

  self.player_grid[player][row][col] = true;
  if (self.isWinner(player)) {
    self.result('Player ' + (player + 1).toString() + ' wins!<br>Restarting the game', 3000, self.reset_grid);
  } else if (self.isDrawn()) {
    self.result('Looks like the game is drawn.<br>Restarting', 3000, self.reset_grid);
  }
}

TicTacToe.prototype.isWinner = function(player) {
  var player_matrix = this.player_grid[player];

  if (player_matrix[0][0] && player_matrix[0][1] && player_matrix[0][2] ||
      player_matrix[1][0] && player_matrix[1][1] && player_matrix[1][2] ||
      player_matrix[2][0] && player_matrix[2][1] && player_matrix[2][2] ||
      player_matrix[0][0] && player_matrix[1][0] && player_matrix[2][0] ||
      player_matrix[0][1] && player_matrix[1][1] && player_matrix[2][1] ||
      player_matrix[0][2] && player_matrix[1][2] && player_matrix[2][2] ||
      player_matrix[0][0] && player_matrix[1][1] && player_matrix[2][2] ||
      player_matrix[0][2] && player_matrix[1][1] && player_matrix[2][0]   ) { return true; } else { return false};
}

TicTacToe.prototype.reset_grid = function() {
  var canvasses = $.allWithTag('canvas');
  var turn = $.elWithID('turn');
  for (var i = canvasses.length - 1; i >= 0; i--) {
    canvasses[i].width = canvasses[i].width; // Clears canvas
  };

  turn.setAttribute('player', "0");
  turn.innerHTML = "1";

  var blocks = $.allWithClass('block');
  for (var i = blocks.length - 1; i >= 0; i--) {
    blocks[i].setAttribute('drawn', false);
  };

  this.player_grid = [
    [[false, false, false], [false, false, false], [false, false, false]],
    [[false, false, false], [false, false, false], [false, false, false]]
  ];

  $.select('div.result').innerHTML = '';
}


window.onload = function() {
  ttt = new TicTacToe();
  ttt.init();
};
