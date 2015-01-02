function AN_utils() {

}

AN_utils.logSomething = function(something){
        console.log(something);
        return;
}

AN_utils.toPolar = function(x, y) { // returns polar coordinates as an object (radians)
        var polarCoords = {};
        polarCoords.r = Math.sqrt(x * x + y * y);
        // atan2 provides CCW angle from the positive x axis; this piece normalizes it
        polarCoords.theta = Math.PI / 2 - Math.atan2(y, x);
        if ( polarCoords.theta < 0 ) {
                polarCoords.theta += 2 * Math.PI;
        }
        return polarCoords;
}

AN_utils.toCartesian = function (theta, r) {
        var cartObj = {};
        cartObj.x = -1 * r * Math.cos(3.14159 * theta / 180);
        cartObj.y = r * Math.sin(3.14159 * theta / 180);
        return cartObj;
}

module.exports = AN_utils;

