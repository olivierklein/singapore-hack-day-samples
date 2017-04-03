var groveSensor = require('jsupm_grove');

// Create the relay switch object using Digital Port 2 (D2)
var relay = new groveSensor.GroveRelay(2);

// Close and then open the relay switch 3 times,
// waiting one second each time.  The LED on the relay switch
// will light up when the switch is on (closed).
// The switch will also make a noise between transitions.
var i = 0;
var waiting = setInterval(function() {
    if (i % 2 == 0) {
        relay.on();
        if (relay.isOn())
            console.log(relay.name() + " is on");
    } else {
        relay.off();
        if (relay.isOff())
            console.log(relay.name() + " is off");
    }
    i++;
    if (i == 6) clearInterval(waiting);
}, 2000);

