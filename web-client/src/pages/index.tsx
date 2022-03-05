/* eslint-disable no-console */

import Light, { LightType } from '@/components/Light';
import Publisher from '@/components/Publisher';
import { Meta } from '@/layout/Meta';
import { Main } from '@/templates/Main';

const Index = () => (
  <Main meta={<Meta title="Show Control Platform" description="" />}>
    <div className="text-sm">
      <div className="">
        {`Let's get going...`}
        <ul className="list-decimal">
          <li>Click the connect button to begin the publisher session (note: this is only needed to send commands from the web interface)</li>
          <li>
            The lighting elements will light up if any messages are received, whether sent from the web dashboard, or from a phsical device.
          </li>
        </ul>
      </div>
      <h2 className="font-bold border-gray-400 border-b mt-8">
        💬 Publisher Connection
      </h2>
      <div className="my-8">
      <Publisher />
      </div>
      <h2 className="text-l font-bold my-8 border-b border-gray-400">
        💡 Lighting Elements
      </h2>
      <div className="grid grid-cols-3 gap-4">
        <Light type={LightType.Lamp} />
        <Light type={LightType.Ambient} />
        <Light type={LightType.Lamp} />
        <Light type={LightType.Room} />
        <Light type={LightType.Lamp} />
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
          name: 'prepare-lighting'
        </code>
      </p>
      <div className="flex gap-12">
        <table className="border-collapse border border-slate-400">
          <thead>
            <tr className="bg-gray-300 text-left">
              <th colSpan={2} className="border border-slate-300">
                Effect
              </th>
            </tr>

            <tr className="bg-gray-300">
              <th className="border border-slate-300  px-2 py-1">Location</th>
              <th className="border border-slate-300   px-2 py-1">Sequence</th>
            </tr>
          </thead>
          <tbody className="font-mono whitespace-nowrap">
            <tr>
              <td className="border border-slate-300 px-2 py-1">room1</td>
              <td className="border border-slate-300 px-2 py-1">s1</td>
            </tr>
            <tr className="bg-gray-100">
              <td className="border border-slate-300 px-2 py-1">zoneA</td>
              <td className="border border-slate-300 px-2 py-1">single-glow</td>
            </tr>
          </tbody>
        </table>

        <table className="border-collapse border border-slate-400">
          <thead>
            <tr className="bg-gray-300 text-left">
              <th colSpan={2} className="border border-slate-300">
                Target
              </th>
            </tr>

            <tr className="bg-gray-300">
              <th className="border border-slate-300 px-2 py-1">Device</th>
              <th className="border border-slate-300  px-2 py-1">Topic*</th>
            </tr>
          </thead>
          <tbody className="font-mono whitespace-nowrap">
            <tr>
              <td className="border border-slate-300 px-2 py-1">deviceA</td>
              <td className="border border-slate-300 px-2 py-1">table</td>
            </tr>
            <tr className="bg-gray-100">
              <td className="border border-slate-300 px-2 py-1">deviceB</td>
              <td className="border border-slate-300 px-2 py-1">ambient</td>
            </tr>
            <tr className="bg-gray-100">
              <td className="border border-slate-300 px-2 py-1">deviceC</td>
              <td className="border border-slate-300 px-2 py-1">room</td>
            </tr>
          </tbody>
          <tfoot className="italic">
            <tr>
              <td
                colSpan={2}
              >{`*Topic describe the exchange's routing key`}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <h3 className="text-l font-bold mt-8 border-b border-gray-400">
        🖥️  Trigger via CLI (or anywhere, really)
      </h3>
      <ul className="flex flex-col gap-8">
        <li>
          <span className="font-bold">Table Display Destination:</span>
          <pre className="whitespace-normal font-mono text-sm break-words block bg-gray-200 text-red-700">{`curl -X POST -H "Content-Type: application/json" --data '{"HI":"HO CHERRY O","event":"interaction", "location":"zoneA", "device": "deviceB"}' http://localhost:3333`}</pre>
        </li>

        <li>
          <span className="font-bold">Ambient Destination:</span>
          <pre className="whitespace-normal font-mono text-sm break-words block bg-gray-200 text-red-700">{`curl -X POST -H "Content-Type: application/json" --data '{"HI":"HO CHERRY O","event":"interaction", "location":"room1", "device": "deviceA"}' http://localhost:3333`}</pre>
        </li>

        <li>
          <span className="font-bold">Room Destination:</span>
          <pre className="whitespace-normal font-mono text-sm break-words block bg-gray-200 text-red-700">{`curl -X POST -H "Content-Type: application/json" --data '{"HI":"HO CHERRY O","event":"interaction", "location":"room1", "device": "deviceC"}' http://localhost:3333`}</pre>
        </li>
      </ul>
    </div>
  </Main>
);

export default Index;
