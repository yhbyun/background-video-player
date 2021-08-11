import * as log from 'electron-log';
import config from './config';

let isLoggingEnabled = config.persisted.get('isLoggingEnabled');

export class LogManager {
    getLogger(name) {
        const logObj = log.create(name);

        if (isLoggingEnabled) {
            logObj.transports.file.level = 'debug';
        } else {
            logObj.transports.file.level = false;
        }

        return logObj;
    }
}

export const logManager = new LogManager();
