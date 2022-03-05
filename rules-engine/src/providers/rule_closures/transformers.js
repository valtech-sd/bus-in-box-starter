const _ = require('lodash');
const { ICoreHttpError } = require('rule-harvester');
const logger = require('../custom_logger');

/**
 * These transformers do what the name implies - transforms data before passing it on to the next step
 * in the rules corpus (well, the collection of actions within a rule)
 * There are many more example transformers at https://github.com/valtech-sd/rule-harvester/blob/master/examples/src/providers/rule_closures/transformers.js
 * 
 * These tend to be fairly logger-heavy to support debugging during use. Feel free to clear it up.
 */

// These are example closures to transform the facts object
module.exports = [
  {
    /**
     * reformat-amqp-message
     * Reformat an incoming AMQP Message by pulling all the message "properties"
     * into the root of the facts object. Why? So we can use the same rules we use for the Directory Watcher Input.
     * @param - facts
     * @param - context
     * @return - facts, updated.
     **/
    name: 'reformat-amqp-message',
    async handler(facts, context) {
      // The AMQP Input gives us a special object. Check to see if this facts object is an AMQP input.
      // If the facts object is not an AMQP input, we don't need to do any work!
      // Note, this is completely application specific. A rules corpus can easily just work with
      // facts.amqpMessage!
      if (facts.amqpMessage) {
        try {
          // We have an amqpMessage so let's do some work to reformat it to make it
          // easier to process with the rules that also process the Directory Watcher Input.
          // First, we parse amqpMessageContent, which we expect to be JSON, into an object.
          const messageContent = JSON.parse(
            facts.amqpMessage.amqpMessageContent
          );
          // Next, we parse out the properties of the messageContent into the root of the facts to imitate the
          // same structure we receive from the Directory Watcher Input and so
          // we don't have to keep reaching into amqpMessageContent each time we want to pull a value.
          facts = _.merge(facts, messageContent);
        } catch (e) {
          // Yikes. Something failed, so we throw the special 'MessageValidationError' that the AMQP Input expects
          // to indicate a malformed message.
          const messageValidationError = new Error(e.message);
          messageValidationError.name = 'MessageValidationError';
          throw messageValidationError;
        }
      }
      // Return the changed object (or if it was not an AMQP input, we just return the same facts we received).
      return facts;
    },
  },
  {
    /**
     * reformat-http-request
     * Reformat an incoming http request by pulling all the request body into fact "properties"
     * in the root of the facts object. Why? So we can use the same rules we use for the Directory Watcher Input.
     * @param - facts
     * @param - context
     * @return - facts, updated.
     **/
    name: 'reformat-http-request',
    async handler(facts, context) {
      logger.debug("🐰 🐇 HTTP incoming");
      // The HTTP Input gives us a special object and the property that
      // holds our request (httpRequest).
      // httpRequest conforms to IProviderReq and contains:
      // - method: (string) - GET, PUT, DELETE, etc.
      // - body: (object) - The received BODY as an object.
      // - query: (object) - An object that has all the query string items.
      // - params?: (optional Array<string>) - This is the PATH of the request.
      if (facts.httpRequest && facts.httpRequest.body) {
        try {
          // We have an httpRequest so let's do some work to reformat it to make it
          // easier to process with the rules that also process the Directory Watcher Input.
          // We parse out the properties of the messageContent into the root of the facts to imitate the
          // same structure we receive from the Directory Watcher Input and so
          // we don't have to keep reaching into httpRequest each time we want to pull a value.
          if (!facts.data) {
            facts.data = {};
          }
          // facts = _.merge(facts, facts.httpRequest.body);
          facts.data = facts.httpRequest.body;
        } catch (e) {
          // Yikes. Something failed, so we throw the custom 'BridgeError' that the HTTP Input expects
          // to indicate a malformed message.
          throw new ICoreHttpError(500, e.message, 'reformat-http-request ERROR');
        }
      }
      // Return the changed object (or if it was not an AMQP input, we just return the same facts we received).
      return facts;
    },
  },
  {
    name: "format-incoming-amqp",
    handler(facts, context) {
      logger.debug("💘 ~~~~~>>", facts);
      try {
        if (facts && facts.amqpMessage && facts.amqpMessage.amqpMessageContent) {
          logger.warn("CONTENT IS", typeof facts.amqpMessage.amqpMessageContent);
          let data = facts.amqpMessage.amqpMessageContent;
          facts.data = JSON.parse(data);
          console.log("Data facts", facts);
        } else {
          facts.data = {};
        }
      } catch (err) {
        facts.data = {};
        logger.error("Format-incoming-amqp", err);
      }
      logger.info("Now processed", facts);
      return facts;
    }
  },
  {
    /**
     * Take the incoming, transform the data into actionable items for the recipients
     */
    name: 'prepare-lighting',
    async handler(facts, context) {
      logger.info("💡⚡️ 🛋 Prepare", facts);
      const location = facts.data.location;
      const device = facts.data.device;

      if (location === "room1") {
        facts.data.sequence = "s1";
      } else if (location === "zoneA") {
        facts.data.sequence = "single-glow";
      } else {
        facts.data.sequence = "single-glow";
      }

      logger.info("🎯 target", device);

      if (device === "deviceA" && location === "room1") {
        facts.data.topic = "room";
      } else if (device === "deviceA") {
        facts.data.topic = "table";
      } else if (device === "deviceB") {
        facts.data.topic = "ambient";
      } else if (device === "deviceC") {
        facts.data.topic = "room";
      } else {
        facts.data.topic = "";
      }

      logger.debug("💡 🔦", facts);

      return facts;
    }
  }
];
