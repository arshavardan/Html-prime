import express from 'express';
import HttpStatus from 'http-status';
import { ObjectSchema, ValidationResult } from 'joi';
import { isEmpty } from 'lodash';
import { FindOneOptions, FindManyOptions, UpdateResult } from 'typeorm';
import Joi from '../utils/helpers/joi.js';
import DB from '../utils/connectors/typeorm.js';
import { Size } from '../models/size.js';
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
 * @api {get} /size/?page=1&limit=1 Fetch all sizes
 * @apiName fetchAllSizes
 * @apiGroup Sizes
 * @apiPermission 'all'
 *
 * @apiQuery {number} [page] Page number of result
 * @apiQuery {number} [limit] No of results to return per page
 *
 * @apiHeaderExample {json} X-API-Fields:
 *   {
 *      "id": true,
 *      "name": true,
 *      "cpus": true,
 *      "ram": true,
 *      "storage": true,
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
 *      "cpus": 'asc' / 'desc',
 *      "ram": 'asc' / 'desc',
 *      "storage": 'asc' / 'desc',
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
 *       "sizes": [{
 *         "id": 1,
 *         "name": "Small",
 *         "cpus": 2,
 *         "ram": 1024,
 *         "storage": 10,
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
        cpus: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for cpus')).optional(),
        ram: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for ram')).optional(),
        storage: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for storage')).optional(),
        createdBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdBy')).optional(),
        updatedBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedBy')).optional(),
        createdAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdAt')).optional(),
        updatedAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedAt')).optional(),
      }),
      sort: Joi.object().keys({
        id: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for id')).optional(),
        name: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for name')).optional(),
        cpus: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for cpus')).optional(),
        ram: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for ram')).optional(),
        storage: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for storage')).optional(),
        createdBy: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for createdBy')).optional(),
        updatedBy: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for updatedBy')).optional(),
        createdAt: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for createdAt')).optional(),
        updatedAt: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for updatedAt')).optional(),
      }),
    });
    const validation: ValidationResult = schema.validate({ q, fields });
    if (validation.error) {
      logger.info('[fetchAllSizes]', validation.error.message);
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

    const SizeRepository = DB.getDataStore().getRepository(Size);
    const [result, count] = await SizeRepository.findAndCount(query);
    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, sizes: result, count, pages: Math.ceil(count / limit) });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[fetchAllSizes]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1001, error: ErrorMessages.E1001 });
  }
});

/* inject: route-get */
/**
 * @api {get} /size/:sizeId Fetch size with given Id
 * @apiName fetchSize
 * @apiGroup Sizes
 * @apiPermission 'all'
 *
 * @apiParam sizeId Size's Unique Id
 *
 * @apiHeaderExample {json} X-API-Fields:
 *   {
 *      "id": true,
 *      "name": true,
 *      "cpus": true,
 *      "ram": true,
 *      "storage": true,
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
 *       "size": {
 *         "id": 1,
 *         "name": "Small",
 *         "cpus": 2,
 *         "ram": 1024,
 *         "storage": 10,
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

router.get('/:sizeId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.sizeId, 10);
  const q: qs.ParsedQs = req.query;
  const fields: { [key: string]: boolean } = JSON.parse(req.get('X-API-Fields') || '{}');

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for sizeId')),
    q: Joi.object().keys({
      relations: Joi.boolean().error(new Error('Please provide a valid relations')).optional(),
    }),
    fields: Joi.object().keys({
      id: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for id')).optional(),
      name: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for name')).optional(),
      cpus: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for cpus')).optional(),
      ram: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for ram')).optional(),
      storage: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for storage')).optional(),
      createdBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdBy')).optional(),
      updatedBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedBy')).optional(),
      createdAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdAt')).optional(),
      updatedAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedAt')).optional(),
    }),
  });
  const validation: ValidationResult = schema.validate({ id, q, fields });
  if (validation.error) {
    logger.info('[fetchSize]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const query: FindOneOptions = {
      where: { id },
    };

    if (!isEmpty(fields)) {
      query.select = fields;
    }

    const SizeRepository = DB.getDataStore().getRepository(Size);
    const size = await SizeRepository.findOne(query);
    if (!size) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
    }
    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, size });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[fetchSize]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1002, error: ErrorMessages.E1002 });
  }
});

/**
 * @api {post} /size/ Create size
 * @apiName createSize
 * @apiGroup Sizes
 * @apiPermission 'all'
 *
 * @apiHeaderExample {json} Input:
 *     {
 *         "name": "Small",
 *         "cpus": 2,
 *         "ram": 1024,
 *         "storage": 10
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "size": {
 *         "id": 1,
 *         "name": "Small",
 *         "cpus": 2,
 *         "ram": 1024,
 *         "storage": 10,
 *         "createdBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "createdAt": '2023-01-01T18:30:00.000Z'
 *       }
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.post('/', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const b: ISize = req.body;

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    b: Joi.object().keys({
      name: Joi.string().required().error(new Error('Please provide a valid name')),
      cpus: Joi.number().required().error(new Error('Please provide a valid number for cpus')),
      ram: Joi.number().required().error(new Error('Please provide a valid number for ram')),
      storage: Joi.number().required().error(new Error('Please provide a valid number for storage')),
    }),
  });
  const validation: ValidationResult = schema.validate({ b });
  if (validation.error) {
    logger.info('[createSize]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const size = new Size();
    size.name = b.name;
    size.cpus = b.cpus;
    size.ram = b.ram;
    size.storage = b.storage;
    size.createdBy = req.user?.id;
    size.updatedBy = req.user?.id;

    const SizeRepository = DB.getDataStore().getRepository(Size);
    await SizeRepository.save(size);

    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, size });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[createSize]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1003, error: ErrorMessages.E1003 });
  }
});

/* inject: route-post */
/* inject: route-put */
/**
 * @api {put} /size/:sizeId Update size
 * @apiName updateSize
 * @apiGroup Sizes
 * @apiPermission 'all'
 *
 * @apiParam sizeId Size's Unique Id
 * @apiHeaderExample {json} Input:
 *     {
 *         "name": "Small",
 *         "cpus": 2,
 *         "ram": 1024,
 *         "storage": 10
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "size": {
 *         "id": 1,
 *         "name": "Small",
 *         "cpus": 2,
 *         "ram": 1024,
 *         "storage": 10,
 *         "updatedBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "updatedAt": '2023-01-01T18:30:00.000Z'
 *       }
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.put('/:sizeId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.sizeId, 10);
  const b: Partial<ISize> = req.body;

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for sizeId')),
    b: Joi.object().keys({
      name: Joi.string().error(new Error('Please provide a valid name')),
      cpus: Joi.number().error(new Error('Please provide a valid number for cpus')),
      ram: Joi.number().error(new Error('Please provide a valid number for ram')),
      storage: Joi.number().error(new Error('Please provide a valid number for storage')),
    }),
  });
  const validation: ValidationResult = schema.validate({ id, b });
  if (validation.error) {
    logger.info('[updateSize]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  const SizeRepository = DB.getDataStore().getRepository(Size);
  const size = await SizeRepository.findOneBy({ id });
  if (!size) {
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
  }

  if (typeof b.name !== 'undefined') {
    size.name = b.name;
  }

  if (typeof b.cpus !== 'undefined') {
    size.cpus = b.cpus;
  }

  if (typeof b.ram !== 'undefined') {
    size.ram = b.ram;
  }

  if (typeof b.storage !== 'undefined') {
    size.storage = b.storage;
  }

  try {
    size.updatedBy = req.user?.id;
    await SizeRepository.save(size);
    return res.status(HttpStatus.OK).send({ status: Status.SUCCESS, size });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[updateSize]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, codes: ErrorCodes.E1004, error: ErrorMessages.E1004 });
  }
});

/* inject: route-delete */
/**
 * @api {delete} /size/:sizeId Delete size
 * @apiName deleteSize
 * @apiGroup Sizes
 * @apiPermission 'all'
 *
 * @apiParam sizeId Size's Unique Id
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success"
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.delete('/:sizeId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.sizeId, 10);

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for sizeId')),
  });
  const validation: ValidationResult = schema.validate({ id });
  if (validation.error) {
    logger.info('[deleteSize]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const SizeRepository = DB.getDataStore().getRepository(Size);
    const size = await SizeRepository.findOneBy({ id });
    if (!size) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
    }

    size.deletedBy = req.user?.id;
    await SizeRepository.save(size);

    const result: UpdateResult = await SizeRepository.softDelete(id);

    if (typeof result.affected !== 'undefined' && result.affected > 0) {
      return res.status(HttpStatus.OK).send({ status: Status.SUCCESS });
    }
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[deleteSize]', err.message);
    }
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1005, error: ErrorMessages.E1005 });
  }
});

export default router;
