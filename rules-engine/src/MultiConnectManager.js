const logger = require('./providers/custom_logger');
var assert = require('assert');

const util = require('util');
// Bring in Package Dependencies
const { default: RulesHarvester, CoreInputAmqp, CoreInputHttp,
  CoreInputHttpResponseType,
  ICoreHttpResponseAction,
  CoreOutputAmqp,
} = require('rule-harvester');
const AmqpCacoon = require('amqp-cacoon').default;

// Bring in other Application Specific dependencies
const ruleClosures = require('./providers/rule_closures');
const ruleCorpus = require('./providers/rule_corpus');

// Bring in our AMQP Broker configuration
const amqpConfig = require('./conf/amqp-config');


class MultiConnectManager {
  amqpCacoon = null;
  amqpInputProvider = null;
  httpInputProvider = null;

  amqpOutputCacoon = null;
  amqpOutputProvider = null;


  rulesHarvester = null;

  constructor() {
    logger.info('Creating connection manager');

    this.amqpCacoon = this.configureAmqp();
    this.amqpInputProvider = this.configureAmqpInputProvider(this.amqpCacoon);
    this.httpInputProvider = this.configureHttpProvider([3333]);

    this.amqpOutputCacoon = this.configureAmqpOutput();
    this.amqpOutputProvider = this.configureAmqpOutputProvider(this.amqpOutputCacoon);
    this.rulesHarvester = this.configureRulesHarvester({
      inputs: [this.amqpInputProvider, this.httpInputProvider],
      outputs: [this.amqpOutputProvider],
      corpus: ruleCorpus,
      ruleClosures,
      logger: logger
    });
  }

  start = () => {
    assert(this.rulesHarvester);
    this.rulesHarvester.start();
    logger.info(
      `RuleHarvester Example AMQP INPUT started. Send a order via a message into your broker's queue "${amqpConfig.exampleQueue}" then view the output in ./examples/output_order_dispatch.`
    );
    logger.info(
      `An easy way to send messages is to open one of the example order files, then paste the contents into the RabbitMQ console. Under QUEUES, click into "${amqpConfig.exampleQueue}" and notice there is a publish message section. Paste the contents of one of the order files in there and click PUBLISH MESSAGE.`
    );
  };


  // Returns a configured AMQP coccoon
  configureAmqp = () => {
    let amqpCacoon = new AmqpCacoon({
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
            '' // Empty routing key to match anything published without one! (Messages published into this
            // exchange without a routing key WILL be sent to the bound queue.
          );
        } catch (ex) {
          logger.error(`onChannelConnect ERROR: ${util.inspect(ex.message)}`);
          // If we can't complete our connection setup, we better throw because it's unlikely we'll
          // be able to properly consume messages!
          throw ex;
        }
      },
    });
    return amqpCacoon;
  };

  configureAmqpInputProvider = (amqpCacoon) => {
    assert(amqpCacoon, "Missing amqpCacoon parameter");
    const coreInputAmqpProviderOptions = {
      requeueOnNack: false,
      inputContextCallback: (msg) => {
        return {
        };
      },
    };

    const coreInputAmqpProvider = new CoreInputAmqp(
      amqpCacoon,
      amqpConfig.exampleExchange,
      logger,
      coreInputAmqpProviderOptions
    );
    return coreInputAmqpProvider;
  };

  configureAmqpOutput = () => {
    let outputCacoon = new AmqpCacoon({
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
          `🍉 Connected to broker: "${amqpConfig.host}" on port ${amqpConfig.port} over "${amqpConfig.protocol}".`
        );
      },
      onBrokerDisconnect: async (err) => {
        // This is an example "Disconnect" event fired off by AMQP Connection Manager
        logger.error(`Broker disconnected with error "${err.err.message}"`);
      },
      // Important - onChannelConnect will ensure a certain configuration exists in RMQ.
      // This might not be needed in environments where RMQ is setup by some other process!
      onChannelConnect: async (channel) => {
        try {
          await channel.assertQueue(amqpConfig.exampleQueueOutput, {
            autoDelete: true,
            durable: true,
          });

          await channel.assertQueue(
            amqpConfig.exampleQueueOutput,
            {
              autoDelete: true,
              durable: true,
            }
          );

          await channel.assertExchange(amqpConfig.exampleExchangeOutput, 'topic', {
            autoDelete: false,
            durable: true,
          });

          await channel.bindQueue(
            amqpConfig.exampleQueueOutput,
            amqpConfig.exampleExchangeOutput,
            '' // Empty routing key to match anything published without one! (Messages published into this
            // exchange without a routing key WILL be sent to the bound queue.
          );

          await channel.bindQueue(
            amqpConfig.exampleQueueOutput,
            amqpConfig.exampleExchangeOutput,
            ''// Messages published to the exchange with this routing-key specifically will be sent
          );
        } catch (ex) {
          logger.error(`onChannelConnect ERROR: ${util.inspect(ex.message)}`);
          throw ex;
        }
      }
    });
    return outputCacoon;
  };

  configureAmqpOutputProvider = (outputCacoon) => {
    assert(outputCacoon, "Missing outputCacoon parameter");
    const coreOutputAmqpProvider = new CoreOutputAmqp(
      outputCacoon, // Our amqpCacoon object manages RMQ connections
      logger // This is the logger the libraries will use when logging anything.
      // Note it has to be a log4js logger!
    );
    return coreOutputAmqpProvider;
  };

  configureHttpProvider = (ports) => {
    const httpPorts = ports || [3333];
    const coreInputHttpProviderOptions = {
      inputContextCallback: (httpRequest) => {
        return {
          // We don't do anything with the httpRequest here, but we could if necessary.
        };
      },
      //
      // Next, set the responseMode for the HTTP Input. What is this? When we receive an HTTP
      // request, we can respond to it which is customary in HTTP APIs.
      // - CoreInputHttpResponseType.OutputAfterRulePass - The HTTP response will be done after a response
      //   from the rules engine is received. Allows for the rules engine to control the response.
      // - CoreInputHttpResponseType.OutputEmptyResponse - The HTTP response will be done right away with
      //   an empty body and http status code 200.
      // - CoreInputHttpResponseType.OutputStaticResponse - The HTTP response will be done right away, but
      //   will use the body, status code and other properties implemented in a valid <OutboundResponse>.
      //   The property staticHttpResponse must also be provided with a valid <OutboundResponse>.
      //
      // For this example, we will wait for the rules engine to respond, then we respond
      // to the Http request based on that!
      responseMode: CoreInputHttpResponseType.OutputAfterRulePass,
      // responseMode: CoreInputHttpResponseType.OutputStaticResponse,

      // Note that if you instead choose 'CoreInputHttpResponseType.OutputStaticResponse'
      // then you must also set the staticHttpResponse object as follows: (this is not being
      // used in this example, but here for illustration purposes.)
      staticHttpResponse: new ICoreHttpResponseAction(
        { message: 'Received. Thank you for your request. 🏄‍♂️' },
        202
      ),
    };

    const coreInputHttpProvider = new CoreInputHttp(
      httpPorts,
      logger,
      coreInputHttpProviderOptions
    );

    return coreInputHttpProvider;
  };

  configureRulesHarvester = ({ inputs, outputs, corpus, ruleClosures, logger }) => {
    assert(inputs, "Missing inputs provider");
    assert(outputs, "Missing output providers");
    assert(corpus, "Missing rules corpus");
    assert(ruleClosures, "Missing rules closures");
    assert(logger, "Missing logger");

    let rulesHarvester = new RulesHarvester({
      providers: {
        inputs,
        outputs,
        corpus,
        closures: ruleClosures,
        logger,
      },
    });
    return rulesHarvester;
  };
}

const manager = new MultiConnectManager();
module.exports = manager;