import pino from 'pino';

const pinoLogger: pino.Logger = pino();
const logger: ILogger = {
  info: function (...args) {
    pinoLogger.info(JSON.stringify(args));
  },
  error: function (...args) {
    pinoLogger.error(JSON.stringify(args));
  },
};
export default logger;
