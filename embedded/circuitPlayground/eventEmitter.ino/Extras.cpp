#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include <Adafruit_CircuitPlayground.h>
#include <limits.h>
#include "ColorConverterLib.h"
#include "Extras.h"



unsigned long EffectSlot::expiration(){
  if( duration == ULONG_MAX) {
    return  ULONG_MAX;
  } else {
    return startTime + duration;
  }  
}

char* commandVal(Command command){
  switch(command) {
    case(None): return "0";
    case(Pulse): return "pulse";
  }
}


uint32_t StrToHex(const char* str) {  
  return (uint32_t) strtoul(str, 0, 16);
}

HsvColor HexToHsv(uint32_t hex) {
    int r = hex >> 16;
    int g = hex >> 8 & 0xFF;
    int b = hex & 0xFF;

    float hue, saturation, lighting, value;
    float hsv[3];
    // ColorConverter::RgbToHsv(r, g, b, hue, saturation, value);
    rgb2hsv(r/255.0, g/255.0, b/255.0, hsv);
  hue = hsv[0];
  saturation = hsv[1];
  value = hsv[2];
    // Serial.print("r/g/b ");
    // Serial.print(r);
    // Serial.print("/");
    // Serial.print(g);
    // Serial.print("/");
    // Serial.println(b);
    // Serial.print("h/s/v ");
    // Serial.print(hue);
    // Serial.print("/");
    // Serial.print(saturation);
    // Serial.print("/");
    // Serial.println(value);

    return {(uint16_t)(hue * 360.0), (uint8_t)(saturation * 255.0), (uint8_t)(value * 255.0) };
}

uint32_t HsvColor::getHex(){
  uint16_t adjustedHue = (uint32_t) ((float)h/360 * 65535);
  return Adafruit_CPlay_NeoPixel::ColorHSV(adjustedHue, s, v);
};


// mix, step, rgb2hsv: https://gist.github.com/postspectacular/2a4a8db092011c6743a7
float mix(float a, float b, float t) { return a + (b - a) * t; }
float step(float e, float x) { return x < e ? 0.0 : 1.0; }
float* rgb2hsv(float r, float g, float b, float* hsv) {
  float s = step(b, g);
  float px = mix(b, g, s);
  float py = mix(g, b, s);
  float pz = mix(-1.0, 0.0, s);
  float pw = mix(0.6666666, -0.3333333, s);
  s = step(px, r);
  float qx = mix(px, r, s);
  float qz = mix(pw, pz, s);
  float qw = mix(r, px, s);
  float d = qx - min(qw, py);
  hsv[0] = abs(qz + (qw - py) / (6.0 * d + 1e-10));
  hsv[1] = d / (qx + 1e-10);
  hsv[2] = qx;
  return hsv;
}