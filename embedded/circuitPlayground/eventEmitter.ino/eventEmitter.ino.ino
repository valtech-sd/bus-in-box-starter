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
#include <limits.h>
#include <StreamUtils.h>
#include "Extras.h"

// digital pin 2 has a pushbuttonA attached to it. Give it a name:
int pushButtonA = 4;
int pushButtonB = 5;
int switchButton = 7;

int EFFECT_0_LED = 9;
int EFFECT_1_LED = 8;
int EFFECT_2_LED = 7;
int EFFECT_3_LED = 6;
int EFFECT_4_LED = 5;

int BUTTON_A_LED = 2;
int BUTTON_B_LED = 1;
int SWITCH_LED = 4;
int REACTION_LED = 8;

uint32_t LED_DEFAULT = 0xfebc2d; // should probably be black, but otherwise good for testing
uint32_t LED_GREEN = 0x2bcb41;
uint32_t LED_ORANGE = 0xfebc2d;

uint32_t REACTION_COLOR_1 = 0xff0000;
uint32_t REACTION_COLOR_2 = 0xff00ff;
HsvColor red = {360, 255, 255};

PinStatus priorSwitchState;
PinStatus priorButtonAState;
PinStatus priorButtonBState;

#define NUM_FX 5
EffectSlot effects[NUM_FX] = {
  {0, EFFECT_0_LED, None, 0, 0},
  {1, EFFECT_1_LED, None, 0, 0},
  {2, EFFECT_2_LED, None, 0, 0},
  {3, EFFECT_3_LED, None, 0, 0},
  {4, EFFECT_4_LED, None, 0, 0},
};

unsigned long loopTime = 0;

// the setup routine runs once when you press reset:
void setup() {

  // initialize serial communication at 9600 bits per second:
  Serial.begin(57600);
  // make the pushbuttonA's pin an input:
  pinMode(pushButtonA, INPUT);
  pinMode(pushButtonB, INPUT);
  pinMode(switchButton, INPUT);

  CircuitPlayground.begin();
  CircuitPlayground.clearPixels();

  delay(1000);
  priorSwitchState = digitalRead(switchButton);

  // CircuitPlayground.setPixelColor(REACTION_LED, REACTION_COLOR_1);
  CircuitPlayground.setBrightness(20);
}

void readIncomingSerial(DeviceCommand *command) {
  // return DeviceCommand {"HI", 1};
  if (Serial.available()) {

    // Allocate the JSON document
    // This one must be bigger than for the sender because it must store the strings
    StaticJsonDocument<128> incomingDoc;

    // Using a ReadBufferingStream resolves an issue where program execution would pause on Serial input/deserialization
    // See https://arduinojson.org/v6/api/json/deserializejson/#performance
    ReadBufferingStream bufferingStream(Serial, 64);
    
    // Read the JSON document from the "link" serial port
    DeserializationError err = deserializeJson(incomingDoc, bufferingStream);

    if (err == DeserializationError::Ok) {
      String seq = incomingDoc["sequence"].as<String>();
      if(seq.compareTo("pulse") == 0){
        command->command = Pulse;
      } else if (seq.compareTo("0") || seq.compareTo("none")) {
          command->command = None;
      } else {
      
      }

      if(incomingDoc["color"].isNull()){
        command->color = LED_DEFAULT; 
      } else {
        String color = incomingDoc["color"].as<String>();
        uint32_t inColor = StrToHex(incomingDoc["color"].as<const char*>());
        command->color = inColor;
      }

      if(incomingDoc["position"].isNull()){
        command->position = -1;
        Serial.println("ERR: POSITION CANNOT BE NULL");
        command->command = None;
      } else {
        command->position = incomingDoc["position"].as<int>();
      }
      if(!incomingDoc["duration"].isNull()){
        if( incomingDoc["duration"].as<long>() == -1){
          command->duration = ULONG_MAX; //for indefinite running
        } else {
          command->duration = incomingDoc["duration"].as<unsigned long>();
        }
      } else {
        command->duration = 0;
        Serial.println("ERR: DURATION CANNOT BE NULL");
        command->command = None;
        command->position = -1;
      }
    } else {
      // Flush all bytes in the "link" serial port buffer
      while (Serial.available() > 0) {
        Serial.read();
      }
    }
  }
}

// 
void runPulse(int pin, uint32_t color, unsigned long time) {

  // Color is converted from hex to HSV so that it's easier to modify the color brightness for a pulsing animation
  HsvColor hsv = HexToHsv(color);
   //The neopixel will turn off below ~9%, some colors the threshold is higher as individual color elements will fail to illuminate at the dimmest
   // Test with color 5100A8 or A83B00 against different MIN values, depending on color choices, itmay be anywhere between 0.09 and ~0.3
  float MIN = 0.09;
  float brightnessScale = constrain(sin((float)time * 0.0025)*0.5 + 0.5, MIN, 1.0);
  HsvColor dimmed = HsvColor{ (uint16_t) hsv.h, hsv.s, (uint8_t)(hsv.v * brightnessScale)};
  CircuitPlayground.setPixelColor(pin, dimmed.getHex());
}

void clearLED(int pin) {
  CircuitPlayground.setPixelColor(pin, 0x000000);  
}

// the loop routine runs over and over again forever:
void loop() {
  loopTime = millis();
HsvColor hsv = HexToHsv(0x00ff00);
  /**
   * Incoming commands and effects
   */

  DeviceCommand incoming;
  readIncomingSerial(&incoming);
  if(incoming.command != None && incoming.position >= 0){
    for(int ii =0; ii < NUM_FX; ii++) {
      EffectSlot *fx = &effects[ii];
      if(fx->position == incoming.position) {
        fx->command = incoming.command;
        fx->startTime = loopTime; //reference start time
        fx->duration = incoming.duration;
        fx->color = incoming.color;
        // This will set either the near-expiration time (millis), or maximum ulong value for "no expiration"
        unsigned long expiration = fx->expiration();
      }     
    }
  }

  // Handle the effects sequences - contiue animating or stop
  for(int ii = 0; ii < NUM_FX; ii++) {
    EffectSlot *fx = &effects[ii];
    unsigned long expiration = fx->expiration();
    if(expiration < loopTime && fx->command != None) {
      // Once we've surpassed the expiration time, end the command by setting None and clearing the LED
      fx->command = None;
      clearLED(fx->pin);
    }
    
    if(fx->command != None){
      // To animate all separately, use the time relative to start.
      // To animate all in synchony, use the current millis() time.
      unsigned long elapsed = loopTime - fx->startTime;
      runPulse(fx->pin, fx->color, elapsed);
    }
  }

/**
 * Hardware Switches
 */
  PinStatus switchState = digitalRead(switchButton);
  bool switchChanged = switchState != priorSwitchState;
  priorSwitchState = switchState;
  if (switchState == LOW) {
    CircuitPlayground.setPixelColor(SWITCH_LED, 50, 0, 50);  // majenta
  } else {
    CircuitPlayground.setPixelColor(SWITCH_LED, 0, 128, 128);  //cyan
  }

  PinStatus buttonAState = digitalRead(pushButtonA);
  bool buttonAChanged = priorButtonAState != buttonAState;
  priorButtonAState = buttonAState;
  if (buttonAState == LOW) {
    CircuitPlayground.setPixelColor(BUTTON_A_LED, 32, 32, 0);
  } else {
    CircuitPlayground.setPixelColor(BUTTON_A_LED, 0, 32, 32);
  }

  PinStatus buttonBState = digitalRead(pushButtonB);
  bool buttonBChanged = priorButtonBState != buttonBState;
  priorButtonBState = buttonBState;
  if (buttonBState == LOW) {
    CircuitPlayground.setPixelColor(BUTTON_B_LED, 32, 32, 0);
  } else {
    CircuitPlayground.setPixelColor(BUTTON_B_LED, 0, 32, 32);
  }

  if (
    switchChanged || buttonAChanged || buttonBChanged) {
    // See https://arduinojson.org/v6/assistant/ for sizing etc
    StaticJsonDocument<64> doc;
    doc["buttonA"] = buttonAState;
    doc["buttonB"] = buttonBState;
    doc["switchButton"] = switchState;
    serializeJson(doc, Serial);
    Serial.println();
  }
  delay(50);  // delay in between reads for stability
}
