// ******************* REQUIRES ***********
var express = require('express'),
    app = express(),
    five = require("johnny-five"),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    fpr = require("./fpr.js");


var scale = five.Fn.scale; // Useful johnny-five y = mx + b calculator
var board = new five.Board({ port: "/dev/ttyACM0" }); // Instantiates new J5 board

app.use(express.static(__dirname + '/public'));
server.listen(3000);
console.log("Listening on Port 3000...");

board.on("ready", function() {

	// Declare motors
	var motora = new five.Motor([3, 12]),
            motorb = new five.Motor([11, 13]);

	// Declare servos
	var servox = new five.Servo({
                pin: 10,
		range: [37, 135]
            }),
            servoy = new five.Servo({
		pin: 5,
		range: [40, 115]
	    });

	// ****************** place REPL declarations here as needed **************
	this.repl.inject({
                motora: new five.Motor([3, 12])
        });

	// *************** Listen to board sensors events here ********************



	// ************ Listen for browser events here ****************************
	io.sockets.on('connection', function (socket) {
		socket.on('button_down', function(data) {
			console.log("Button down...");
			fpr.buttonChange (data.button, 'button_down');
		});
		socket.on('button_up', function(data) {
			console.log("Button up...");
			fpr.buttonChange (data.button, 'button_up');
		});
		socket.on('axis_change', function(data) {
		        if ((data.stick == 'RIGHT_STICK')) {  // add this to the conditional: && !fpr.getState("gimbalLock")
				console.log(data.stick, data.X, data.Y);
				servox.to(scale(data.X, -1, 1, 37, 135));  // I can change this to moveGimbal
				servoy.to(scale(data.Y, -1, 1, 40, 115));
        		}
		        if (data.stick == 'LEFT_STICK') {
                		fpr.moveRobot(data.X, -1 * data.Y, motora, motorb);
        		}
         	});
	});
});
