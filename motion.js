var mraa = require('mraa'); //require mraa

var sensor = new mraa.Gpio(7); //setup digital read on Digital pin #6 (D6)
sensor.dir(mraa.DIR_IN); //set the gpio direction to input

readMotionSensor();

// Period function to run every second and read the sensor vlaue.
function readMotionSensor() {
    var sensorValue = sensor.read(); //read the digital value of the Grove PIR Motion Sensor
    console.log(sensorValue);
    if (sensorValue == 1) {
        console.log("Motion detected");
    }
    setTimeout(readMotionSensor, 1000);
}
