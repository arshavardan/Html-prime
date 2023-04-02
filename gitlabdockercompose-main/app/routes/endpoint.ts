import express from 'express';
import HttpStatus from 'http-status';
import { ObjectSchema, ValidationResult } from 'joi';
import { isEmpty } from 'lodash';
import { FindOneOptions, FindManyOptions, UpdateResult } from 'typeorm';
import Joi from '../utils/helpers/joi.js';
import DB from '../utils/connectors/typeorm.js';
import { Endpoint } from '../models/endpoint.js';
import logger from '../utils/logger.js';
import permit from '../utils/auth/permit.js';
import { Status } from '../types/enums/Status.js';
import { ErrorCodes } from '../types/errors/codes.js';
import { ErrorMessages } from '../types/errors/messages.js';

const router = express.Router();

/* inject: upload-init */

/**
 * @apiDefine ErrorBlock
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 200 Complete
 *     {
 *       "status": "error",
 *       "code": XXXX,
 *       "error": <i>Error message.</i>
 *     }
 * @apiErrorExample {json} Auth-Failed:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "status": "error",
 *       "code": 401
 *       "error": <i>Error message.</i>
 *     }
 */

/**
 * @api {get} /endpoint/?page=1&limit=1 Fetch all endpoints
 * @apiName fetchAllEndpoints
 * @apiGroup Endpoints
 * @apiPermission 'all'
 *
 * @apiQuery {number} [page] Page number of result
 * @apiQuery {number} [limit] No of results to return per page
 *
 * @apiHeaderExample {json} X-API-Fields:
 *   {
 *      "id": true,
 *      "name": true,
 *      "shortName": true,
 *      "url": true,
 *      "username": true,
 *      "password": true,
 *      "availableClusters": true,
 *      "createdBy": true,
 *      "updatedBy": true,
 *      "createdAt": true,
 *      "updatedAt": true,
 *   }
 *
 * @apiHeaderExample {json} X-API-Sort:
 *   {
 *      "id": 'asc' / 'desc',
 *      "name": 'asc' / 'desc',
 *      "shortName": 'asc' / 'desc',
 *      "url": 'asc' / 'desc',
 *      "username": 'asc' / 'desc',
 *      "password": 'asc' / 'desc',
 *      "availableClusters": 'asc' / 'desc',
 *      "createdBy": 'asc' / 'desc',
 *      "updatedBy": 'asc' / 'desc',
 *      "createdAt": 'asc' / 'desc',
 *      "updatedAt": 'asc' / 'desc',
 *   }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "endpoints": [{
 *         "id": 1,
 *         "name": "Endpoint Name",
 *         "shortName": "IN",
 *         "url": "https://inxxxxxx.siemens.com",
 *         "username": "inxxxxusername",
 *         "password": "xxxxxx",
 *         "availableClusters": ["/DC0/vm/cluster"],
 *         "createdBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "updatedBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "deletedBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "createdAt": '2023-01-01T18:30:00.000Z',
 *         "updatedAt": '2023-01-01T18:30:00.000Z',
 *         "deletedAt": '2023-01-01T18:30:00.000Z',
 *       }],
 *       "count": 1, // total documents
 *       "pages": 1 // total pages (based on limit passed)
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */
router.get('/', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  try {
    const q: qs.ParsedQs = req.query;
    const fields: { [key: string]: boolean } = JSON.parse(req.get('X-API-Fields') || '{}');
    const sort: { [key: string]: boolean } = JSON.parse(req.get('X-API-Sort') || '{}');

    // Validate Input
    const schema: ObjectSchema = Joi.object().keys({
      q: Joi.object().keys({
        page: Joi.number().error(new Error('Please provide a valid page')).optional(),
        limit: Joi.number().error(new Error('Please provide a valid limit')).optional(),
        relations: Joi.boolean().error(new Error('Please provide a valid relations')).optional(),
      }),
      fields: Joi.object().keys({
        id: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for id')).optional(),
        name: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for name')).optional(),
        shortName: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for shortName')).optional(),
        url: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for url')).optional(),
        username: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for username')).optional(),
        password: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for password')).optional(),
        availableClusters: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for availableClusters')).optional(),
        createdBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdBy')).optional(),
        updatedBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedBy')).optional(),
        createdAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdAt')).optional(),
        updatedAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedAt')).optional(),
      }),
      sort: Joi.object().keys({
        id: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for id')).optional(),
        name: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for name')).optional(),
        shortName: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for shortName')).optional(),
        url: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for url')).optional(),
        username: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for username')).optional(),
        password: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for password')).optional(),
        availableClusters: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for availableClusters')).optional(),
        createdBy: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for createdBy')).optional(),
        updatedBy: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for updatedBy')).optional(),
        createdAt: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for createdAt')).optional(),
        updatedAt: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for updatedAt')).optional(),
      }),
    });
    const validation: ValidationResult = schema.validate({ q, fields });
    if (validation.error) {
      logger.info('[fetchAllEndpoints]', validation.error.message);
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
    }

    const page = typeof q.page === 'string' ? parseInt(q.page, 10) : 0;
    const limit = typeof q.limit === 'string' ? parseInt(q.limit, 10) : 50;

    const query: FindManyOptions = {
      skip: page * limit,
      take: limit,
    };

    if (!isEmpty(fields)) {
      query.select = fields;
    }

    if (!isEmpty(sort)) {
      query.order = sort;
    }

    const EndpointRepository = DB.getDataStore().getRepository(Endpoint);
    const [result, count] = await EndpointRepository.findAndCount(query);
    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, endpoints: result, count, pages: Math.ceil(count / limit) });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[fetchAllEndpoints]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1001, error: ErrorMessages.E1001 });
  }
});

/* inject: route-get */
/**
 * @api {get} /endpoint/:endpointId Fetch endpoint with given Id
 * @apiName fetchEndpoint
 * @apiGroup Endpoints
 * @apiPermission 'all'
 *
 * @apiParam endpointId Endpoint's Unique Id
 *
 * @apiHeaderExample {json} X-API-Fields:
 *   {
 *      "id": true,
 *      "name": true,
 *      "shortName": true,
 *      "url": true,
 *      "username": true,
 *      "password": true,
 *      "availableClusters": true,
 *      "createdBy": true,
 *      "updatedBy": true,
 *      "createdAt": true,
 *      "updatedAt": true,
 *   }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "endpoint": {
 *         "id": 1,
 *         "name": "Endpoint Name",
 *         "shortName": "IN",
 *         "url": "https://inxxxxxx.siemens.com",
 *         "username": "inxxxxusername",
 *         "password": "xxxxxx",
 *         "availableClusters": ["/DC0/vm/cluster"],
 *         "createdBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "updatedBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "deletedBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "createdAt": '2023-01-01T18:30:00.000Z',
 *         "updatedAt": '2023-01-01T18:30:00.000Z',
 *         "deletedAt": '2023-01-01T18:30:00.000Z',
 *       }
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.get('/:endpointId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.endpointId, 10);
  const q: qs.ParsedQs = req.query;
  const fields: { [key: string]: boolean } = JSON.parse(req.get('X-API-Fields') || '{}');

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for endpointId')),
    q: Joi.object().keys({
      relations: Joi.boolean().error(new Error('Please provide a valid relations')).optional(),
    }),
    fields: Joi.object().keys({
      id: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for id')).optional(),
      name: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for name')).optional(),
      shortName: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for shortName')).optional(),
      url: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for url')).optional(),
      username: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for username')).optional(),
      password: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for password')).optional(),
      availableClusters: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for availableClusters')).optional(),
      createdBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdBy')).optional(),
      updatedBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedBy')).optional(),
      createdAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdAt')).optional(),
      updatedAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedAt')).optional(),
    }),
  });
  const validation: ValidationResult = schema.validate({ id, q, fields });
  if (validation.error) {
    logger.info('[fetchEndpoint]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const query: FindOneOptions = {
      where: { id },
    };

    if (!isEmpty(fields)) {
      query.select = fields;
    }

    const EndpointRepository = DB.getDataStore().getRepository(Endpoint);
    const endpoint = await EndpointRepository.findOne(query);
    if (!endpoint) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
    }
    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, endpoint });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[fetchEndpoint]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1002, error: ErrorMessages.E1002 });
  }
});

/**
 * @api {post} /endpoint/ Create endpoint
 * @apiName createEndpoint
 * @apiGroup Endpoints
 * @apiPermission 'all'
 *
 * @apiHeaderExample {json} Input:
 *     {
 *         "name": "Endpoint Name",
 *         "shortName": "IN",
 *         "url": "https://inxxxxxx.siemens.com",
 *         "username": "inxxxxusername",
 *         "password": "xxxxxx",
 *         "availableClusters": ["/DC0/vm/cluster"]
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "endpoint": {
 *         "id": 1,
 *         "name": "Endpoint Name",
 *         "shortName": "IN",
 *         "url": "https://inxxxxxx.siemens.com",
 *         "username": "inxxxxusername",
 *         "password": "xxxxxx",
 *         "availableClusters": ["/DC0/vm/cluster"],
 *         "createdBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "createdAt": '2023-01-01T18:30:00.000Z'
 *       }
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.post('/', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const b: IEndpoint = req.body;

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    b: Joi.object().keys({
      name: Joi.string().required().error(new Error('Please provide a valid name')),
      shortName: Joi.string().required().error(new Error('Please provide a valid shortName')),
      url: Joi.string().required().error(new Error('Please provide a valid url')),
      username: Joi.string().required().error(new Error('Please provide a valid username')),
      password: Joi.string().required().error(new Error('Please provide a valid password')),
      availableClusters: Joi.array()
        .items(Joi.string().required().error(new Error('Please provide a valid availableClusters')))
        .required()
        .error(new Error('Please provide a valid array for availableClusters')),
    }),
  });
  const validation: ValidationResult = schema.validate({ b });
  if (validation.error) {
    logger.info('[createEndpoint]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const endpoint = new Endpoint();
    endpoint.name = b.name;
    endpoint.shortName = b.shortName;
    endpoint.url = b.url;
    endpoint.username = b.username;
    endpoint.password = b.password;
    endpoint.availableClusters = b.availableClusters;
    endpoint.createdBy = req.user?.id;
    endpoint.updatedBy = req.user?.id;

    const EndpointRepository = DB.getDataStore().getRepository(Endpoint);
    await EndpointRepository.save(endpoint);

    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, endpoint });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[createEndpoint]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1003, error: ErrorMessages.E1003 });
  }
});

/* inject: route-post */
/* inject: route-put */
/**
 * @api {put} /endpoint/:endpointId Update endpoint
 * @apiName updateEndpoint
 * @apiGroup Endpoints
 * @apiPermission 'all'
 *
 * @apiParam endpointId Endpoint's Unique Id
 * @apiHeaderExample {json} Input:
 *     {
 *         "name": "Endpoint Name",
 *         "shortName": "IN",
 *         "url": "https://inxxxxxx.siemens.com",
 *         "username": "inxxxxusername",
 *         "password": "xxxxxx",
 *         "availableClusters": ["/DC0/vm/cluster"]
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "endpoint": {
 *         "id": 1,
 *         "name": "Endpoint Name",
 *         "shortName": "IN",
 *         "url": "https://inxxxxxx.siemens.com",
 *         "username": "inxxxxusername",
 *         "password": "xxxxxx",
 *         "availableClusters": ["/DC0/vm/cluster"],
 *         "updatedBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "updatedAt": '2023-01-01T18:30:00.000Z'
 *       }
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.put('/:endpointId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.endpointId, 10);
  const b: Partial<IEndpoint> = req.body;

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for endpointId')),
    b: Joi.object().keys({
      name: Joi.string().error(new Error('Please provide a valid name')),
      shortName: Joi.string().error(new Error('Please provide a valid shortName')),
      url: Joi.string().error(new Error('Please provide a valid url')),
      username: Joi.string().error(new Error('Please provide a valid username')),
      password: Joi.string().error(new Error('Please provide a valid password')),
      availableClusters: Joi.array()
        .items(Joi.string().error(new Error('Please provide a valid availableClusters')))
        .error(new Error('Please provide a valid array for availableClusters')),
    }),
  });
  const validation: ValidationResult = schema.validate({ id, b });
  if (validation.error) {
    logger.info('[updateEndpoint]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  const EndpointRepository = DB.getDataStore().getRepository(Endpoint);
  const endpoint = await EndpointRepository.findOneBy({ id });
  if (!endpoint) {
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
  }

  if (typeof b.name !== 'undefined') {
    endpoint.name = b.name;
  }

  if (typeof b.shortName !== 'undefined') {
    endpoint.shortName = b.shortName;
  }

  if (typeof b.url !== 'undefined') {
    endpoint.url = b.url;
  }

  if (typeof b.username !== 'undefined') {
    endpoint.username = b.username;
  }

  if (typeof b.password !== 'undefined') {
    endpoint.password = b.password;
  }

  if (typeof b.availableClusters !== 'undefined') {
    endpoint.availableClusters = b.availableClusters;
  }

  try {
    endpoint.updatedBy = req.user?.id;
    await EndpointRepository.save(endpoint);
    return res.status(HttpStatus.OK).send({ status: Status.SUCCESS, endpoint });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[updateEndpoint]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, codes: ErrorCodes.E1004, error: ErrorMessages.E1004 });
  }
});

/* inject: route-delete */
/**
 * @api {delete} /endpoint/:endpointId Delete endpoint
 * @apiName deleteEndpoint
 * @apiGroup Endpoints
 * @apiPermission 'all'
 *
 * @apiParam endpointId Endpoint's Unique Id
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success"
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.delete('/:endpointId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.endpointId, 10);

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for endpointId')),
  });
  const validation: ValidationResult = schema.validate({ id });
  if (validation.error) {
    logger.info('[deleteEndpoint]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const EndpointRepository = DB.getDataStore().getRepository(Endpoint);
    const endpoint = await EndpointRepository.findOneBy({ id });
    if (!endpoint) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
    }

    endpoint.deletedBy = req.user?.id;
    await EndpointRepository.save(endpoint);

    const result: UpdateResult = await EndpointRepository.softDelete(id);

    if (typeof result.affected !== 'undefined' && result.affected > 0) {
      return res.status(HttpStatus.OK).send({ status: Status.SUCCESS });
    }
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[deleteEndpoint]', err.message);
    }
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1005, error: ErrorMessages.E1005 });
  }
});

export default router;
