/**
* This script is here to read incoming serial data from the circuitPlayground arduino
* sketch running on a cuircuit playground device, connected over USB serial.
* 
* If ever there's a trick to connecting, ensure the proper USB serial port is selected.
* Use `yarn devices:list` to show the available devices. If the Circuit Playground (or 
  * any arduino you might be connecting to, for that matter) is already being inspected
  * by another serial port monitor (eg through the Arduino IDE), you won't be able to connect
  * until that is closed.
  * 
  * This script is messy, and it's OK - it's simply here to prove out some concepts in the larger
  * grand scheme of things.
  * 
  * Data is constantly streaming over serial, but this script only cares about state changes.
  * When a button is pressed, it triggers a POST request to a local process (this is a dev machine
  * after all) running the rules enging (AMQP cacoon) that processees incoming HTTP requests,
  * transforms the data into something meaningful for a client web page, then sends the crafted
  * data over an RMQ exchange. See the engine-01 and engine-01-client folders.
  */
import boxen from 'boxen';
import SerialPort from 'serialport';
import chalk from 'chalk';
import cliCursor from 'cli-cursor';
import fetch from 'node-fetch';
import _, { delay } from 'underscore';
import Readline from '@serialport/parser-readline';
// import { startup } from './src/amqpClient.js';
import { startListening } from './src/amqpClient.js';
import { Color, HSL } from './src/colors.js';

import { logger } from './src/custom_logger.js';
import CommandSequence from './src/command.js';
// logger.info(logger);




const writeStream = process.stdout;
let _inputState = {};
const setInputState = (state) => {

  if (!_.isEqual(state, _inputState) && (state.buttonA || state.buttonB)) {
    let deviceType, event, deviceId;

    if (state.switchButton === 0) {
      deviceType = state.buttonA ? "taskButton" : 'proximity';
      event = state.buttonA ? 'button-press' : 'item-select';
      deviceId = state.buttonA ? "C0C0A" : 'PR0X';
    } else {
      deviceType = 'rfid-reader';
      event = 'item-select';
    }
    const body = {
      event,
      location: state.switchButton ? "room1" : "room2",
      deviceType,
      deviceId: deviceId || 'arduino',

    };

    const initialState = JSON.parse(JSON.stringify(state));
    // Sends state changes via HTTP to the rules engine ingest. While this is over HTTP, it's fesible to
    // configure an AMQP client to connect to the input exchange
    logger.info("POSTING json");
    fetch('http://localhost:3333', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => {
      printBox(JSON.stringify(state), 'Input Values', 'success');
    }).catch(err => {
      printBox(JSON.stringify(state), 'Input Values', 'error');
    });
  }
  _inputState = state;
};

// assumes the arduino sends json back over the wire
const parseInput = (message) => {
  try {
    const mData = JSON.parse(message);
    setInputState(mData);
    return;
  } catch (err) {
    logger.error("Yikes, bad JSON");
  }
};

const boot = () => {
  cliCursor.hide();
  // logger.info("Message written \n");
  // logger.info(boxen(chalk.hex("#000000").bold(''), { title: 'Input Values', titleAlignment: 'center', textAlignment: 'left', backgroundColor: 'yellow', padding: 1 }));
  process.stdout.write("\x1B[?25l");

  const command = zipWheel("#00FF00", "#0000FF", 250);
  let frameLength = 1000;
  let sequencer = new CommandSequence(command, frameLength, writeSequence);
  sequencer.animate();
};

process.on('exit', (code) => {
  cliCursor.hide(false);
});

// This on-screen info box was pared down for this bi-directional sample.
// See samepl-control-only.js
const printBox = (message, title, status) => {
  if (status === "error") {
    logger.error(title, message);
  } else {
    logger.info(title, message);
  }
};

const devices = await SerialPort.list();
const availableDevices = devices.filter(item => item.path.indexOf('/dev/tty.usbmodem') > -1 && item.manufacturer == "Adafruit" && item.productId == "8018");

logger.info(availableDevices);
let port;
if (availableDevices.length) {
  port = new SerialPort(availableDevices[0].path, {
    baudRate: 57600
  });
} else {
  logger.error('No device available');
  logger.error(chalk.black.bgMagenta("Please plug in your CircuitPlayground device"));
  process.exit(1);
}

const parser = port.pipe(new Readline({ delimiter: '\n' }));

port.on('error', (err) => {
  logger.error("❌", err.message);
  if (err.message.includes(" Resource busy, cannot open")) {
    process.exit(1);
  }
});

// Read data that is available but keep the stream in "paused mode"
// parser.on('readable', function () {
//   const data = port.read();

//   const sData = data.toString().trim();
//   parseInput(sData);

// });

// Switches the port into "flowing mode"
parser.on('data', function (data) {
  const sData = data.toString().trim();
  parseInput(sData);
});

// ------------ ANIMATION RELATED -----------

const writeSequence = (sequence) => {
  for (let ii in sequence) {
    setTimeout(() => {
      let item = sequence[ii];
      let command = JSON.stringify(item);
      port.write(command, (err) => {
        if (err) {
          return logger.info('Error on write: ', err.message, command);
        }
      });
    }, 20 * ii);
  }
};

const rainbowRoad = (dur) => {
  const lights = 10;
  const duration = parseInt(dur) > 0 ? parseInt(dur) : 2000;
  const delayMultiple = 250;
  const tpl = { "sequence": "pulse", "position": 0, duration, "color": "FF0000", "delay": 0 };
  //the number of color stops between the start and stop value ~~> total 10 stops
  const colors = Color.hslColorStops(new HSL(0, 100, 50), new HSL(280, 100, 50), lights - 2).map(item => Color.hslToHex(item.h, item.s, item.l));

  let commands = [];
  for (let ii = 0; ii < lights; ii++) {
    let command = Object.assign({}, tpl);
    command.position = ii;
    command.delay = delayMultiple * ii;
    command.color = colors[ii];
    commands.push(command);
  }
  return [commands];
};

//From hex to hex
const colorWheel = (from, to, duration) => {
  let dur = parseInt(duration) > 0 ? parseInt(duration) : 1000;
  const lights = 10;
  const lightDuration = dur / lights * 2;
  const delayMultiple = dur / lights * .5;
  const tpl = { "sequence": "pulse", "position": 0, duration: lightDuration, "color": "FF0000", "delay": 0 };
  const rgbFrom = Color.hexToRgb(from);
  const rgbTo = Color.hexToRgb(to);

  const hslFrom = Color.rgbToHsl(...rgbFrom);
  const hslTo = Color.rgbToHsl(...rgbTo);

  //the number of color stops between the start and stop value ~~> total 10 stops
  const colors = Color.hslColorStops(hslFrom, hslTo, lights - 2).map(item => Color.hslToHex(item.h, item.s, item.l));
  let commands = [];
  for (let ii = 0; ii < lights; ii++) {
    let command = Object.assign({}, tpl);
    command.position = ii;
    command.delay = delayMultiple * ii;
    command.color = colors[ii];
    commands.push(command);
  }
  return [commands];
};

const zipWheel = (from, to, duration) => {
  let dur = parseInt(duration) > 0 ? parseInt(duration) : 250;
  const lights = 10;
  const lightDuration = dur / lights * .33;
  const delayMultiple = dur / lights;
  const tpl = { "sequence": "pulse", "position": 0, duration: lightDuration, "color": "FF0000", "delay": 0 };
  const rgbFrom = Color.hexToRgb(from);
  const rgbTo = Color.hexToRgb(to);

  const hslFrom = Color.rgbToHsl(...rgbFrom);
  const hslTo = Color.rgbToHsl(...rgbTo);

  //the number of color stops between the start and stop value ~~> total 10 stops
  const colors = Color.hslColorStops(hslFrom, hslTo, lights - 2).map(item => Color.hslToHex(item.h, item.s, item.l));

  let commands = [];
  for (let ii = 0; ii < lights; ii++) {
    let command = Object.assign({}, tpl);
    command.position = ii;
    command.delay = delayMultiple * ii;
    command.color = colors[ii];
    commands.push(command);
  }
  return [commands];
};
const runSky = (sky, object, frameDuration) => {
  const lights = 5;
  const frames = 7;
  const slotDuration = parseInt(frameDuration) > 0 ? parseInt(frameDuration) : 1000;
  let commandSets = [];
  const tpl = { "sequence": "hold", "position": 0, duration: slotDuration, "color": "FF0000", "delay": 0 };
  for (let ii = 0; ii < frames; ii++) {

    let commands = [];
    let command = Object.assign({}, tpl);
    command.color = sky;
    for (let jj = 0; jj < lights; jj++) {

      let cmd = Object.assign({}, command);
      cmd.position = jj;
      if (ii - 1 == jj) { //each frame we advance the color by one
        cmd.color = object;
      }
      commands.push(cmd);
    }
    commandSets.push(commands);
  }
  return commandSets;
};

const runGround = (color, duration) => {
  const dur = parseInt(duration) >= -2 ? parseInt(duration) : 4000;
  const tpl = { "sequence": "hold", "position": 0, duration: dur, color, "delay": 0 };
  let commands = [];
  for (let ii = 9; ii >= 5; ii--) {
    let cmd = Object.assign({}, tpl);
    cmd.position = ii;
    cmd.delay = 250 * (9 - ii);
    commands.push(cmd);
  }
  return [commands];
};

const runSparkle = (color) => {
  const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
  };

  //https://stackoverflow.com/a/6274381
  /**
  * Shuffles array in place. ES6 version
  * @param {Array} a items An array containing the items.
  */
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const pins = shuffle([...Array(10).keys()]);
  const tpl = { "sequence": "pulse", "position": 0, duration: 4000, color, "delay": 0 };
  const delay = 200;
  let commands = [];

  for (let ii = 0; ii < pins.length; ii++) {
    let command = Object.assign({}, tpl);
    command.position = pins[ii];
    command.delay = delay * ii;
    command.duration = 4000 + getRandomInt(2000);
    commands.push(command);
  }

  return [commands];
};
//------------- START ------------------------

boot();


startListening((msg) => {
  let commandSet;

  const key = msg.fields.routingKey;
  const content = JSON.parse(msg.content.toString());
  const sequence = content.sequence;
  console.log("key | sequence", key, content.sequence);
  if (key === "environment" && content.sequence === "point") {
    logger.info("Points incoming");
    commandSet = colorWheel("#FFF300", "#FF7000", 200);

  } else if (key === '' && content.sequence === 'selection') {
    commandSet = rainbowRoad();

  } else if (key === 'environment' && sequence === 'glow') {
    commandSet = runGround("02b116");

  } else if (key === "environment" && ["power-up", "recharge"].indexOf(sequence) > -1) {
    let strip, dot, duration;
    if (sequence === "recharge") {
      strip = "2c0d91"; //night
      dot = "828282"; // moon
    } else {
      strip = "08bddd"; //sky
      dot = "ffd23d"; // sun
    }
    commandSet = runSky(strip, dot);
    console.log("runKey", key, content.sequence);

  } else if (key === '') {
    logger.info("No-key");
    const sparkleColor = ["fcf803" /*yellow*/, "02e82c" /*green*/, "e83002"/*red*/, "e802c6" /*magenta*/, "2902e8"/*blue*/, "fc7b03" /*orange*/, "7303fc",/*purple*/];
    commandSet = runSparkle(sparkleColor[Math.floor(Math.random() * sparkleColor.length)]);

  } else if (false && key === 'table') {
    const sky = "08bddd";
    const sun = "ffd23d";
    commandSet = runSky(sky, sun, 250);
    frameLength = 250;

  } else if (false && key === 'roomZ') {
    const night = "2c0d91";
    const moon = "828282";
    commandSet = runSky(night, moon);

  } else {
    /** Sample Commands to use as reference and inspiration **/
    // randoCommand.push(rainbowRoad());
    // randoCommand.push(zipWheel("#00FFFF", "#0000FF", 500));
    // const sparkleColor = ["fcf803" /*yellow*/, "02e82c" /*green*/, "e83002"/*red*/, "e802c6" /*magenta*/, "2902e8"/*blue*/, "fc7b03" /*orange*/, "7303fc",/*purple*/];
    // randoCommand.push(runSparkle(sparkleColor[Math.floor(Math.random() * sparkleColor.length)]));

    // randoCommand.push(colorWheel("#FFF300", "#FF7000", 200));
    // randoCommand.push(runGround("02b116"));

    // const randIdx = Math.floor(Math.random() * randoCommand.length);
    // commandSet = randoCommand[randIdx];
  }

  if (commandSet) {
    let frameLength = 1000; // TODO: Gather this from the actual frame data, if not inserting it when built (more complex object)
    let sequencer = new CommandSequence(commandSet, frameLength, writeSequence);
    sequencer.animate();
  }
  printBox(content, `Message Received => ${key}`, 'success');
});
