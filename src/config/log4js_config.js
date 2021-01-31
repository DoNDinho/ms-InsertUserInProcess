'use strict';
const log4js = require('log4js');

log4js.configure({
    appenders: {
        everything: {
            type: 'file',
            filename: 'log/InsertUserInProcess.log',
            maxLogSize: 10485760,
            backups: 10,
            layout: {
                type: 'pattern',
                pattern: '[%d{yyyy-MM-ddThh:mm:ss}] [%z] [%p] [ms-InsertUserInProcess] [%X{transaction_id}] - %m'
            }
        },
        out: {
            type: 'stdout',
            layout: {
                type: 'pattern',
                pattern: '[%d{yyyy-MM-ddThh:mm:ss}] [%z] [%p] [ms-InsertUserInProcess] [%X{transaction_id}] - %m'
            }
        },
        errout: {
            type: 'stderr',
            layout: {
                type: 'pattern',
                pattern: '[%d{yyyy-MM-ddThh:mm:ss}] [%z] [%p] [ms-InsertUserInProcess] [%X{transaction_id}] - %m'
            }
        }
    },
    categories: {
        default: {
            appenders: ['out', 'everything'],
            level: 'info'
        },
        error: {
            appenders: ['errout'],
            level: 'error'
        }
    }
});

const logger = log4js.getLogger();

module.exports = logger;
