
var express = require('express'),
    app = express(),
    // future use
    //  gm = require('gm').subClass({ imageMagick: true }),
    io = require('socket.io'),
    five = require("johnny-five"),
    board = new five.Board({ port: "/dev/ttyACM0" }),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    scale = five.Fn.scale,
    pingDistance = 0;

app.use(express.static(__dirname + '/public'));
server.listen(3000);
console.log("Listening on Port 3000...");


var deviceState = {
	'axes' : [0, 0, 0, 0],
	'buttons' : 	{
			'FACE_1' : false,
			'FACE_2' : false,
			'FACE_3' : false,
			'FACE_4' : false,
			'RIGHT_STICK' : false,
			'LEFT_STICK' : false,
			'START_FORWARD' : false,
			'SELECT_BACK' : false,
			'DPAD_DOWN' : false,
			'DPAD_UP' : false,
			'DPAD_LEFT' : false,
			'DPAD_RIGHT' : false,
			'RIGHT_TOP_SHOULDER' : false,
			'LEFT_TOP_SHOULDER' : false
			},
	'gimbalLock' : false
}


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

	    ping = new five.Ping({
                pin: 4,
		freq: 200
            });
	// ****************** place REPL declarations here *************************
	this.repl.inject({
                motora: new five.Motor([3, 12])
        });

 	ping.on("data", function() {
                // console.log("Object is " + this.cm + " cm away");
                pingDistance = this.cm;
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

	function toCartesian(theta, r) {
		var cartObj = {};
		cartObj.x = -1 * r * Math.cos(3.14159 * theta / 180);
		cartObj.y = r * Math.sin(3.14159 * theta / 180);
		return cartObj;
	}

	// ********************* moveCameraGimbal function ************************
	// ************* major function which takes analog input from right stick *
	// ************* and turns it into 2-axis camera gimbal commands **********
	var moveCameraGimbal = function(x, y) {
		servox.to(x);
		servoy.to(y);
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
		// console.log('theta.deg = ' + theta.deg);
		// console.log('theta.rad = ' + theta.rad);
	        // console.log('phaseFactor = ' + phaseFactor);
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

			switch (data.button) {
    				case 'FACE_1':
 					deviceState['buttons']['FACE_1'] = true;
        				break; 
	    			case 'FACE_2':
					deviceState['buttons']['FACE_2'] = true;
        				break;
				case 'FACE_3': 
                                	deviceState['buttons']['FACE_3'] = true;
	                                break;
				case 'FACE_4':
                	                deviceState['buttons']['FACE_4'] = true;
                        	        break;
				case 'RIGHT_STICK':
        	                        deviceState['buttons']['RIGHT_STICK'] = true;
                	                break;
				case 'LEFT_STICK':
	                                deviceState['buttons']['LEFT_STICK'] = true;
        	                        break;
				case 'START_FORWARD':
                        	        deviceState['buttons']['START_FORWARD'] = true;
                                	break;
                                 case 'SELECT_BACK':
                                         deviceState['buttons']['SELECT_BACK'] = true;
                                         break;
                                 case 'DPAD_DOWN':
                                         deviceState['buttons']['DPAD_DOWN'] = true;
                                         break;
                                 case 'DPAD_UP':
                                         deviceState['buttons']['DPAD_UP'] = true;
                                         break;
                                 case 'DPAD_LEFT':
                                         deviceState['buttons']['DPAD_LEFT'] = true;
                                         break;
                                 case 'DPAD_RIGHT':
                                         deviceState['buttons']['DPAD_RIGHT'] = true;
                                         break;
                                 case 'RIGHT_TOP_SHOULDER':
                                         deviceState['buttons']['RIGHT_TOP_SHOULDER'] = true;
                                         break;
                                 case 'LEFT_TOP_SHOULDER':
                                         deviceState['buttons']['LEFT_TOP_SHOULDER'] = true;
                                         break;
	    			default: 
        				console.log("Looking forward to the Weekend");
			}

			if (data.button == 'RIGHT_TOP_SHOULDER') {
				deviceState.gimbalLock = !deviceState.gimbalLock;
				console.log("gimbalLock = " + deviceState.gimbalLock);
				if (!deviceState.gimbalLock) {
					moveCameraGimbal(0, 0);
				}
			}
		});

		socket.on('button_up', function(data) {
                         switch (data.button) {
                                 case 'FACE_1':
                                         deviceState['buttons']['FACE_1'] = false;
                                         break;
                                 case 'FACE_2':
                                         deviceState['buttons']['FACE_2'] = false;
                                         break;
                                 case 'FACE_3':
                                         deviceState['buttons']['FACE_3'] = false;
                                         break;
                                 case 'FACE_4':
                                         deviceState['buttons']['FACE_4'] = false;
                                         break;
                                 case 'RIGHT_STICK':
                                         deviceState['buttons']['RIGHT_STICK'] = false;
                                         break;
                                 case 'LEFT_STICK':
                                        deviceState['buttons']['LEFT_STICK'] = false;
                                         break;
                                 case 'START_FORWARD':
                                         deviceState['buttons']['START_FORWARD'] = false;
                                         break;
                                 case 'SELECT_BACK':
                                         deviceState['buttons']['SELECT_BACK'] = false;
                                         break;
                                 case 'DPAD_DOWN':
                                         deviceState['buttons']['DPAD_DOWN'] = false;
                                         break;
                                 case 'DPAD_UP':
                                         deviceState['buttons']['DPAD_UP'] = false;
                                         break;
                                 case 'DPAD_LEFT':
                                         deviceState['buttons']['DPAD_LEFT'] = false;
                                         break;
                                 case 'DPAD_RIGHT':
                                         deviceState['buttons']['DPAD_RIGHT'] = false;
                                         break;
                                 case 'RIGHT_TOP_SHOULDER':
                                         deviceState['buttons']['RIGHT_TOP_SHOULDER'] = false;
                                         break;
                                 case 'LEFT_TOP_SHOULDER':
                                         deviceState['buttons']['LEFT_TOP_SHOULDER'] = false;
                                         break;
                                 default:
                                         console.log("Looking forward to the Weekend");
			}
		});

		socket.on('axis_change', function(data) {

			// **** RIGHT STICK ****
			if ((data.stick == 'RIGHT_STICK') && (!deviceState.gimbalLock)) {
				console.log(data);
				// deviceState.axes[2] = data.X;
				//deviceState.axes[3] = data.Y;
				// console.log("Device state axes 2 + 3 " + deviceState[2], deviceState[3]);
				deviceState.axes[2] = data.X;
				deviceState.axes[3] = data.Y;
				console.log("Data being stored in deviceState object", data.X, data.Y);
				moveCameraGimbal(scale(data.X, -1, 1, 37, 135), scale(data.Y, -1, 1, 40, 115));	
			}
      			// **** LEFT STICK ****
                        if (data.stick == 'LEFT_STICK') {
				// deviceState.axes[0] = data.X;
				// deviceState.axes[1] = data.Y;
				moveRobot(data.X, -1 * data.Y);
                        }
         	});
		socket.on('mapRequest', function(data) { 
			// Need to move this into its own function
			console.log("In the mapRequest section...");
			intervalCount = 0;
			var intObj = setInterval(function() {
				moveCameraGimbal(scale(intervalCount, 0, 180, 37, 135), 80);
				console.log(pingDistance);
				if (pingDistance <= 200) { socket.emit('mapPoint', toCartesian(intervalCount, pingDistance)); }
				intervalCount++;
				if (intervalCount > 180) {
					clearInterval(intObj);
					}
				}
				, 400);
			});
	});
});
