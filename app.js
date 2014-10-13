
var express = require('express'),
    app = express(),
    io = require('socket.io'),
    five = require("johnny-five"),
    board = new five.Board({ port: "/dev/ttyACM0" }),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    scale = five.Fn.scale,
    gimbalLock = false;

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
        var // Declarations

	    // Declare motors
	    motora = new five.Motor([3, 12]),
            motorb = new five.Motor([11, 13]),

	    // Declare servos
	    servox = new five.Servo({
                pin: 10,
		range: [37, 135]
            }),

            servoy = new five.Servo({
		pin: 5,
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
		servox.to(scale(x, -1, 1, 37, 135));
		servoy.to(scale(y, -1, 1, 40, 115));
		return;
	}

	// ********************** moveRobot function *******************************
	// ************* major function which turns analog input from left stick ***
	// ************* and turns it into differential steering commands **********
	var moveRobot = function(x, y) {

		var polarCoords = toPolar(x, y),
		    r = polarCoords.r,
	            theta = {},
	            motorPower,
	            phaseFactor;
		motorPower = scale(r, .3, 1, 70, 255); 
		theta.rad = polarCoords.theta;
		theta.deg = polarCoords.theta * 360 / (2 * Math.PI);
        	phaseFactor = (Math.cos(theta.rad) * Math.cos(theta.rad));
		console.log('theta.deg = ' + theta.deg);
		console.log('theta.rad = ' + theta.rad);
	        console.log('phaseFactor = ' + phaseFactor);
		if (r > 1) {
			r = 1;
		}
		if (r < .3) {
			motora.stop();
			motorb.stop();
		}

		else {	
			if (theta.deg >= 0 && theta.deg < 90) {
				// Quadrant 1: left motor lead (fwd), right motor lag
				motora.forward(motorPower);
				if (Math.cos(2 * theta.rad) < 0) {
					motorb.reverse(motorPower * Math.abs(Math.cos(2 * theta.rad)));
				}
				else {
					motorb.forward(motorPower * Math.abs(Math.cos(2 * theta.rad)));
				}
			}
			else if (theta.deg >= 90 && theta.deg < 180) {
				// Quadrant 2: right motor lead (rev), left motor lag
				motorb.reverse(motorPower);
				if (Math.cos(2 * theta.rad) < 0) {
					motora.forward(motorPower * Math.abs(Math.cos(2 * theta.rad)));
        	  		}
				else { 
        	      			motora.reverse(motorPower * Math.abs(Math.cos(2 * theta.rad)));
				}	
			}
			else if (theta.deg >=180 && theta.deg < 270) {
				// Quadrant 3: left motor lead (rev), right motor lag
				motora.reverse(motorPower);
				if (Math.cos(2 * theta.rad) < 0) {
					motorb.forward(motorPower * Math.abs(Math.cos(2 * theta.rad)));
				}	
				else {
					motorb.reverse(motorPower * Math.abs(Math.cos(2 * theta.rad)));
				}
			}
			else if (theta.deg >=270) {
				// Quadrant 4: right motor lead (fwd), left motor lag
				motorb.forward(motorPower);
				if (Math.cos(2 * theta.rad) < 0) {
					motora.reverse(motorPower * Math.abs(Math.cos(2 * theta.rad)));
				}
				else {
					motora.forward(motorPower * Math.abs(Math.cos(2 * theta.rad)));
				}	
			}

		}
		return;
	}
	
	// **** SOCKETS SOCKETS SOCKETS SOCKETS SOCKETS ****************************
	// **** program "loop" below ***********************************************
	io.sockets.on('connection', function (socket) {
		socket.on('button_down', function(data) {
			if (data.button == 'RIGHT_TOP_SHOULDER') {
				gimbalLock = !gimbalLock;
				console.log("gimbalLock = " + gimbalLock);
				if (!gimbalLock) {
					// ToDo: figure out how to force a axis change
				}
			}
		});

		socket.on('axis_change', function(data) {

			// **** RIGHT STICK ****
			if ((data.stick == 'RIGHT_STICK') && (!gimbalLock)) {
				moveCameraGimbal(data.X, data.Y);	
			}
      			// **** LEFT STICK ****
                        if (data.stick == 'LEFT_STICK') {
				moveRobot(data.X, -1 * data.Y);
                        }
         	}); 
	});
});
