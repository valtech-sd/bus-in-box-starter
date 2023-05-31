export type PublishParams = {
  deviceType: string;
  deviceId: string;
  event: string;
  value?: string | number | undefined;
};


export type PublishData = {
  event: string;
  deviceId: string | undefined;
  deviceType: string | undefined;
  value?: string | number | undefined;
}