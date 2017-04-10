var awsIot = require('aws-iot-device-sdk');
var mraa = require('mraa');
var thingName = "Intel_Edison";
var lcd = require('jsupm_i2clcd');
var servoModule = require("jsupm_servo");
var groveSensor = require('jsupm_grove');
var sensor1 = require('jsupm_th02');
var buzzer, display, servo, button, th, relay;
var buttonPressed = false;

var exec = require('child_process').exec;
var cmd = "fswebcam -r 1280x720 --jpeg 100 -S 13 - | "
cmd = cmd + "aws s3 cp - s3://edison-hackday/uploads/test.jpg --content-type image/jpeg";

var device = awsIot.device({
    keyPath: '/home/root/aws_certs/privateKey.pem',
    certPath: '/home/root/aws_certs/cert.pem',
    caPath: '/home/root/aws_certs/rootCA.pem',
    clientId: 'intel_edison',
    region: 'ap-southeast-1',
    reconnectPeriod: '10'
});


device.on('connect', function() {
    console.log('Connecting to AWS IoT edison/+ topic');
    device.subscribe('edison/commands');
    mystring = "{\"Message\":\"Your Edison is online\"}";
    device.publish('edison/messages', mystring);
});


device.on('message', function(topic, payload) {
    console.log(topic + ":" + payload.toString());
    msg = JSON.parse(payload.toString());
    switch (topic) {
        case 'edison/commands':
            switch (msg.Action) {
                case 'beep':
                    beep();
                    break;
                case 'relay':
                    if (msg.State == "on") {
                        relay.on();
                    } else {
                        relay.off();
                    }
                    break;
                case 'lcd':
                    display.setCursor(0, 0);
                    display.write('                 ');
                    display.setCursor(0, 0);
                    display.write(msg.Message);
                    break;
                case 'color':
                    if (msg.Color == 'red')
                        display.setColor(255, 0, 0);
                    if (msg.Color == 'green')
                        display.setColor(0, 255, 0);
                    if (msg.Color == 'blue')
                        display.setColor(0, 0, 255);
                    if (msg.Color == 'white')
                        display.setColor(255, 255, 255);
                    break;
                case 'servo':
                    servo.setAngle(Number(msg.Angle));
                    break;
                case 'cam':
                    cmd = "fswebcam -r 1280x720 --jpeg 100 -S 13 - | aws s3 cp - s3://edison-";
                    cmd = cmd + "hackday/uploads/" + guid() + ".jpg --content-type image/jpeg";
                    exec(cmd, function(error, stdout, stderr) {
                        console.log(stdout);
                    });
                    break;
                default:
                    console.log(msg);
                    break;
            }
            break;
        default:
            break;
    }

});

function initEdison() {
    //initialize buzzer
    buzzer = new mraa.Gpio(4);
    buzzer.dir(mraa.DIR_OUT);
    //initialize lcd
    display = new lcd.Jhd1313m1(0, 0x3E, 0x62);
    display.setCursor(0, 0);
    display.write('ON');
    //initialize Servo
    servo = new servoModule.ES08A(5);
    //initialize button
    button = new groveSensor.GroveButton(0);
    setInterval(readButtonValue, 10);
    //initialize temperature and Humidity
    th = new sensor1.TH02();
    //initialize motion sensor1
    motion = new mraa.Gpio(7);
    motion.dir(mraa.DIR_IN);
    //readMotionSensor();
    // initialize relay switch
    relay = new groveSensor.GroveRelay(2);
    setTimeout(readTemperature, 5000);
}

function beep() {
    setTimeout(function() {
        buzzer.write(1);
    }, 0);

    setTimeout(function() {
        buzzer.write(0);
    }, 200);
}

function readButtonValue() {
    if (button.value() == 1) {
        notifyButtonPress();
    } else {
        buttonPressed = false;
    }
}

function notifyButtonPress() {
    if (buttonPressed == false) {
        device.publish('edison/messages', JSON.stringify({
            "Temperature": th.getTemperature(),
            "Humidty": th.getHumidity()
        }));
        console.log(button.name() + " has been pressed at " + new Date().toString());
    }
    buttonPressed = true;
}


function readMotionSensor() {
    var sensorValue = motion.read();
    if (sensorValue == 1) {
        console.log("Motion detected");
        //device.publish('edison/messages', JSON.stringify({
        //    "Notification": "Motion detected at " + new Date().toString()
        //}));
    }
    setTimeout(readMotionSensor, 1000);
}


function readTemperature() {
    //console.log(th.getTemperature());
    display.setCursor(1, 1);
    display.write("Temp:" + th.getTemperature().toFixed(1) + " / " + th.getHumidity().toFixed(0) + "%");
    device.publish('$aws/things/Intel_Edison/shadow/update', JSON.stringify({
        "state": {
            "reported": {
                "temperature": th.getTemperature()
            }
        }
    }));
    setTimeout(readTemperature, 5000);

}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

initEdison();
