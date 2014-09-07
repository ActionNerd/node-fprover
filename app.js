
var express = require('express'),
    app = express(),
    io = require('socket.io'),
    five = require("johnny-five"),
    board = new five.Board({ port: "/dev/ttyAMA0" }),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    scale = five.Fn.scale;

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
	// ****************** place REPL declarations here *************************
	this.repl.inject({
                motora: new five.Motor([3, 12])
        });

	// ********************* toPolar function **********************************
	// ************* changes cartesian coordinates to polar coordinates ********

	 function toPolar(x, y) { // returns polar coordinates as an object (radians)
		var polarCoords = {};
		polarCoords.r = Math.sqrt(x * x + y * y);
		// atan2 provides CCW angle from the positive x axis; this blob normalizes that weirdness
		polarCoords.theta = Math.PI / 2 - Math.atan2(y, x);
		if ( polarCoords.theta < 0 ) { 
			polarCoords.theta += 2 * Math.PI;
		}
		return polarCoords;
	}

	// ********************* moveCameraGimbal function ************************
	// ************* major function which takes analog input from right stick *
	// ************* and turns it into 2-axis camera gimbal commands **********
	var moveCameraGimbal = function(x, y) {
		return;
	}

	// ********************** moveRobot function *******************************
	// ************* major function which turns analog input from left stick ***
	// ************* and turns it into differential steering commands **********
	var moveRobot = function(x, y) {

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
	
	// **** SOCKETS SOCKETS SOCKETS SOCKETS SOCKETS ****************************
	// **** program "loop" below ***********************************************
	io.sockets.on('connection', function (socket) {
		socket.on('axis_change', function(data) {
			// **** RIGHT STICK ****
			if (data.stick == 'RIGHT_STICK') {
				moveCameraGimbal(data.X, data.Y);	
			}
      			// **** LEFT STICK ****
                        if (data.stick == 'LEFT_STICK') {
				moveRobot(data.X, data.Y);
                        }
         	}); 
	});
});
