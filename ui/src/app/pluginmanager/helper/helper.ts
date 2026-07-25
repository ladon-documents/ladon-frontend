import { HttpEvent, HttpEventType, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { ChannelList } from '../models/pluginmanager.models';

const isHttpResponse = <T>(event: HttpEvent<T>): event is HttpResponse<T> => {
  return event.type === HttpEventType.Response || event.type === HttpEventType.ResponseHeader;
};

const isHttpProgressEvent = (event: HttpEvent<unknown>): event is HttpProgressEvent => {
  return event.type === HttpEventType.DownloadProgress || event.type === HttpEventType.UploadProgress;
};

export const sortChannels = (channels: Array<ChannelList>): Array<ChannelList> => {
  const moveInArray = (arr: Array<any>, from: number, to: number) => {
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      throw new Error('No Array');
    }
    const item = arr.splice(from, 1);

    if (!item.length) {
      throw new Error('There is no item in the array at index ' + from);
    }
    arr.splice(to, 0, item[0]);
  };
  channels.sort();
  const stable = channels.findIndex((item) => item.channel === 'stable');
  if (stable !== -1) {
    moveInArray(channels, stable, 0);
  }
  return channels;
};

export const isEmpty = (obj: Object): boolean => {
  return Object.keys(obj).length === 0;
};
