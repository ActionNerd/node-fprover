var express = require('express');
var app = express();
var io = require('socket.io');

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/public'));

server.listen(3000);

console.log("Listening on Port 3000...");

// Sockets experimentation
io.sockets.on('connection', function (socket) {
	socket.emit('news', { hello: 'world' });
	socket.on('my other event', function (data) {
		console.log(data);
	});
	socket.on('button_down', function(data) {
		console.log(data);
	});
	socket.on('axis_change', function(data) {
		console.log(data); 
	});
	
});