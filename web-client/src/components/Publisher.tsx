import { MouseEvent, useEffect, useRef, useState } from 'react';

import Stomper from '@/common/stomp-connect';
import { PublishData, PublishParams } from '@/common/types/ClientTypes';

const publishRoot = '/exchange/input-control';

const Publisher = () => {
  const stompPublisherRef = useRef<Stomper | null>(null);

   const publishInteractive = (parameters?: PublishParams) => (e: MouseEvent) => {
    console.log("Action params:",parameters);
    let msg: PublishData = {
      deviceId: parameters?.deviceId,
      event: parameters?.event ? parameters.event : 'button-press',
      deviceType: parameters?.deviceType || "deviceA",
    };
    if(parameters?.value !== undefined) {
      msg.value = parameters.value
    }
    msg.deviceId = parameters?.deviceId
    
    console.log("publishIntereactive", parameters, e);

    stompPublisherRef.current?.publish(msg, `${publishRoot}`);
  };


  const [wsConnected, setWsConnected] = useState(false);
  const [bgColor, setBgColor] = useState('bg-gray-200');
  const [controlBorder, setControlBorder] = useState('border-gray-200');

  const connect = (_: any) => {
    console.warn('****************************************');
    stompPublisherRef.current?.configure(
      `${publishRoot}`,
      `${publishRoot}/`
    );
    stompPublisherRef.current?.stompClient?.activate();
    setWsConnected(true);
  };
  
  useEffect(() => {
    if (wsConnected) {
      // setBgColor('bg-emerald-500');
      setBgColor('bg-white');
      setControlBorder('border-emerald-400 border-2')
    } else {
      setBgColor('bg-gray-200');
    }
  }, [wsConnected]);

  useEffect(() => {
    stompPublisherRef.current = new Stomper();
    stompPublisherRef.current.onDisconnect = () => {
      setWsConnected(false);
    };
    return () => {
      console.info('Bye');
    };
  }, []);
  let connectStyle;
  if(wsConnected){
    connectStyle = 'bg-emerald-100 border-2 border-teal-400'
  } else {
    connectStyle = 'bg-gray-400 border-gray-600 hover:bg-emerald-400'
  }
  const actionStyle = 'inline p-3 mx-2 bg-white/100 hover:bg-white/90 border-gray-200 hover:border-emerald-300 border border-2 rounded-xl active:bg-emerald-200'
  return (
    <div
      id="PublisherContainer"
      className={`${bgColor} ${controlBorder} transition-all duration-500 p-2 rounded-xl `}
    >
      {!wsConnected &&
      <button
        onClick={connect}
        className={`inline p-4 border ${connectStyle} rounded-xl`}
        disabled={!!wsConnected}
      >
        {`${wsConnected ? 'Connected' : 'Connect'}`}
      </button>
}
      {wsConnected && 
      <div className="inline ml-8 inline-grid grid-cols-3 gap-2">
        <button onClick={publishInteractive({deviceType:"taskButton", event: 'button-press', deviceId: "C0C0A"})} className={actionStyle + " text-lg"}>
            Activate <br />
            <span className="text-xs">(Collect Point)</span>
          </button>

          <button onClick={publishInteractive({deviceType:"rfid-reader", event: 'item-select', value: "tag-id-123", deviceId: "C0FFEE" })} className={actionStyle + " text-lg"}>
            Select Item <br />
            <span className="text-xs">(RFID Scan)</span>
          </button>

          <button onClick={publishInteractive({deviceType:"proximity", event: 'item-select', value: "item-c", deviceId: "F007"})} className={actionStyle + " text-lg"}>
            Select Item <br />
            <span className="text-xs">(Proximity Sensor)</span>
          </button>
    
          <button onClick={publishInteractive({deviceType:"button-press", event: 'power-up', value: "100", deviceId: "F007"})} className={actionStyle + " text-lg"}>
            Power Up! <br />
            <span className="text-xs">(Proximity Sensor)</span>
          </button>

          <button onClick={publishInteractive({deviceType:"button-press", event: 'recharge', value: "100", deviceId: "F007"})} className={actionStyle + " text-lg"}>
            Recharge <br />
            <span className="text-xs">(Proximity Sensor)</span>
          </button>

          <button onClick={publishInteractive({deviceType:"taskButton", event: 'button-press', deviceId: "F007"})} className={actionStyle + " text-lg"}>
            Default (Twinkle) <br />
            <span className="text-xs">(Proximity Sensor)</span>
          </button>

      </div>}
    </div>
  );
};

export default Publisher;
