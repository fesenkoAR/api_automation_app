const log4js = require('log4js');

log4js.configure({
  appenders: {
    console: { type: 'console' },
    file: { type: 'file', filename: '../logs/app.log' }
  },
  categories: {
    default: { appenders: ['console', 'file'], level: 'debug' }
  }
});

module.exports = log4js;