
var express = require('express');
var app = express();
var io = require('socket.io');
var five = require("johnny-five"),
    board = new five.Board({ port: "/dev/ttyAMA0" });
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var rStickXtrans,
    rStickYtrans,
	ySlope,
	xSlope;

// Start express server, serving up static files in the RPi public folder
app.use(express.static(__dirname + '/public'));
server.listen(3000);
console.log("Listening on Port 3000...");

// Initialize the connection between the node app and the arduino (firmata sketch)
// Note explicit device path up above "ttyAMA0"; this is for the GPIO serial connection
board.on("ready", function() {

	// **** declare pin objects
    // The "pin" portion is just a simple way to test connectivity.
	// I connected a LED to pin 12 to make sure I had good comms
	// between RPi and Arduino.  Hitting FACE_3 on the controller
	// illuminates the LED.
	var pin = new five.Pin(12);
	
	// **** declare servo objects
	// Initialize the two johnny-five servo instances I'm using.
	// servox is for the "theta" movement -- the left / right on the camera gimbal.
	// servoy is for the "phi" movement -- the up / down on the camera gimbal.
	var servox = new five.Servo({
          pin: 9,
          center: true
    });
	var servoy = new five.Servo({
		pin: 10,
		center: true
	});
	
	// **** SOCKETS SOCKETS SOCKETS SOCKETS SOCKETS ****
	io.sockets.on('connection', function (socket) {
		// **** BUTTONS ****
		// **** Go to function which handles button pushes
		
		socket.on('button_down', function(data) {
			console.log(data);
		});
		
		socket.on('axis_change', function(data) {

			// **** RIGHT STICK ****
			// **** Go to function which handles camera gimbal movement
			if (data.stick == 'RIGHT_STICK') {
				rStickXtrans = Math.round(90 * data.X + 90);
				rStickYtrans = Math.round(90 * data.Y + 90);
				console.log(data.stick + " X-Pos: " + rStickXtrans + "; Y-Pos: " + rStickYtrans); 
				servox.to(rStickXtrans);
				servoy.to(rStickYtrans);
			}
			// **** LEFT STICK ****
			// **** Go to function which handles camera gimbal movement
			// For the near future -- waiting on motors, chassis, and motorshield
		}); 
	});
});

