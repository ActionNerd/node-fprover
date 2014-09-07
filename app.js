
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
	xSlope,
	yInt,
	xInt,
	xTemp,
	yTemp;

var scale = five.Fn.scale;

//  ** Need to do this
// Add scaling function from issue thread
// servox.to(scale(data.X, -1, 1, 30, 150));
// servoy.to(scale(data.Y, -1, 1, 30, 150));
// Start express server, serving up static files in the RPi public folder
app.use(express.static(__dirname + '/public'));
server.listen(3000);
console.log("Listening on Port 3000...");

// Initialize the connection between the node app and the arduino (firmata sketch)
// Note explicit device path up above "ttyAMA0"; this is for the GPIO serial connection
board.on("ready", function() {

	// **** declare servo objects
	// Initialize the two johnny-five servo instances I'm using.
	// servox is for the "theta" movement -- the left / right on the camera gimbal.
	// servoy is for the "phi" movement -- the up / down on the camera gimbal.
        var motora = new five.Motor([3, 12]); 
        var motorb = new five.Motor([11, 13]);
	var servox = new five.Servo({
                pin: 9,
		range: [37, 135]
        });
	
        var servoy = new five.Servo({
		pin: 10,
		range: [40, 115]
	});
	this.repl.inject({
                motora: new five.Motor([3, 12])
        });

	var moveRobot = function(x, y) {
	        console.log("Inside moveRobot function...");
        	console.log("Passed X is " + x + ".  Passed Y is " + y + ".");

        	if (Math.abs(x) > .5) {
                	if (x > 0.5) {
                        	// Right Twist
                        	motora.forward(scale(x, 0.5, 1, 90, 255));
                        	motorb.reverse(scale(x, 0.5, 1, 90, 255));
                	}
                	if (x < -0.5) {
                		// Left Twist
                        	motora.reverse(scale(x, -0.5, -1, 90, 255));
                        	motorb.forward(scale(x, -0.5, -1, 90, 255));
                	}

            	}
                	else {
                    	if (Math.abs(y) < 0.06) {
                        	motora.stop();
                        	motorb.stop();
                    	}
                    		else {
                        		if (y < -0.06) {
                            			motora.forward(scale(y, 0, -1, 90, 255));
                           	 		motorb.forward(scale(y, 0, -1, 90, 255));
                        		}	
                                        if (y > 0.06) {
                                    		motora.reverse(scale(y, 0, 1, 90, 255));
                                         	motorb.reverse(scale(y, 0, 1, 90, 255));
                                        }
                            	}
                	}

		return;
	}


	ySlope = (servoy.range[1] - servoy.range[0])/2;
	yInt = servoy.range[1] - ySlope;
	
	xSlope = (servox.range[1] - servox.range[0])/2;
	xInt = servox.range[1] - xSlope;
	
	// console.log("y-servo slope = " + ySlope + "; y-servo intercept is = " + yInt);
	// console.log("x-servo slope = " + xSlope + "; x-servo intercept is = " + xInt);
	// console.log(data.stick + " X-Pos: " + data.X + "->" + rStickXtrans + "; Y-Pos: " + data.Y + "->" + rStickYtrans);
	
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
				rStickXtrans = Math.round(xSlope * data.X + xInt);
				rStickYtrans = Math.round(ySlope * data.Y + yInt);
				console.log(data.stick + " X-Pos: " + rStickXtrans + "; Y-Pos: " + rStickYtrans); 
				servox.to(rStickXtrans);
				servoy.to(rStickYtrans);
			}
      			// **** LEFT STICK ****
                        if (data.stick == 'LEFT_STICK') {
				moveRobot(data.X, data.Y);
                        }
	

         	}); 
	});
});
