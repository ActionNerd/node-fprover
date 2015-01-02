var utils = require("./an_utils.js"),
    five = require("johnny-five");

var scale = five.Fn.scale;

var deviceState = {
        'axes' : [0, 0, 0, 0],
        'buttons' :     {
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





function fpr() {

}

fpr.moveCameraGimbal = function(x, y, servox, servoy) {
        servox.to(x);
        servoy.to(y);
        return;
}



fpr.buttonChange = function(button, buttonStatus) {
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





// ********************** moveRobot function *******************************
// ************* major function which turns analog input from left stick ***
// ************* and turns it into differential steering commands **********

fpr.moveRobot = function(x, y, motora, motorb) {
        var polarCoords = utils.toPolar(x, y),
            r = polarCoords.r,
            theta = {},
            motorPower,  // Value from 0-255 to feed to motor commands
            phaseFactor;
        // motorPower determines how much power you will give your motors
        // .2 to 1 is the range of the left joystick which will cause the
        // motors to receive a signal.  50 is the PWM values at which
        // your motors will overcome the stall.
        if (r > 1) {    // This is needed because the two potentiometers 
                r = 1;  // in the left joystick form a square pattern,
        }               // and we want to replicate a circular joystick pattern
        motorPower = scale(r, .2, 1, 50, 255);
        theta.rad = polarCoords.theta;
        theta.deg = polarCoords.theta * 360 / (2 * Math.PI);
        phaseFactor = (Math.cos(theta.rad) * Math.cos(theta.rad));
	console.log(motorPower);
        if (r < .2) {
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

module.exports = fpr;

