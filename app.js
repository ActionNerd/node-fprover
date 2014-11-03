
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

// **************** Object used to keep track of the robot ****************
var deviceState = {
	'axes' : [0, 0, 0, 0],
	'buttons' : 	{
			'FACE_1' : 'button_up',
			'FACE_2' : 'button_up',
			'FACE_3' : 'button_up',
			'FACE_4' : 'button_up',
			'RIGHT_STICK' : 'button_up',
			'LEFT_STICK' : 'button_up',
			'START_FORWARD' : 'button_up',
			'SELECT_BACK' : 'button_up',
			'DPAD_DOWN' : 'button_up',
			'DPAD_UP' : 'button_up',
			'DPAD_LEFT' : 'button_up',
			'DPAD_RIGHT' : 'button_up',
			'RIGHT_TOP_SHOULDER' : 'button_up',
			'LEFT_TOP_SHOULDER' : 'button_up'
			},
	'gimbalLock' : false
}

// ********************* toPolar function **********************************
// ************* changes cartesian coordinates to polar coordinates ********

var toPolar = function(x, y) { // returns polar coordinates as an object (radians)
	var polarCoords = {};
	polarCoords.r = Math.sqrt(x * x + y * y);
	// atan2 provides CCW angle from the positive x axis; this blob normalizes that weirdness
	polarCoords.theta = Math.PI / 2 - Math.atan2(y, x);
	if ( polarCoords.theta < 0 ) {
		polarCoords.theta += 2 * Math.PI;
	}
	return polarCoords;
}

var toCartesian = function (theta, r) {
	var cartObj = {};
	cartObj.x = -1 * r * Math.cos(3.14159 * theta / 180);
	cartObj.y = r * Math.sin(3.14159 * theta / 180);
	return cartObj;
}

var moveCameraGimbal = function(x, y, servox, servoy) {
	servox.to(x);
 	servoy.to(y);
 	return;
}

// ********************** moveRobot function *******************************
// ************* major function which turns analog input from left stick ***
// ************* and turns it into differential steering commands **********

var moveRobot = function(x, y, motora, motorb) {
	var polarCoords = toPolar(x, y),
	    r = polarCoords.r,
	    theta = {},
	    motorPower,
	    phaseFactor;
	// motorPower determines how much power you will give your motors
	// .2 to 1 is the range of the left joystick which will cause the
	// motors to receive a signal.  50 is the PWM values at which
	// your motors will overcome the stall.
	motorPower = scale(r, .2, 1, 50, 255);
	theta.rad = polarCoords.theta;
	theta.deg = polarCoords.theta * 360 / (2 * Math.PI);
	phaseFactor = (Math.cos(theta.rad) * Math.cos(theta.rad));
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

// gimbalLock() goes hgere
//                        if (data.button == 'RIGHT_TOP_SHOULDER') {
 //                               deviceState.gimbalLock = !deviceState.gimbalLock;
//                                console.log("gimbalLock = " + deviceState.gimbalLock);
//                                if (!deviceState.gimbalLock) {
 //                                       moveCameraGimbal(0, 0);
  //                              }
  //                      }

var buttonChange = function(button, buttonStatus) {
	if (buttonStatus == 'button_down') {
                        switch (button) {
                                case 'FACE_1':
                                        deviceState['buttons']['FACE_1'] = 'button_down';
                                        break;
                                case 'FACE_2':
                                        deviceState['buttons']['FACE_2'] = 'button_down';
                                        break;
                                case 'FACE_3':
                                        deviceState['buttons']['FACE_3'] = 'button_down';
                                        break;
                                case 'FACE_4':
                                        deviceState['buttons']['FACE_4'] = 'button_down';
                                        break;
                                case 'RIGHT_STICK':
                                        deviceState['buttons']['RIGHT_STICK'] = 'button_down';
                                        break;
                                case 'LEFT_STICK':
                                        deviceState['buttons']['LEFT_STICK'] = 'button_down';
                                        break;
                                case 'START_FORWARD':
                                        deviceState['buttons']['START_FORWARD'] = 'button_down';
                                        break;
                                 case 'SELECT_BACK':
                                         deviceState['buttons']['SELECT_BACK'] = 'button_down';
                                         break;
                                 case 'DPAD_DOWN':
                                         deviceState['buttons']['DPAD_DOWN'] = 'button_down';
                                         break;
                                 case 'DPAD_UP':
                                         deviceState['buttons']['DPAD_UP'] = 'button_down';
                                         break;
                                 case 'DPAD_LEFT':
                                         deviceState['buttons']['DPAD_LEFT'] = 'button_down';
                                         break;
                                 case 'DPAD_RIGHT':
                                         deviceState['buttons']['DPAD_RIGHT'] = 'button_down';
                                         break;
                                 case 'RIGHT_TOP_SHOULDER':
                                         deviceState['buttons']['RIGHT_TOP_SHOULDER'] = 'button_down';
					 // gimbalLock();
                                         break;
                                 case 'LEFT_TOP_SHOULDER':
                                         deviceState['buttons']['LEFT_TOP_SHOULDER'] = 'button_down';
                                         break;
                                default:
                                        console.log("Looking forward to the Weekend");
                        }
		console.log("A button was pushed down...");
	}
	else if (buttonStatus == 'button_up') {
                         switch (button) {
                                 case 'FACE_1':
                                         deviceState['buttons']['FACE_1'] = 'button_up';
                                         break;
                                 case 'FACE_2':
                                         deviceState['buttons']['FACE_2'] = 'button_up';
                                         break;
                                 case 'FACE_3':
                                         deviceState['buttons']['FACE_3'] = 'button_up';
                                         break;
                                 case 'FACE_4':
                                         deviceState['buttons']['FACE_4'] = 'button_up';
                                         break;
                                 case 'RIGHT_STICK':
                                         deviceState['buttons']['RIGHT_STICK'] = 'button_up';
                                         break;
                                 case 'LEFT_STICK':
                                        deviceState['buttons']['LEFT_STICK'] = 'button_up';
                                         break;
                                 case 'START_FORWARD':
                                         deviceState['buttons']['START_FORWARD'] = 'button_up';
                                         break;
                                 case 'SELECT_BACK':
                                         deviceState['buttons']['SELECT_BACK'] = 'button_up';
                                         break;
                                 case 'DPAD_DOWN':
                                         deviceState['buttons']['DPAD_DOWN'] = 'button_up';
                                         break;
                                 case 'DPAD_UP':
                                         deviceState['buttons']['DPAD_UP'] = 'button_up';
                                         break;
                                 case 'DPAD_LEFT':
                                         deviceState['buttons']['DPAD_LEFT'] = 'button_up';
                                         break;
                                 case 'DPAD_RIGHT':
                                         deviceState['buttons']['DPAD_RIGHT'] = 'button_up';
                                         break;
                                 case 'RIGHT_TOP_SHOULDER':
                                         deviceState['buttons']['RIGHT_TOP_SHOULDER'] = 'button_up';
                                         break;
                                 case 'LEFT_TOP_SHOULDER':
                                         deviceState['buttons']['LEFT_TOP_SHOULDER'] = 'button_up';
                                         break;
                                 default:
                                         console.log("Error in updating button status to button_down...");
                        }
		console.log("A button was released...");
	}
	else {
		console.log("Something went wrong with buttonChange...");
	}
	return;
}

var mapRequest = function(servox, servoy, socket) {

console.log("In the mapRequest section...");
	// clickEvent(data);
	intervalCount = 0;
	var intObj = setInterval(function() {
		moveCameraGimbal(scale(intervalCount, 0, 180, 37, 135), 80, servox, servoy);
		console.log(pingDistance);
		if (pingDistance <= 200) { socket.emit('mapPoint', toCartesian(intervalCount, pingDistance)); }
		intervalCount++;
		if (intervalCount > 180) {
			clearInterval(intObj);
			console.log("deviceState.axes[3] -- the y axis on the servo -- is " + deviceState.axes[3]);
			moveCameraGimbal(scale(deviceState.axes[2], -1, 1, 37, 135), scale(deviceState.axes[3], -1, 1, 40, 115), servox, servoy);
		}
	}, 400);
}

board.on("ready", function() {

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

	    // Declare ultrasonic ping sensor: HC-SR04 attached on pin 4
	    ping = new five.Ping({
                pin: 4,
		freq: 200
            });

	// ****************** place REPL declarations here as needed **************
	this.repl.inject({
                motora: new five.Motor([3, 12])
        });


	// *************** Listen to board sensors events here ********************
 	ping.on("data", function() {
                // console.log("Object is " + this.cm + " cm away");
                pingDistance = this.cm;
        });

	// ************ Listen for browser events here ****************************
	io.sockets.on('connection', function (socket) {
		socket.on('button_down', function(data) {
			buttonChange (data.button, 'button_down'); 
		});
		socket.on('button_up', function(data) {
			buttonChange (data.button, 'button_up');
		});
		socket.on('axis_change', function(data) {
		        if ((data.stick == 'RIGHT_STICK') && (!deviceState.gimbalLock)) {
				// axisChange('RIGHT_STICK', data.X, data.Y, servox, servoy, motora, motorb);	
                		deviceState.axes[2] = data.X;
		                deviceState.axes[3] = data.Y;
                		moveCameraGimbal(scale(data.X, -1, 1, 37, 135), scale(data.Y, -1, 1, 40, 115), servox, servoy);
        		}
		        if (data.stick == 'LEFT_STICK') {
                		deviceState.axes[0] = data.X;
                		deviceState.axes[1] = data.Y;
                		moveRobot(data.X, -1 * data.Y, motora, motorb);
        		}
         	});
		// This needs to be modified to a generic browserButton event which carries 'mapRequest' in the associated object
		socket.on('mapRequest', function(data) { 
			mapRequest(servox, servoy, socket);
		});
	});
});
