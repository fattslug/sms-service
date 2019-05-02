import fs from 'fs';
import moment from 'moment-timezone';

let logStream: fs.WriteStream;

export function open() {
  logStream = fs.createWriteStream(__dirname + '/logs/import.log');
}

export function write(logString: string) {
  logStream.write(moment().format('MMMM Do YYYY, h:mm:ss a') + ': ' + logString + '\n');
}

export function close() {
  logStream.close();
}