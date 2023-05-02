import assert from 'assert';
import React, { useEffect, useRef, useState } from 'react';
import { IMessage } from '@stomp/stompjs';
import Stomper from '@/common/stomp-connect';
import { ClientMessage } from '@/common/types/ClientMessage';

/**
 * The Light component is a virtual lighting element, to mimic the side effects of some types
 * of system control commands coming from the message bus. You can add _many_ of these to a dashboard page,
 * as they are built to be self-contained. Just be aware that each one sets up its own Web-Stomp connection,
 * which will tie up resources, though the implications may be negligible.
 */

export enum LightType {
  Room = 'room',
  Lamp = 'lamp',
  Ambient = 'ambient',
}

export type ColorSequence = {
  background: string[];
  shadow: string[];
  duration?: number;
};
export type LightSequenceColors = { [id: string]: ColorSequence };

const Sequences: LightSequenceColors = {
  s1: {
    background: [ ],
    shadow: [ //these are all here because tailwind will remove unused classes from it's output CSS
      'shadow-purple-500/50',
      'shadow-pink-500/50',
      'shadow-violet-500/50',
      'shadow-blue-500/50',
      'shadow-green-500/50',
      'shadow-yellow-300/50',
    ],
  },
  'single-glow': {
    background: ['bg-none'],
    shadow: ['shadow-pink-500/50'],
    duration: 5000,
  },
};

export type LightProps = {
  type: LightType;
};

/**
 *
 * @param loc The type of the lights, which will let this component know what messages to consume
 */
const Light: React.FC<LightProps> = ({ children, type }) => {
  const offlineColor = 'bg-yellow-200';
  const onlineColor = 'bg-white';
  const errorColor = 'bg-red-500';
  const idleColor = 'bg-gray-200';
  const idleShadow = 'shadow-gray-500/50';
  const stompRef = useRef<Stomper | undefined>();
  const qRef = useRef<string>('/exchange/control-events/');

  const [wsConnected, setWsConnected] = useState(false);
  const [statusColor, setStatusColor] = useState(idleColor);
  const [shadowColor, setShadowColor] = useState('shadow-yellow-200/50');

  const [message, setMessage] = useState<ClientMessage | null>();

  const displaySequence = (sequence: ColorSequence, finished?: () => void) => {
    const backgrounds: string[] = sequence.background;
    const duration = sequence.duration || 750;

    backgrounds.map((color: string, idx: number) => {
      setTimeout(() => {
        setStatusColor(color);
      }, duration * idx);
      return null;
    });
    setTimeout(() => {
      setStatusColor(onlineColor);
    }, duration * backgrounds.length);

    const shadows: string[] = sequence.shadow;
    shadows.map((color: string, idx: number) => {
      setTimeout(() => {
        setShadowColor(color);
      }, duration * idx);
      return null;
    });

    setTimeout(() => {
      setShadowColor(idleShadow);
    }, duration * shadows.length);

    const fullestDur = duration * Math.max(shadows.length, backgrounds.length);
    setTimeout(() => {
      if (finished) {
        finished();
      }
    }, fullestDur);
  };

  useEffect(() => {
    stompRef.current = new Stomper();
    stompRef.current.onDisconnect = () => {
      setWsConnected(false);
    };
    assert(stompRef.current, 'Missing reference to STOMP client');
    stompRef.current.onMessage = (blob: IMessage) => {
      try {
        // console.log(blob);

        const msg: ClientMessage = JSON.parse(blob.body);

        setMessage(msg);
        console.info(qRef.current.split("/").pop(), msg)
        
      } catch (err) {
        setStatusColor(errorColor);
        console.error(`Light ${type} err`, err);
      }
    };
    let key: string = '';
    switch (type) {
      case LightType.Room: {
        key = 'room';
        break;
      }
      case LightType.Lamp: {
        key = 'table';
        break;
      }
      case LightType.Ambient: {
        key = 'ambient';
        break;
      }
      default: {
        key = '';
        break;
      }
    }

    qRef.current = `/exchange/control-events/${key}`;
    stompRef.current.configure('/exchange/control-events', qRef.current);

    // eslint-disable-next-line no-console
    console.log(`Light ${type} // subscribing to`, qRef.current);

    assert(stompRef.current.stompClient, 'StompClient is not available');
    stompRef.current.stompClient.activate();
    setWsConnected(true);
  }, []);

  useEffect(() => {
    const newColor = wsConnected ? onlineColor : offlineColor;
    setStatusColor(newColor);
    setShadowColor(idleShadow);
  }, [wsConnected]);

  useEffect(() => {
    if (message?.sequence) {
      if (message.sequence) {
        const seqName = message.sequence;
        const sequence: ColorSequence | undefined = Sequences[seqName];
        if (sequence) {
          displaySequence(sequence, () => {
            setMessage(null);
          });
        }
      }
      return;
    }

    if (message) {
      setTimeout(() => {
        setMessage(null);
      }, 2000);
    }
  }, [message]);

  return (
    <div className="flex flex-col space-y-8 py-2 h-max">
      <div
        className={`${statusColor} shadow-lg ${shadowColor} transition-all ease-in-out duration-250 p-2 relative `}
      >
        <div className="bg-green-300 min-h-max text-sm absolute -top-2 -right-2 rounded-full px-3">
          {message?.event}
        </div>

        <div>
          <span className="text-sm">type:</span> {type}
        </div>
        <div className="font-mono  text-sm tracking-tighter">
          Q: {stompRef.current && stompRef.current.queue}
        </div>
      </div>
      {children}
    </div>
  );
};

export default Light;
