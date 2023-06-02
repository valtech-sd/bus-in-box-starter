/* eslint-disable no-console */

import Light, { LightType, TriggerSequence } from '@/components/Light';
import Publisher from '@/components/Publisher';
import { Meta } from '@/layout/Meta';
import { Main } from '@/templates/Main';
import React from 'react';

export const IncomingMessageContext = React.createContext(undefined);

const Index = () => (
  <Main meta={<Meta title="Show Control Platform" description="" />}>
    <div className="text-sm">
      <div className="">
              <h2 className="font-bold border-gray-400 border-b mt-8">
                {`🟢 Let's get going...`}
              </h2>
        <ul className="list-decimal">
          <li>Click the connect button to begin the publisher session from this web interface</li>
          <li>Once connected, you'll see some action button appear. Click one! This will send a message to the AMQP exchange.</li>
          <li>
            The rules engine processes the incoming message and responds with the appropriate message. Both the web interface and the Circuit Playground Express device (if connected) will respond.
          </li>
        </ul>
      </div>

      <h2 className="font-bold border-gray-400 border-b mt-8">
        💬 Publisher Connection
      </h2>
      <div className="my-8">
      <Publisher />
      </div>

      <h2 className="font-bold border-gray-400 border-b mt-8">
        🚥 Connected Components
      </h2>
      <p className="italic">
        These components auto-connect to RabbitMQ over STOMP.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Light type={LightType.Environment} triggerSequence={TriggerSequence.Point} >
          <div className="font-sans font-extrabold italic">👉 Collected Points</div>
        </Light>

        <Light type={LightType.All} triggerSequence={TriggerSequence.Selection} >
          <div className="font-sans font-extrabold italic">🔎 Scanned Something</div>
        </Light>

        <Light type={LightType.Environment} triggerSequence={TriggerSequence.All} >
          <div className="font-sans font-extrabold italic">🚨 Environmental FX</div>
        </Light>

        <Light type={LightType.Environment} triggerSequence={TriggerSequence.Powerup} >
          <div className="font-sans font-extrabold italic">⚡️ Power Up!</div>
        </Light>
      </div>
      <p>
        ℹ️ Interesting point to know - the STOMP connection will create its own queue on the exchange and topic/key that will automatically get closed when the browser session is finished - from closing the window/tab or navigating away from the page.
      </p>


      <div className="grid grid-cols-3 gap-4">
      </div>

      <h2 className="text-l font-bold mt-8 border-b border-gray-400">
        💁 HTTP Request examples
      </h2>
      <p>
        Using the rules engine, you can use HTTP requests to fire off events.
        The rules engine will transform the HTTP content into an AMQP message
        that can be sent via the appropriate exchange and topic. Check
        `/src/providers/rule_closures/transformers.js` for the functions that
        inspect and transform the incoming data. Start with the transformer at{' '}
        <code className="bg-gray-200 text-red-700">
          name: 'prepare-lighting',
        </code>
      </p>


      <table className=" border-collapse border border-slate-400">
          <thead>
            <tr className="bg-gray-300">
              <th className="border border-slate-300  px-2 py-1">JSON</th>
              <th className="border border-slate-300   px-2 py-1">Result</th>
            </tr>
          </thead>
          <tbody className="font-mono whitespace-nowrap">
            <tr >
              <td className="whitespace-pre-line border text-red-700  border-slate-300 px-2 py-1">
                {`{ 
                  "deviceType": "taskButton",
                  "event": "button-press",
                  "deviceId": "C0C0A"
                }`}
                </td>
              <td className="whitespace-pre-line border border-slate-300 px-2 py-1">
                {`sequence: point
                  value: 1
                  topic/key: environment`}
              </td>
            </tr>

            <tr className="bg-gray-100">
              <td className="whitespace-pre-line border text-red-700 border-slate-300 px-2 py-1">
                {`{ 
                  "deviceType": "rfid-reader",
                  "event": "item-select"
                }`}
                </td>
              <td className="whitespace-pre-line border border-slate-300 px-2 py-1">
                {`sequence: selection
                topic:`}
              </td>
            </tr>
            <tr>
              <td className="whitespace-pre-line border text-red-700 border-slate-300 px-2 py-1">
                {`{ 
                  "deviceType": "proximity",
                  "event": "item-select"
                }`}
                </td>
              <td className="whitespace-pre-line border border-slate-300 px-2 py-1">
                {`sequence: glow
                  topic/key: environment`}
              </td>
            </tr>        
            <tr className="bg-gray-100">
              <td className="whitespace-pre-line border text-red-700 border-slate-300 px-2 py-1">
                {`{ 
                  "event": "recharge"
                }`}
                <br /><br />
                {`{ 
                  "event": "power-up"
                }`}
                </td>
              <td className="whitespace-pre-line border border-slate-300 px-2 py-1">
                {`sequence: /event/
                  topic/key: environment`}
              </td>
            </tr>     
          </tbody>
        </table>

      <h3 className="text-l font-bold mt-8 border-b border-gray-400">
        🖥️  Trigger via CLI (or anywhere, really)
      </h3>
      <ul className="flex flex-col gap-8">
        <li>
          <span className="font-bold">Activate Button (Collect Point):</span>
          <pre className="whitespace-normal font-mono text-sm break-words block bg-gray-200 text-red-700">{`curl -X POST -H "Content-Type: application/json" --data '{"deviceId": "C0C0A", "event": "button-press","deviceType": "taskButton"}' http://localhost:3333`}</pre>
        </li>

        <li>
          <span className="font-bold">Select Item (eg RFID Scan):</span>
          <pre className="whitespace-normal font-mono text-sm break-words block bg-gray-200 text-red-700">{`curl -X POST -H "Content-Type: application/json" --data '{"deviceType": "rfid-reader", "event": "item-select", "value": "tag-id-123", "deviceId": "C0FFEE"}' http://localhost:3333`}</pre>
        </li>

        <li>
          <span className="font-bold">Select Item (Proximity Sensor):</span>
          <pre className="whitespace-normal font-mono text-sm break-words block bg-gray-200 text-red-700">{`curl -X POST -H "Content-Type: application/json" --data '{"deviceType": "proximity", "event": "item-select", "value": "item-c", "deviceId": "F007"}' http://localhost:3333`}</pre>
        </li>
      </ul>
    </div>
  </Main>
);

export default Index;
