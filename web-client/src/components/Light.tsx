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
  All = "",
  Environment = "environment",
}

export enum TriggerSequence {
  All = "all",
  Point = "point",
  Powerup = "power-up",
  Goal = "goal",
  Recharge = "recharge",
  Selection = "selection",
}

export type ColorSequence = {
  background: string[];
  shadow: string[];
  duration?: number;
};

export type LightSequenceColors = { [id: string]: ColorSequence };
const shadowColors = [ //these are all here because tailwind will remove unused classes from it's output CSS
    'shadow-purple-500/50',
    'shadow-pink-500/50',
    'shadow-violet-500/50',
    'shadow-blue-500/50',
    'shadow-green-500/50',
    'shadow-yellow-300/50',
    'shadow-violet-200/50',
    'shadow-violet-800/50',
    'shadow-violet-200/50'
  ];
  const borderColors = [ //these are all here because tailwind will remove unused classes from it's output CSS
    'border-purple-500/50',
    'border-pink-500/50',
    'border-violet-500/50',
    'border-blue-500/50',
    'border-green-500/50',
    'border-yellow-300/50',
    'border-violet-200/50',
    'border-violet-800/50',
    'border-violet-200/50'
  ];

const Sequences: LightSequenceColors = {
  s1: {
    background: [ ],
    shadow:shadowColors,
},
'single-glow': {
  background: ['bg-none'],
  shadow: ['shadow-pink-500/50'],
  duration: 5000,
},

'glow': {
  background: ['bg-none'],
  shadow: ['shadow-pink-500/50'],
  duration: 5000,
},
'point': {
  background: ['bg-none'],
  shadow: ['shadow-yellow-300/50'],
  duration: 500,
},
'selection': {
  background: ['bg-none'],
  shadow: shadowColors,
  duration: 500,
},
'green-glow': {
  background: ['bg-none'],
  shadow: ['shadow-green-500/50'],
  duration: 5000,
},

"power-up": {
  background: ['bg-none'],
  shadow: ['shadow-cyan-500/50'],
  duration: 1000,
},
"goal": {
  background: ['bg-none'],
  shadow: ['shadow-teal-500/50'],
  duration: 5000,
},
"recharge": {
  background: ['bg-none'],
  shadow: [
    'shadow-violet-800/50',
    'shadow-violet-200/50',
    'shadow-violet-800/50',
    'shadow-violet-200/50',
    'shadow-violet-800/50',
    'shadow-violet-200/50',
    'shadow-violet-800/50',
    'shadow-violet-200/50',
    ],
  duration: 500,
},

default: {
  background: ['bg-none'],
  shadow: ['shadow-slate-500/50'],
  duration: 1000,   
}
};

export type LightProps = {
  type: LightType;
  triggerSequence: TriggerSequence;
};

/**
*
* @param loc The type of the lights, which will let this component know what messages to consume
*/
const Light: React.FC<LightProps> = ({ children, type, triggerSequence }) => {
  const offlineColor = 'bg-yellow-200';
  const onlineColor = 'bg-white';
  const errorColor = 'bg-red-500';
  const idleColor = 'bg-gray-200';
  const idleShadow = 'shadow-gray-500/50';
  const stompSubscriberRef = useRef<Stomper | undefined>();
  
  const clientExchange = 'fx-exchange';
  const fxQueue = "/exchange/fx-exchange"
  const qRef = useRef<string>(fxQueue);
  
  const [wsConnected, setWsConnected] = useState(false);
  const [statusColor, setStatusColor] = useState(idleColor);
  const [shadowColor, setShadowColor] = useState('shadow-yellow-200/50');
  const [messageEvent, setMessageEvent] = useState<string|undefined>();
  
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
     // this uses the default control exchange and fx-queue for write/read, respetively
    stompSubscriberRef.current = new Stomper();
    stompSubscriberRef.current.onDisconnect = () => {
      setWsConnected(false);
    };
    assert(stompSubscriberRef.current, 'Missing reference to STOMP client');
    stompSubscriberRef.current.onMessage = (blob: IMessage) => {
      try {
        // console.log(blob);
        
        const msg: ClientMessage = JSON.parse(blob.body);
        
        setMessage(msg);
        console.info(qRef.current.split("/").pop(), msg)
        
      } catch (err) {
        setStatusColor(errorColor);
        console.error(`💡 Light ${type} err`, err);
      }
    };
    
    const key = type;
    qRef.current = `${fxQueue}/${key}`;
    // qRef.current  = `${fxQueue}/`;
    stompSubscriberRef.current.configure(`/exchange/${clientExchange}`, qRef.current);
    
    // eslint-disable-next-line no-console
    console.log(`Light ${type} // subscribing to`, qRef.current);
    
    assert(stompSubscriberRef.current.stompClient, 'StompClient is not available');
    stompSubscriberRef.current.stompClient.activate();
    setWsConnected(true);
  }, []);
  
  useEffect(() => {
    const newColor = wsConnected ? onlineColor : offlineColor;
    setStatusColor(newColor);
    setShadowColor(idleShadow);
  }, [wsConnected]);
  
  useEffect(() => {
    console.log("📥 Incoming message", message);
    // console.info(message?.sequence !== triggerSequence, triggerSequence !== TriggerSequence.All)

    if(message?.sequence !== triggerSequence && triggerSequence !== TriggerSequence.All) {
      setMessageEvent(undefined);
      return
    }

    setMessageEvent(message?.event);
    if (message?.sequence) {
      const seqName = message.sequence;
      
      let sequence: ColorSequence | undefined = Sequences[seqName] || Sequences["default"];
      if(message?.deviceType == "proximity") {
        sequence = Sequences['green-glow'];
      }
      if (sequence) {
        displaySequence(sequence, () => {
          setMessage(null);
        });
      }
    } else {
      return;
    }
    
    if (message) {
      setTimeout(() => {
        setMessage(null);
      }, 6000);
    }
  }, [message]);
  // console.log("shadow:", shadowColor, message);
  return (
    <div className={`flex flex-col space-y-8 py-2 h-max`}>
      <div
        className={`${statusColor} shadow-lg ${shadowColor} transition-all ease-in-out duration-250 p-2 relative  ${shadowColor.replace("shadow-","border-")} border-2`}
      >
        <div className="bg-green-300 min-h-max text-sm absolute -top-2 -right-2 rounded-full px-3">
          { messageEvent}
        </div>
        <div className="">
          {children}
        </div>
        
        
        
        <p className="font-mono  text-xs tracking-tighter">
            
              <span className="text-sm">type:</span> {type}
              Q: {stompSubscriberRef.current && stompSubscriberRef.current.queue}<br />
              Sequence: {triggerSequence}
            
        </p>
 
      </div>
    </div>
  );
  };
  
  export default Light;
  