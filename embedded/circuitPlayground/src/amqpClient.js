import util from 'util';

import amqpConfig from './conf/config.js';
import Cacoon from 'amqp-cacoon';
const AmqpCacoon = Cacoon.default;
import { logger } from './custom_logger.js';
import amqp from 'amqp-connection-manager';
const now = () => { return new Date().toISOString(); };
var amqpCacoon = undefined;

// Since the AMQP Input requires an AMQP Cacoon object, let's start by creating that.
// AMQP Cacoon is a library that makes it easy to connect to RabbitMQ.
const configureAmqp = () => {
  const bindQ = async (queue, exchange, key) => {

  };
  let ac = new AmqpCacoon({
    protocol: amqpConfig.protocol,
    username: amqpConfig.username,
    password: amqpConfig.password,
    host: amqpConfig.host,
    port: amqpConfig.port,
    amqp_opts: amqpConfig.amqp_opts,
    providers: {
      logger: logger,
    },
    onBrokerConnect: async (connection, url) => {
      // This is an example "Connect" event fired off by AMQP Connection Manager
      logger.debug(
        `Connected to broker: "${amqpConfig.host}" on port ${amqpConfig.port} over "${amqpConfig.protocol}".`
      );
    },
    onBrokerDisconnect: async (err) => {
      // This is an example "Disconnect" event fired off by AMQP Connection Manager
      logger.error(`Broker disconnected with error "${err.err.message}"`);
    },
    // Important - onChannelConnect will ensure a certain configuration exists in RMQ.
    // This might not be needed in environments where RMQ is set up by some other process!
    onChannelConnect: async (channel) => {
      try {
        // Notice all of these are done in sequence with AWAIT. This is so that each
        // operation can depend on the prior operation having finished. This is important
        // when binding Queues to Exchanges, for example, because you need both the
        // Exchange and Queue to exist prior to trying to bind them together.

        // Make sure we have our example queue
        await channel.assertQueue(amqpConfig.exampleQueue, {
          autoDelete: true,
          durable: true,
        });

        // Make sure we have our example exchange
        await channel.assertExchange(amqpConfig.exampleExchange, 'topic', {
          autoDelete: false,
          durable: true,
        });

        // Bind the new Exchange and Queue together
        await channel.bindQueue(
          amqpConfig.exampleQueue,
          amqpConfig.exampleExchange,
          'table' // Empty routing key to match anything published without one! (Messages published into this
          // exchange without a routing key WILL be sent to the bound queue.
        );
        logger.info(`${now()} Connected to exchange '${amqpConfig.exampleExchange}' and queue '${amqpConfig.exampleQueue}' on key 'table'`);

        await channel.bindQueue(
          amqpConfig.exampleQueue,
          amqpConfig.exampleExchange,
          'room' // Empty routing key to match anything published without one! (Messages published into this
          // exchange without a routing key WILL be sent to the bound queue.
        );
        // logger.info(`${now()} Connected to exchange '${amqpConfig.exampleExchange}' and queue '${amqpConfig.exampleQueue}' on key 'room'`);
        // await channel.bindQueue(
        //   amqpConfig.exampleQueue,
        //   amqpConfig.exampleExchange,
        //   '*' // a "*"* routing key to match everything published to the exchange!
        // );
        // logger.info(`${now()} Connected to exchange '${amqpConfig.exampleExchange}' and queue '${amqpConfig.exampleQueue}' on key '*'`);

      } catch (ex) {
        logger.error(`onChannelConnect ERROR: ${util.inspect(ex.message)}`);
        // If we can't complete our connection setup, we better throw because it's unlikely we'll
        // be able to properly consume messages!
        throw ex;
      }
    },
  });
  return ac;
};



// And finally, we can set up, let's create a main method to hold our logic...
async function startListening(messageHandler) {
  // Run the Example!
  logger.info(
    `About to register a consumer for your AMQP host "${amqpConfig.host}"`
  );
  amqpCacoon = configureAmqp(amqpConfig);
  console.log(amqpCacoon.getConsumerChannel);
  // Connects and sets up a subscription channelWrapper
  await amqpCacoon.getConsumerChannel();

  // Register a consumer to consume single message at a time
  await amqpCacoon.registerConsumer(
    amqpConfig.exampleQueue,
    async (channelWrapper, msg) => {
      try {
        console.log(`${now()} Message content: ${msg.content.toString()}`);
        console.log(msg.fields);
        //This would be one place to filter on keys
        if (msg) { messageHandler(msg); };
        // ... Do other processing here
        channelWrapper.ack(msg); // To ack a messages
      } catch (e) {
        // Some error happened in our handling of the message.
        // The bet practice is to NACK the message so that some other process retries!
        channelWrapper.nack(msg); // To nack a messages we could not handle (by default, will requeue)
      }
    }
  );
}


export { startListening };