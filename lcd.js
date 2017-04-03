var useUpmVersion = true;
var mraa = require('mraa');
var lcd = require('jsupm_i2clcd');
var display = new lcd.Jhd1313m1(0, 0x3E, 0x62);
display.setCursor(1, 1);
display.write('uploded');
display.setCursor(0, 0);
display.write('ON');
rotateColors(display);



/**
 * Rotate through a color pallette and display the
 * color of the background as text
 */
function rotateColors(display) {
    var red = 0;
    var green = 0;
    var blue = 0;
    display.setColor(red, green, blue);
    setInterval(function() {
        blue += 64;
        if (blue > 255) {
            blue = 0;
            green += 64;
            if (green > 255) {
                green = 0;
                red += 64;
                if (red > 255) {
                    red = 0;
                }
            }
        }
        display.setColor(red, green, blue);
        display.setCursor(0, 0);
        display.write(' Hello AWS!');
        display.setCursor(1, 1);
        display.write('Let\'s hack!');
        // extra padding clears out previous text
    }, 1000);
}
