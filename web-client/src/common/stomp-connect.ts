/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line no-unused-vars
import assert from 'assert';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

// eslint-disable-next-line global-require
Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });

const mqExchange = '/exchange/control-events'; //topic ex

// Note that for STOMP it doesn't seem to work by connecting to another queue. Instead,
// it creates its own queue bound to the exchange - just for one web socket connection
// that expires when the browser window disconnects. Other connection methods would
// bind to the fx-queue instead.
const subscriptionQueue = `/exchange/fx-exchange/`; // topic ex 

// @ts-ignore
// eslint-disable-next-line unused-imports/no-unused-vars
const displayIncomingMessage = (payload: unknown) => {
  console.log('Incoming Message', payload);
};

export type OnMessageCallback = (message: IMessage) => void | undefined;
export type OnDisconnectCallback = () => void | undefined;

class Stomper {
  stompClient?: Client | undefined;

  subscription?: StompSubscription | undefined;

  queue?: string | undefined;

  exchange?: string | undefined;

  suffix?: string | undefined;

  onMessage?: OnMessageCallback;

  onDisconnect?: OnDisconnectCallback;

  configure = (
    exchange: string = mqExchange,
    queue: string = subscriptionQueue
  ) => {

    assert(exchange, 'Exchange cannot be empty');
    assert(queue, 'Queue cannot be empty');
    
    // console.log("Ex", exchange, `default [${mqExchange}]`);
    // console.log("Queue", queue, `default [${subscriptionQueue}]`)

    const client: Client = new Client();
    this.stompClient = client;
    this.exchange = exchange;
    this.queue = queue;

    const ls = localStorage.getItem('suffix');
    this.suffix = ls || 'y';

    client.connectHeaders = {
      login: 'rmquser',
      passcode: 'rabbit',
    };
    client.brokerURL = 'ws://localhost:15674/ws';
    client.reconnectDelay = 200;

    // @ts-ignore
    // eslint-disable-next-line unused-imports/no-unused-vars
    client.onConnect = (frame) => {
      assert(this.stompClient, 'Missing client');
      assert(this.queue, 'Missing queue');
      console.log(`Subscribing to ${this.queue}`);
      this.subscription = this.stompClient.subscribe(this.queue, (message) => {
        if (typeof this.onMessage === 'function') {
          this.onMessage(message);
        }
      }, {
        "auto-delete": "true"
      });
      this.stompClient.activate();
    };

    client.onDisconnect = (frame) => {
      console.warn('Disconnecting', frame);
      if (typeof this.onDisconnect === 'function') {
        this.onDisconnect();
      }
    };

    client.onWebSocketClose = () => {
      console.warn('Web Socket has closed!');
    };

    // client.logRawCommunication = true;
    // client.debug = (str) => {
    //   console.info(`${str}`);
    // };

    this.stompClient.onWebSocketError = (frame) => {
      console.error('[ws]', frame);
    };
    

    this.stompClient.onStompError = (frame) => {
      console.error('!!! Error frame', frame);
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };
  };

  publish: (body: unknown, destination?: string) => boolean = (
    body,
    destination = this.exchange
  ) => {
    console.log(
      `Publishing to exchange ${destination}: ${JSON.stringify(body)}`
    );
    // console.log("Who's here?", this.stompClient);
    if (this.stompClient === null || !this.stompClient?.connected) {
      if (typeof this.onDisconnect === 'function') {
        this.onDisconnect();
      }
      return false;
    }
    this.stompClient?.publish({
      destination: destination!,
      body: JSON.stringify(body),
      skipContentLengthHeader: true,
    });

    if (!this.stompClient) {
      console.warn('NO stomp client available', this.stompClient);
    }
    return true;
  };

  connect = () => {
    console.warn('connect(): This does nothing');
  };
}

export default Stomper;
