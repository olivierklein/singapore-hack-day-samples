var groveSensor = require('jsupm_grove');
// Create the button object using GPIO pin 0
var button = new groveSensor.GroveButton(0);

var buttonPressed = false;

// Read the input and print, waiting one second between readings
function readButtonValue() {
    if (button.value() == 1) {
        notifyButtonPress();
    } else {
        buttonPressed = false;
    }
}

function notifyButtonPress() {
    if (buttonPressed == false)
        console.log(button.name() + " has been pressed at " + new Date().toString());
    buttonPressed = true;
}

setInterval(readButtonValue, 10);
