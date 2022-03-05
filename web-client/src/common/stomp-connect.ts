/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line no-unused-vars
import assert from 'assert';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

// eslint-disable-next-line global-require
Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });

const mqExchange = '/exchange/control-events'; //topic ex
const subscriptionQueue = `/exchange/control-events/`; // topic ex 

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
    const client: Client = new Client();
    assert(exchange, 'Exchange cannot be empty');
    assert(queue, 'Queue cannot be empty');

    this.stompClient = client;
    this.exchange = exchange;
    this.queue = queue;

    const ls = localStorage.getItem('suffix');
    console.log('locally', ls);
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

      this.subscription = this.stompClient.subscribe(this.queue, (message) => {
        if (typeof this.onMessage === 'function') {
          this.onMessage(message);
        }
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
