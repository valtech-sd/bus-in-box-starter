/**
 * Actions...
 * 
 * Look to https://github.com/valtech-sd/rule-harvester for more information and additional examples of how actions can be configured
 */
// Package Dependencies
const _ = require('lodash');
const { ICoreHttpResponseAction } = require('rule-harvester');

// Bring in our AMQP Broker configuration
const amqpConfig = require('../../conf/amqp-config');
const logger = require('../custom_logger');

// These are just example closures to transform the data
module.exports = [
  {
    name: "logger",
    handler(facts, context) {
      logger.info("[logger] ", facts, context);
      return facts;
    }
  },
  {
    /**
     * prepareAmqpPublishAction
     *
     * Takes an order facts object and adds an <ICoreAmqpPublishAction>amqpPublishAction object
     * so that an AMQP Output can send the order to a broker.
     *
     * Of course, this one is only useful IF the rules engine instance has an AMQP Output as one
     * of its outputs.
     *
     * @param - facts
     * @param - context
     * @return - Build the dispatch
     **/
    name: 'prepareAmqpPublishAction',
    handler(facts, context) {
      // The AMQP Output expects amqpPublishAction, so we add that to facts
      // Note that this supports an ARRAY to send multiple messages!
      let topic = '';
      if (facts && facts.data && facts.data.topic) {
        topic = facts.data.topic;
      }

      logger.info("🪢 🚀  Topic", topic, "//", facts);
      facts.httpRequest;
      facts.amqpPublishAction = [
        {
          // REQUIRED: amqpPublishExchange is the exchange to send the message to
          amqpPublishExchange: amqpConfig.exampleExchangeOutput,
          // REQUIRED: amqpMessageContent is set to whatever it is we want to publish to the broker. Must be a string, Buffer, ArrayBuffer, Array, or Array-like object
          amqpMessageContent: JSON.stringify(facts.data),
          // OPTIONAL: Routing key is used by PUBLISH and the Exchange to route the message to a queue
          // based on your RMQ Exchange/Queue configuration.
          // In this demo, the routing key is used for directing activity to particular types of clients (eg ambient lighting, audio, etc).
          amqpPublishRoutingKey: topic,

          // OPTIONAL: amqpPublishOptions is an object conforming to AMQPLIB's PUBLISH OPTIONS.
          // See: https://www.squaremobius.net/amqp.node/channel_api.html#channel_publish
          amqpPublishOptions: {},
        },
        // Could send other messages here also by including more entries of <ICoreAmqpPublishAction>
        // {
        //   amqpPublishExchange: '',
        //   amqpMessageContent: '',
        //   amqpPublishRoutingKey: '',
        //   amqpPublishOptions: {}
        // }
      ];

      logger.info("🪢 🚀  🐰 👋", facts);

      // Return the modified facts.
      return facts;
    },
  },

];