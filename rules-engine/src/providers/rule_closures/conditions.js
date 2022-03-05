const _ = require('lodash');
const amqpConfig = require('../../conf/amqp-config');
const logger = require('../custom_logger');


/**
 * These are the conditions checks - true/fals - pass/fail - that get run in the `when` section of a particular rule
 * true continues evaluating the "then"s of a rule, false continues to the next rule set.  See https://github.com/valtech-sd/rule-harvester/blob/master/examples/src/providers/rule_closures/conditions.js for more samples
 */
module.exports = [
  {
    name: 'incoming-http-request',
    handler(facts, context) {
      return (
        (
          facts.httpRequest
          && facts.httpRequest.body
          && facts.httpRequest.headers['content-type'] === "application/json"
          && facts.httpRequest.method === 'POST'
        )
        && (!facts.amqpMessage)
      );
    }
  },
  {
    name: 'isIncomingAmqp',
    handler(facts, context) {
      logger.info("🚪 👋 isIncomingAmqp", facts);
      if (facts.httpRequest) {
        return false;
      }

      logger.info("??? ", facts.amqpMessage.amqpMessageFields.exchange === amqpConfig.exampleExchangeOutput, ">>", facts.amqpMessage.amqpMessageFields.exchange, "vs", amqpConfig.exampleExchangeOutput);
      return (
        facts.amqpMessage &&
        facts.amqpMessage.amqpMessageFields &&
        facts.amqpMessage.amqpMessageFields.exchange &&
        facts.amqpMessage.amqpMessageFields.exchange !== amqpConfig.exampleExchangeOutput
      );

    }
  },
  {
    name: 'is-control-activity',
    handler(facts, context) {
      logger.debug('🎛️ --> ', facts,);
      const possibleInteractions = [
        "interaction",
        'motion',
        'button-press'
      ];
      if (facts && facts.data && possibleInteractions.indexOf(facts.data.event) > -1) {
        logger.debug("✅");
        return true;
      }
      return false;
    }
  },

  {
    name: "isChat",
    handler(facts, context) {
      logger.debug("📐 IS IT CHAT?", facts.user);
      if (facts.amqpMessage && facts.amqpMessage.amqpMessageContent) {
        const data = JSON.parse(facts.amqpMessage.amqpMessageContent);
        if (facts.user && facts.user.length > 0) {
          logger.info("Indeed yes");
          return true;
        }
      }
      return false;
    }
  },

];