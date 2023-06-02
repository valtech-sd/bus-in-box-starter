#include <Arduino.h>
#include <stdint.h>

enum Command {
  None = '0',
  Pulse = 'pulse',
  Hold = 'hold'
};


char* commandVal(Command command);

struct DeviceCommand {
  // String sequence = "";
  int position = -1; // let's not think about "which pin is this - it could be a string/id/etc this device needs to decode and figure out"
  Command command = None;
  unsigned long startTime;
  unsigned long duration; //milliseconds. Pass -1 in the JSON ojbect to trigger "indefinite" (ULONG_MAX)
  unsigned long delay = 1; //milliseconds delay before starting the effect
  uint32_t color; //hexadecimal 0x.... Pass a string hex color over serial, eg "ABCDEF"
};

// This sort of depends on what the intended output of a command is going to be.
// Other uses could be completely unrelated to pins altogether and focus on functions
// and other outputs. YMMV
struct EffectSlot {
  int position;  
  int pin;
  Command command;// = None;
  unsigned long startTime;// = 0;
  unsigned long duration;// = 0;
  unsigned long delay;// = 0;
  // DeviceCommand command;
  unsigned long expiration();
  uint32_t color; //hexadecimal hex color
};

/**
 HSV makes it much easier to dim/brighten, so it makes sense from a manipulation standpoint. The Adafruit Neopixel functions can set light color from HSV, so we go that route.
h (hue): 0 to 360 //why? It's easier to use a standard measure than what's technically possible with uint16
s (saturation): 0 to 255
v (value): 0 to 255
*/
struct HsvColor {
  uint16_t h;
  uint8_t s;
  uint8_t v;
  uint32_t fromHex();
  // converts the hsv color to hexidecimal
  uint32_t getHex();
};

HsvColor HexToHsv(uint32_t hex);
// Convert hex color string in the without leading "#" or "0x" to a numeric version
uint32_t StrToHex(const char* str);

float mix(float a, float b, float t);
float step(float e, float x);

//Expects values to be range 0...1.0
float* rgb2hsv(float r, float g, float b, float* hsv);