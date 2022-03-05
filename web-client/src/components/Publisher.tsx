import { MouseEvent, useEffect, useRef, useState } from 'react';

import Stomper from '@/common/stomp-connect';

const publishRoot = '/exchange/input-control';

const Publisher = () => {
  const stompRef = useRef<Stomper | null>(null);

  const publishAmbient = (e: MouseEvent) => {
    console.info('Click', e);
    const msg = {
      event: 'interaction',
      message: 'Hello World.',
      publisherID: 'B3312',
      sequence: 'single-glow',
      location: "room1",
      device: "deviceB"
    };

    console.log(JSON.stringify(msg, null, 4));
    stompRef.current?.publish(msg, `${publishRoot}`);
  };

  const publishRoom = (e: MouseEvent) => {
    const msg = {
      event: 'motion',
      sequence: 's1',
      device: "deviceC"

    };
    stompRef.current?.publish(msg, `${publishRoot}`);
  };

  const publishInteractive = (e: MouseEvent) => {
    const msg = {
      event: 'button-press',
      sequence: 's1',
      device: "deviceA"

    };
    stompRef.current?.publish(msg, `${publishRoot}`);
  };

  const [wsConnected, setWsConnected] = useState(false);
  const [bgColor, setBgColor] = useState('bg-gray-200');

  const connect = (e: any) => {
    console.warn('****************************************');
    console.log('Connecting', e);

    // console.log('Local', localStorage.getItem('suffix'));
    console.log('Connecting to suffix');
    stompRef.current?.configure(
      `${publishRoot}`,
      `${publishRoot}/`
    );
    stompRef.current?.stompClient?.activate();
    setWsConnected(true);
  };
  
  useEffect(() => {
    if (wsConnected) {
      setBgColor('bg-emerald-500');
    } else {
      setBgColor('bg-gray-200');
    }
  }, [wsConnected]);

  useEffect(() => {
    stompRef.current = new Stomper();
    stompRef.current.onDisconnect = () => {
      setWsConnected(false);
    };
    return () => {
      console.log('Bye');
    };
  }, []);
  let connectStyle;
  if(wsConnected){
    connectStyle = 'bg-emerald-100 border-2 border-lime-400'
  } else {
    connectStyle = 'bg-gray-400 border-gray-600 hover:bg-emerald-400'
  }
  const actionStyle = 'inline p-2 mx-4 bg-white/100 hover:bg-white/90 border-gray-200 hover:border-emerald-300 border border-2 rounded-xl p-4'
  return (
    <div
      id="PublisherContainer"
      className={`${bgColor} transition-all duration-500 p-2`}
    >
      <button
        onClick={connect}
        className={`inline p-4 border ${connectStyle} rounded-xl`}
        disabled={!!wsConnected}
      >
        {`${wsConnected ? 'Connected' : 'Connect'}`}
      </button>
      {wsConnected && <div className="inline ml-8">
      <button onClick={publishAmbient} className={actionStyle}>
        Ambient
      </button>
      <button onClick={publishRoom} className={actionStyle}>
        Room
      </button>
      <button onClick={publishInteractive} className={actionStyle}>
        Lamps
      </button>
      </div>}
    </div>
  );
};

export default Publisher;
