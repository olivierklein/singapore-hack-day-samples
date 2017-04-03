var mraa = require('mraa');

var myBuzzer = new mraa.Gpio(4);
myBuzzer.dir(mraa.DIR_OUT);


setTimeout(function() {
    myBuzzer.write(1);
}, 0);

setTimeout(function() {
    myBuzzer.write(0);
}, 200);
