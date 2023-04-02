import 'reflect-metadata';
import http from 'http';
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import DB from './utils/connectors/typeorm.js';
import router from './router.js';
import { isTestEnv } from './utils/helpers/test.js';

/*
 * Loads the environment variables from .env to process.env
 */
const envLoaded = dotenv.config({ path: `${__dirname}/.env` });
/* istanbul ignore if -- @preserve */
if (envLoaded.error) {
  logger.error('Unable to load .env. Please pass environment variables directly.');
}

/*
 * Initiates DB connection
 */
DB.init();

/*
 * Initiates Express and loads following middlewares
 *  cors: Handles Cross Origin Request
 *  bodyParser: Converts chunks of inputs to req.body
 *  morgan: Logs each incoming http request
 */
const app = express();

// [security] checks: start
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);
app.use(cors({ credentials: true, origin: '*' }));
app.use(hpp());
// [security] checks: end

if (!isTestEnv()) app.use(morgan('short'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
if (process.env.SERVER_STATIC) {
  app.use('/', express.static(path.join(__dirname, process.env.SERVER_STATIC)));
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/*
 * Custom routes are initiated below
 */
router.init(app);

/*
 * Server is created with the provided port
 */

const server = new http.Server(app); // Binding express app with http server

export default server;
