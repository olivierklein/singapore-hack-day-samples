var awsIot = require('aws-iot-device-sdk');
var thingName = "Intel_Edison";

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
    device.subscribe('edison/+');
    mystring = "{\"Action\":\"Hello_World\"}";
    device.publish('edison/messages', mystring);
});

device.on('message', function(topic, payload) {
    console.log(topic + ":" + payload.toString());
});
