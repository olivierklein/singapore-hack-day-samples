var servoModule = require("jsupm_servo");
//Instantiate ES08A Servo module on GPIO 5
var servo = new servoModule.ES08A(5);


function startServo(timeOffset, timeInterval, angle)
{
    setTimeout(function()
    {
        setInterval(function()
        {
            servo.setAngle(angle);
            console.log("Set angle to " + angle);
        }, timeInterval);
    }, timeOffset);
}
// start immediately, run every 3 seconds, go 0 degrees
startServo(0, 3000, 0);
// start in 1 second, run every 3 seconds, go 90 degrees
startServo(1000, 3000, 90);
// start in 2 seconds, run every 3 seconds, go 180 degrees
startServo(2000, 3000, 180);

// Print message when exiting
process.on('SIGINT', function()
{
	console.log("Exiting...");
	process.exit(0);
});
