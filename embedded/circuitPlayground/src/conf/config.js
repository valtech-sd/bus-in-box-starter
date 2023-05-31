import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

import assert from 'assert';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* 
These may be the same ones used by the rules engine, or more appropriately
another user in an externally-facing service.
*/
assert(process.env.AMQPUSERNAME, "Missing amqp username in .env");
assert(process.env.AMQPPASSWORD, "Missing amqp password in .env");
assert(process.env.AMQPCACERTNAME, "Missing amqp CA Cert file in .env");

import fs from 'fs';

// Enter either "amqp" or "amqps"
const protocol = 'amqps';

const amqpConfig = {
  // Protocol should be "amqps" or "amqp"
  protocol: protocol,
  // Username + Password on the RabbitMQ host
  username: process.env.AMQPUSERNAME,
  password: process.env.AMQPPASSWORD,
  // Host
  host: 'localhost',
  // Port AMQPS=5671, AMQP=5672
  port: protocol === 'amqps' ? 5671 : 5672,
  // AMQP Options which should conform to <AmqpConnectionManagerOptions>
  amqp_opts: {
    // Pass options to node amqp connection manager (a wrapper around AMQPLIB)
    // See connect(urls, options) in https://www.npmjs.com/package/amqp-connection-manager
    heartbeatIntervalInSeconds: 5, // Default
    reconnectTimeInSeconds: 5, // Default

    // Pass options into the underlying AMQPLIB.
    // See AMQPLIB SocketOptions https://www.squaremobius.net/amqp.node/channel_api.html#connect
    connectionOptions: {
      // If using AMQPS, we need to pass the contents of your CA file as a buffer into the broker host via amqp_opts.
      // This is facilitated for you here. Just copy your CA CERT file to the same location as this config file
      // then edit the secrets.json file to enter the NAME of your CA CERT file! Don't forget to set 'amqps' and
      // 'port' to the corresponding AMQPS values also in this configuration!
      // See https://www.squaremobius.net/amqp.node/ssl.html for more details.
      ca:
        protocol === 'amqps'
          ? [
            fs.readFileSync(
              __dirname + '/' + process.env.AMQPCACERTNAME || 'ca_certificate.pem'
            ),
          ]
          : null,
    },
  },
  // exampleQueue: 'input-control',
  // exampleExchange: 'control-events',
  // exampleQueueOutput: 'input-control',
  // exampleExchangeOutput: 'control-events',

  effectsQueue: "fx-queue",
  effectsExchange: "fx-exchange",
  exampleQueueRpcResponse: '', // not used in this sample. See https://github.com/valtech-sd/rule-harvester/ for directions and usage
};

export default amqpConfig;
