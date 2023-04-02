import 'reflect-metadata';
import server from './server';
import { isTestEnv } from './utils/helpers/test';
import logger from './utils/logger';

const port = process.env.SERVER_PORT;
server.listen(port, () => {
  if (!isTestEnv()) logger.info('SERVER STARTED');
  if (!isTestEnv()) logger.info(`Server listening on port ${process.env.SERVER_PORT}`);
});

export default server;
