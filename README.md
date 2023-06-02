# Interactives Playground Demo
- [Interactives Playground Demo](#interactives-playground-demo)
- [Instructions for making this work together](#instructions-for-making-this-work-together)
  - [Sample Video](#sample-video)
- [Demo Components](#demo-components)
  - [Web Interfaces](#web-interfaces)
  - [Arduino + Serial Control](#arduino--serial-control)
  - [HTTP (General)](#http-general)
  - [Rules](#rules)
  - [Other Ideas (Not implemented)](#other-ideas-not-implemented)
- [Extending \& Building Something New](#extending--building-something-new)
- [Bootstrapping](#bootstrapping)
  - [Problems?](#problems)

# Instructions for making this work together

The concept behind this almalgamation of components is to prototype a simple message bus with a variety of inputs and outputs. This includes both web-based controls (the `web-client` project), and physical controls (an Arduino-based Adafruit Circuit Playground Express, controlled via a serial-based application in the terminal) to send messages to the rules engine vai AMQP and HTTP(S). In-turn, the rules engine decides what happens next, conditionally reformatting and sending messages to an effects exchange (`fx-exchange`). Both the web client and Circuit Playground Express are built to send and receive messages.

The general systems architecture builds into a RabbitMQ (AMQP) message bus and a nodejs-based rules engine. Various types of controls feed into those, data is processed, and output to the appropriate endpoints.

![General network overview](/doc-images/general-overview.png)

...Filling out the specifics of this project, you can see the variety of inputs this simple system is capable of handling.

![General network overview](/doc-images/general-overview-components.png)

---

## Sample Video

![Working in action](/doc-images/demo.gif)

# Demo Components
## Web Interfaces

The web interface is a simple Nextjs + Tailwind application. When running the web portion of the project, there are some interfaces into the message bus system. These connections occur over STOMP (essentially amqp over web sockets), which is an interface directly to the RabbitMQ server.

The main/home page is a mock system dashboard of sorts. There is a publisher, that sends messages into message bus, which gets picked up by the rules engine, handled, and sent back into the output queue, assuming the prerequisite events. There is also a handful of client components - each with their own socket connection to the output exchange (they manage their own queues). When interacting with the web publisher, the messages pass through the whole system and finaly light up the various lights on the scree - no hand-wavey actions going on.

## Arduino + Serial Control

The physical interactions are handled by the Adafruit Circuit Python Express via a nodejs based serial reading application that translates button presses into messages that are sent over HTTP(S) to the rules engine, which handles the rest. The outcomes of these interactions trigger the same effects on the web dashboard - it's just a different intputs for the same outcomes.

## HTTP (General)

You can add to these interactions with external HTTP calls, which are provided on the dashboard as an example.

## Rules

The first place to look is the target of `yarn start` - `MultiConnectManager.js` in the `/rules_engine/src/` directory. From there all the various AMQP configurations, ruiles (conditions, actions, and transformers) are set up. Details about the AMQP configurations are pulled from samples at our [AMQPCacoon library](https://github.com/valtech-sd/amqp-cacoon). The rules in this repo are inspired by the samples in the [Rule Harvester repo](https://github.com/valtech-sd/rule-harvester). It can be a lot to wade through at first, so hopefully this repo has just enough to get you started before jumping over there for additional configuration concepts.

## Other Ideas (Not implemented)

* Serial client can also connect via AMQP to the inbound exchange.
* The rules engine can send messages over HTTP(S), eg an external logging system.
* Come up with more physical interaction inputs, and outputs (other sensors, audio, video, etc)
* Create a unique input device for some kind of interactive artwork.
* Additional web-based demos, for example a playable mini game or mocked interactive experience
* Inspect and act upon UDP traffic (eg devices)

# Extending & Building Something New

This repo is meant to be a starting point for bigger builds. Take the ideas, concepts, and even code snippits to help you incrementally build something ideal for your project. There are a few things worth considering as you get going

* Dockerise the various components
* If not self-hosting RMQ, look into various hosted options online. These are good for getting started and abstract away the management details.
* Work out the rules and logic of the overal experience before you start diving too deep into code. A little planning can go a long way.

# Bootstrapping

Below are the feature checkpoints with the requirements to get the system running together.

1. You need to get RabbitMQ going with WebSTOMP support. It's basically one extra setting that needs to be added to the Valtech_SD RMQ docker image once it's bootet. This Repo has it already enabled...
   1. Inside the `rabbit` directory, run `docker-compose up --build -d` to run it in the background (daemon).
2. In `rules-engine` run `yarn start` to get the setup that takes HTTP requests and publishes them as AMQP messages to the `control-events` exchange
3. ..and in `web-client` run `yarn dev` . This is a Next.js app and contains an HTML frontend to both push some messages and show that messages are going through the message bus. It publishes to the `input-control` echange and subscribes to `fx-exchange` via STOMP.
4. In `serial/circuitPlayground` make sure to install the `eventEmitter.ino` arduino sketch to your Adafruit Circuit Python Express device. (Any other device will need significant modification - the point is that there are two momentary button and a switch that determine the end effect in the message bus - as if interacting with 2-4 different types of show-control interactives).
5. finally, also part of the playground(`serial/circuitPlayground`) run `node sample.js`. This connects to the message bus and communicates with the Arduino device over a serial connection.
6. In a broswer, open [https://localhost:3000](https://localhost:3000) to see the web-based effects dashboard.

By this point, everything should be running. Press the buttons on the Circuit Playground Express. Assuming all is well, you'll see the `sample.js` script output some simple jSON showing the button and switch states. The web browser will start displaying some colors and animations based on the combination of pressed buttons pressed on the ardino.

## Problems?

If you run into issues, it depends on the nature - make sure you can track every step. There is the message bus (exchanges and queues), the rules engine, arduino device, WebSTOMP/sockets, etc. Try to isolate as best as possible - there are usually several points where this can be done so the whole chain of events is not required.
