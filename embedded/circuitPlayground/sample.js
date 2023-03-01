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
import _ from 'underscore';
import Readline from '@serialport/parser-readline';

const writeStream = process.stdout;
let _inputState = {};
const setInputState = (state) => {
  if (!_.isEqual(state, _inputState) && (state.buttonA || state.buttonB)) {
    // curl -X POST -H "Content-Type: application/json" --data '{"HI":"HO CHERRY O","event":"interaction", "location":"room1", "target": "deviceA"}' http://localhost:3333
    const body = {
      event: "interaction",
      location: state.switchButton ? "room1" : "zoneA",
      device: state.buttonA ? "deviceA" : "deviceB",
    };
    const initialState = JSON.parse(JSON.stringify(state));
    // Sends state changes via HTTP to the rules engine ingest. While this is over HTTP, it's fesible to
    // configure an AMQP client to connect to the input exchange
    fetch('http://localhost:3333', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    }).then(res => {
      printBox(JSON.stringify(state), 'success');
    }).catch(err => {
      printBox(JSON.stringify(state), 'error');
    });
  }
  _inputState = state;
};

const parseInput = (message) => {
  try {
    const mData = JSON.parse(message);
    setInputState(mData);
    return;
  } catch (err) {

    console.error("Yikes, bad JSON");
  }
};

const boot = () => {
  cliCursor.hide();
  console.log("Message written \n");
  console.log(boxen(chalk.hex("#000000").bold(''), { title: 'Input Values', titleAlignment: 'center', textAlignment: 'left', backgroundColor: 'yellow', padding: 1 }));
  process.stdout.write("\x1B[?25l");
};

process.on('exit', (code) => {
  cliCursor.hide(false);
});

const printBox = (message, status) => {
  let color;
  if (status === "error") {
    color = 'red';
  } else if (status === "success") {
    color = 'green';
  } else {
    color = 'gray';
  }
  const box = boxen(chalk.hex("#000000").bold(message), { title: 'Input Values', titleAlignment: 'center', textAlignment: 'left', backgroundColor: color, padding: 1 });
  const height = box.split("\n").length;
  writeStream.moveCursor(0, -height);

  console.log(box);
};

const devices = await SerialPort.list();
const availableDevices = devices.filter(item => item.path.indexOf('/dev/tty.usbmodem') > -1);
let port;
if (availableDevices.length) {
  port = new SerialPort(availableDevices[0].path, {
    baudRate: 57600
  });
} else {
  console.error('No device available');
  exit(1);
}

const parser = port.pipe(new Readline({ delimiter: '\n' }));

port.on('error', (err) => {
  console.log("Error", err.message);
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


//------------- START ------------------------

boot();
