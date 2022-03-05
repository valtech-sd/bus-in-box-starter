
/**
This sketch is intended to work on the Adafruit Circuit Playground Express

While it makes some nicely colored lights depending on what buttons are pressed,
or what value the switch is presenting. These are just visuals for representing
the current state of the Circuit Playground device.

When connected to serial over USB, button presses and switch values are transmitted
in the format button A | button B | switch (values separated by pipe). The client
application is responsible for processing the state/changes/etc so this device is 
as dumb as possible.
*/
#include <Adafruit_CircuitPlayground.h>
#include <ArduinoJson.h>

// digital pin 2 has a pushbuttonA attached to it. Give it a name:
int pushButtonA = 4;
int pushButtonB = 5;
int switchButton = 7;

// See https://arduinojson.org/v6/assistant/ for sizing etc
StaticJsonDocument<64> doc;


// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
  // make the pushbuttonA's pin an input:
  pinMode(pushButtonA, INPUT);
  pinMode(pushButtonB, INPUT);
  pinMode(switchButton, INPUT);

    CircuitPlayground.begin();

    CircuitPlayground.clearPixels();
    CircuitPlayground.setBrightness(10);
}

// the loop routine runs over and over again forever:
void loop() {
  CircuitPlayground.clearPixels();
  

  // read the input pin:
  int switchState = digitalRead(switchButton);
  if(switchState == LOW){
    CircuitPlayground.setPixelColor(0, 0, 128, 128);
    CircuitPlayground.setPixelColor(1, 16, 0, 16);

  } else {
    CircuitPlayground.setPixelColor(0, 16, 0, 16);
    CircuitPlayground.setPixelColor(1, 0, 128, 128);
  }

  int buttonAState = digitalRead(pushButtonA);
  if(buttonAState == LOW){
      CircuitPlayground.setPixelColor(5, 32, 32, 0);
      CircuitPlayground.setPixelColor(6, 32, 32, 0);
  } else {
      CircuitPlayground.setPixelColor(5, 0, 32, 32);
      CircuitPlayground.setPixelColor(6, 0, 32, 32);
  }

  int buttonBState = digitalRead(pushButtonB);
  if(buttonBState == LOW){
      CircuitPlayground.setPixelColor(8, 32, 32, 0);
      CircuitPlayground.setPixelColor(9, 32, 32, 0);
  } else {
      CircuitPlayground.setPixelColor(8, 0, 32, 32);
      CircuitPlayground.setPixelColor(9, 0, 32, 32);
  }

  // String output = String(buttonAState) + "|" + String(buttonBState) + "|" + String(switchState);
  // print out the state of the button:
  // Serial.println(output);
  doc["buttonA"] = buttonAState;
  doc["buttonB"] = buttonBState;
  doc["switchButton"] = switchState;
  serializeJson(doc, Serial);
  Serial.println();
  delay(10);        // delay in between reads for stability
}
