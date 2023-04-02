import 'pg';
import 'pg-hstore';
import { DataSource } from 'typeorm';
import entities from '../entities.js';
import logger from '../logger.js';

// Call init only once when the app opens.
// This makes sure only one connection is open to Postgres
let datastore: DataSource;

const init = async () => {
  try {
    const DIALECT = 'postgres';
    const HOST = process.env.SQL_HOST ?? 'localhost';
    const PORT = process.env.SQL_PORT ?? '5432';
    const USER = process.env.SQL_USER ?? 'default';
    const PASS = process.env.SQL_PASS ?? 'default';
    const DB = process.env.SQL_DB ?? 'default';
    const LOGGING = process.env.SQL_LOGGING === 'true';
    datastore = new DataSource({
      type: DIALECT,
      host: HOST,
      port: parseInt(PORT),
      username: USER,
      password: PASS,
      database: DB,
      logNotifications: LOGGING,
      synchronize: true,
      entities,
    });
    await datastore.initialize();
  } catch (err) {
    logger.error('[TypeORM]', err);
  }
};

// getInstance returns connected instance of datasource
const getDataStore = () => datastore;

export default {
  init,
  getDataStore,
};
