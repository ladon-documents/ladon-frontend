import { Injectable } from '@angular/core';
export enum LogLevel {
  ALL,
  DEBUG,
  INFO,
  WARN,
  ERROR,
  OFF,
}

type LogLevelStrings = keyof typeof LogLevel;

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private logLevel: LogLevel = LogLevel.ALL;
  logWithDate: boolean = true;

  constructor() {
    this.logLevel = LogLevel.OFF;
  }

  clear() {
    console.clear();
  }

  public setLevel(key: LogLevel): void {
    const level = Number(LogLevel[key]);
    if (!(LogLevel.ALL <= level && level <= LogLevel.OFF)) {
      throw new Error('Invalid log level');
    }
    this.logLevel = level;
  }

  public debug(msg: string, ...args: unknown[]): void {
    this.write(msg, LogLevel.DEBUG, args);
  }

  public log(msg: string, ...args: unknown[]): void {
    this.write(msg, LogLevel.ALL, args);
  }

  public info(msg: string, ...args: unknown[]): void {
    this.write(msg, LogLevel.INFO, args);
  }

  public warn(msg: string, ...args: unknown[]): void {
    this.write(msg, LogLevel.WARN, args);
  }

  public error(msg: string, ...args: unknown[]): void {
    this.write(msg, LogLevel.ERROR, args);
  }

  private write(msg: string, level: LogLevel, params: unknown[]): void {
    if (this.shouldLog(level)) {
      let entry: LogEntry = new LogEntry();
      entry.message = msg;
      entry.level = level;
      entry.extraInfo = params;
      entry.logWithDate = this.logWithDate;
      console.log(entry.createLog());
    }
  }

  private shouldLog(level: LogLevel) {
    if ((level >= this.logLevel && level !== LogLevel.OFF) || this.logLevel === LogLevel.ALL) {
      return true;
    }
    return false;
  }
}

class LogEntry {
  message: string = '';
  level: LogLevel = LogLevel.DEBUG;
  extraInfo: unknown[] = [];
  logWithDate: boolean = true;

  createLog(): string {
    let log: string = '';
    if (this.logWithDate) {
      log = new Date() + ' - ';
    }
    log += 'Level: ' + LogLevel[this.level];
    log += ' - Message: ' + this.message;

    if (this.extraInfo.length) {
      log += ' Info: ' + this.formatParams(this.extraInfo);
    }
    return log;
  }

  formatParams(params: unknown[]): string {
    let log = params.join(',');

    if (params.some((p) => typeof p == 'object')) {
      log = '';
    }
    for (let item of params) {
      log += JSON.stringify(item) + ',';
    }

    return log;
  }
}
