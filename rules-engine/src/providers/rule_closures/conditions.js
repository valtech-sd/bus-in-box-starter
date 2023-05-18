const _ = require('lodash');
const amqpConfig = require('../../conf/amqp-config');
const logger = require('../custom_logger');
const { log } = require('console');


/**
 * These are the conditions checks - true/fals - pass/fail - that get run in the `when` section of a particular rule
 * true continues evaluating the "then"s of a rule, false continues to the next rule set.  See https://github.com/valtech-sd/rule-harvester/blob/master/examples/src/providers/rule_closures/conditions.js for more samples
 */
module.exports = [
  {
    name: 'incoming-http-request',
    handler(facts, context) {
      logger.debug("🌤️ 😎 ", facts);
      const isHttp = (
        (
          facts.httpRequest
          && facts.httpRequest.body
          && facts.httpRequest.headers['content-type'] === "application/json"
          && facts.httpRequest.method === 'POST'
        )
        && (!facts.amqpMessage)
      );
      if (isHttp) {
        logger.debug("🌤️ 😎 Yes, http");
      } else {
        logger.debug("🌤️ 😎 Not Http");
      }
      return isHttp;
    }
  },
  {
    // This would be a good place to possibly check for some required data, if not other,
    // more complex rules. Ideally we check for "is an a _particular_ kind of amqp message"
    // and then act on that...
    name: 'isIncomingAmqp',
    handler(facts, context) {
      logger.trace("🚪 👋 isIncomingAmqp?", facts);
      if (facts.httpRequest) {
        logger.trace("🚪 👋 Nope (HTTP)");
        return false;
      } else if (!facts.amqpMessage) {
        logger.trace("🚪 👋 Nope (Something else)");
        return false;
      }

      logger.trace("🚪 👋 Yes! isIncomingAmqp!");

      logger.trace("🚪 👋 ??? ", facts.amqpMessage.amqpMessageFields.exchange === amqpConfig.exampleExchangeOutput, ">>", facts.amqpMessage.amqpMessageFields.exchange, "vs", amqpConfig.exampleExchangeOutput);
      const isActionable = (
        facts.amqpMessage &&
        facts.amqpMessage.amqpMessageFields &&
        facts.amqpMessage.amqpMessageFields.exchange &&
        facts.amqpMessage.amqpMessageFields.exchange !== amqpConfig.exampleExchangeOutput
      );
      logger.trace("🚪 👋 isActionable AMQP?", isActionable);
      return isActionable;
    }
  },
  {
    name: 'is-control-activity',
    handler(facts, context) {
      logger.debug('🎛️ --> is control activity?', facts,);
      const possibleInteractions = [
        "interaction",
        'motion',
        'button-press'
      ];
      if (facts && facts.data && possibleInteractions.indexOf(facts.data.event) > -1) {
        logger.debug("🎛️ --> ✅ Yep");
        return true;
      }
      logger.debug("🎛️ --> Nope");
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