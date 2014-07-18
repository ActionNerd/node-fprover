
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

// Initialize and work with open sockets
io.sockets.on('connection', function (socket) {

        // Emits a hello world to client with open socket
        // to the console	
        socket.emit('news', { hello: 'world' });
	socket.on('my other event', function (data) {
		console.log(data);
	});
        // Listens for button_down and axis_change events
        // then logs them
	socket.on('button_down', function(data) {
		console.log(data);
	});
	socket.on('axis_change', function(data) {
		console.log(data); 
	});
	
});
// **************************** Requires *********************************
// Checking to see if this will do anything
var express = require('express');
var app = express();
var io = require('socket.io');
var five = require("johnny-five"),
    board = new five.Board({ port: "/dev/ttyAMA0" });
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var rStickXtrans = 90,
    rStickYtrans = 90;
var pinVal = 0;


// Start express server, serving up static files in the RPi public folder
app.use(express.static(__dirname + '/public'));

server.listen(3000);

console.log("Listening on Port 3000...");


// five.Board().on("ready", function() {
board.on("ready", function() {
	var pin = new five.Pin(12);
	var servox = new five.Servo({
          pin: 9,
          center: true,
          range: [30, 150]
        });
        var servoy = new five.Servo({
          pin: 10,
          center: true,
          range: [30, 150]
        });

	// Initialize and work with open sockets
	io.sockets.on('connection', function (socket) {
		// Emits a hello world to client with open socket to the console
                //servo.to(rStickXtrans);
		socket.emit('news', { hello: 'world' });
		socket.on('my other event', function (data) {
			console.log(data);
		});
			// Listens for button_down and axis_change events
			// then logs them
		socket.on('button_down', function(data) {
			console.log(data);
			console.log(data.button);
			if (data.button == 'FACE_3') {
				if (pinVal == 0) {
					console.log("Inside the conditional...");
					pin.high();
					pinVal = 1;
				//	servo.to(90);
				}
				else {
					pin.low();
					pinVal = 0;
				//	servo.to(0);
				}
				
				
			}
		});
		socket.on('axis_change', function(data) {
			console.log(data);
			rStickXtrans = 90 * data.X + 90; 
			rStickXtrans = Math.round(rStickXtrans);
			if (data.stick == 'RIGHT_STICK') {
				console.log("X-axis data of " + data.X + " equals a degree value of " + rStickXtrans);
                                servox.to(rStickXtrans);
                                
				
			}

                        rStickYtrans = 90 * data.Y + 90;
                        rStickYtrans = Math.round(rStickYtrans);
                        if (data.stick == 'RIGHT_STICK') {
                                console.log("Y-axis data of " + data.Y + " equals a degree value of " + rStickYtrans);
                                servoy.to(rStickYtrans);

                        }

		}); 
	});
});
