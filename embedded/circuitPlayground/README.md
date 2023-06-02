# Circuit Playground

This demo Arduino code is designed to work on the Adafruit Circuit Playground Express. While not meant to be used as-is for any production work, take it as a starting point for helping you understand ways you can approach certain types of problems related to controlling microcontrollers from the outside world. More specifically, microcontrollers in the context of a connected experience.

In order to compile and upload the binary, you'll need to install these libraries into your local Arduino IDE environment.
* ArduinoJson
* StreamUtils


# Incoming Commands

Commands are sent over the serial interface in the following sample format:

```json
{
  "sequence": "pulse",
  "position": 0,
  "duration": -1,
  "color": "00ffff",
  "delay": 0
}
```

* `sequence` - one of the named sequences below (also check the `Extras.h` file for more options)
* `position` - this is a relative position that is mapped to a specific pin in code. Possible values are 0 to 2 at the time of this writing.
* `duration` - in milliseconds. `-1` indicates "forever," `0` means none/stop, otherwise a non-negative number. When passing `0` it will stop any existing command on the position and change it to sequence `None`
* `color` - hex color for the given effect, if applicable. If not provided a default color will be determined internally. Do note that some colors will have some unexpected behavior in the `Pulse` sequence, as the individual RGB components in NeoPixels have different lower-bound brightness thresholds, around 9% minimum brightness. Anything lower than that and it will turn off.


Sequences are named in the `Command` enum:
* Pulse: `pulse` => Slowly fading Neopixel
* Hold: `hold` => Steady color
* None: `0` => turn off any existing commands for the given position

Depending on new sequence names, you may need to increase the size of the incoming JSON Document in memory: `StaticJsonDocument<192> incomingDoc`.

## Sample Lighting Commands

Turn the LED red for 2 seconds in position 0
`{"sequence":"hold","position":0,"duration": 2000,"color": "FF0000"}`

Pulse the LED, magenta indefinitely at position 1 after a 2 second delay
`{"sequence":"pulse","position":1,"duration": -1,"color": "FF00FF", "delay": 2000}`

Turn the LED off after 2 seconds (this could be helpful if any LEDs were turned on indefinitely)
`{"sequence":"hold","position":2,"duration": 0,"color": "FF00FF", "delay": 2000}`


## Configuring Effect Slots

These "Effect Slots" are configured in the main sketch. Look for
```c
#define NUM_FX 3
EffectSlot effects[NUM_FX] = {
  ...
};
```

# Connecting to the Message Bus

There is a .env file in src/conf that should contain the appropriate username and password for the RMQ service. In all likelihood it's the same as the rules engine for development, though external services may want to use different users for different types of clients. The CA cert file will be the same, as it comes from the RMQ server itself.

This circuitPlayground client is a good example of how to connect the device via a serial application - as if it was a standalone IoT device or computer with custom hardware. By establishing the desired exchange and queue names, incoming messages could be filtered by tag for specific responses. Remember there is no one-size-fits-all approach to deciding what devices listen to what kinds of messages and data. This project is a simple proof of concept to demonstrate a couple limited possibilities.
