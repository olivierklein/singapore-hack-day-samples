var sensor1 = require('jsupm_th02');
var th02 = new sensor1.TH02();


var temp = th02.getTemperature();
var humi = th02.getHumidity();

console.log('Temperature: ', temp);
console.log('Humidity: ', humi);
