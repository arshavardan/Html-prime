import express from 'express';
import HttpStatus from 'http-status';
import { ObjectSchema, ValidationResult } from 'joi';
import { isEmpty } from 'lodash';
import { FindOneOptions, FindManyOptions, UpdateResult } from 'typeorm';
import Joi from '../utils/helpers/joi.js';
import DB from '../utils/connectors/typeorm.js';
import { OsLanguage } from '../models/osLanguage.js';
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
 * @api {get} /oslanguage/?page=1&limit=1 Fetch all oslanguages
 * @apiName fetchAllOsLanguages
 * @apiGroup OsLanguages
 * @apiPermission 'all'
 *
 * @apiQuery {number} [page] Page number of result
 * @apiQuery {number} [limit] No of results to return per page
 *
 * @apiHeaderExample {json} X-API-Fields:
 *   {
 *      "id": true,
 *      "name": true,
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
 *       "oslanguages": [{
 *         "id": 1,
 *         "name": "English",
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
        createdBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdBy')).optional(),
        updatedBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedBy')).optional(),
        createdAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdAt')).optional(),
        updatedAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedAt')).optional(),
      }),
      sort: Joi.object().keys({
        id: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for id')).optional(),
        name: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for name')).optional(),
        createdBy: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for createdBy')).optional(),
        updatedBy: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for updatedBy')).optional(),
        createdAt: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for createdAt')).optional(),
        updatedAt: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for updatedAt')).optional(),
      }),
    });
    const validation: ValidationResult = schema.validate({ q, fields });
    if (validation.error) {
      logger.info('[fetchAllOsLanguages]', validation.error.message);
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

    const OsLanguageRepository = DB.getDataStore().getRepository(OsLanguage);
    const [result, count] = await OsLanguageRepository.findAndCount(query);
    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, oslanguages: result, count, pages: Math.ceil(count / limit) });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[fetchAllOsLanguages]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1001, error: ErrorMessages.E1001 });
  }
});

/* inject: route-get */
/**
 * @api {get} /oslanguage/:oslanguageId Fetch oslanguage with given Id
 * @apiName fetchOsLanguage
 * @apiGroup OsLanguages
 * @apiPermission 'all'
 *
 * @apiParam oslanguageId OsLanguage's Unique Id
 *
 * @apiHeaderExample {json} X-API-Fields:
 *   {
 *      "id": true,
 *      "name": true,
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
 *       "oslanguage": {
 *         "id": 1,
 *         "name": "English",
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

router.get('/:oslanguageId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.oslanguageId, 10);
  const q: qs.ParsedQs = req.query;
  const fields: { [key: string]: boolean } = JSON.parse(req.get('X-API-Fields') || '{}');

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for oslanguageId')),
    q: Joi.object().keys({
      relations: Joi.boolean().error(new Error('Please provide a valid relations')).optional(),
    }),
    fields: Joi.object().keys({
      id: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for id')).optional(),
      name: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for name')).optional(),
      createdBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdBy')).optional(),
      updatedBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedBy')).optional(),
      createdAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdAt')).optional(),
      updatedAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedAt')).optional(),
    }),
  });
  const validation: ValidationResult = schema.validate({ id, q, fields });
  if (validation.error) {
    logger.info('[fetchOsLanguage]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const query: FindOneOptions = {
      where: { id },
    };

    if (!isEmpty(fields)) {
      query.select = fields;
    }

    const OsLanguageRepository = DB.getDataStore().getRepository(OsLanguage);
    const oslanguage = await OsLanguageRepository.findOne(query);
    if (!oslanguage) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
    }
    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, oslanguage });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[fetchOsLanguage]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1002, error: ErrorMessages.E1002 });
  }
});

/**
 * @api {post} /oslanguage/ Create oslanguage
 * @apiName createOsLanguage
 * @apiGroup OsLanguages
 * @apiPermission 'all'
 *
 * @apiHeaderExample {json} Input:
 *     {
 *         "name": "English"
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "oslanguage": {
 *         "id": 1,
 *         "name": "English",
 *         "createdBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "createdAt": '2023-01-01T18:30:00.000Z'
 *       }
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.post('/', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const b: IOsLanguage = req.body;

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    b: Joi.object().keys({
      name: Joi.string().required().error(new Error('Please provide a valid name')),
    }),
  });
  const validation: ValidationResult = schema.validate({ b });
  if (validation.error) {
    logger.info('[createOsLanguage]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const oslanguage = new OsLanguage();
    oslanguage.name = b.name;
    oslanguage.createdBy = req.user?.id;
    oslanguage.updatedBy = req.user?.id;

    const OsLanguageRepository = DB.getDataStore().getRepository(OsLanguage);
    await OsLanguageRepository.save(oslanguage);

    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, oslanguage });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[createOsLanguage]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1003, error: ErrorMessages.E1003 });
  }
});

/* inject: route-post */
/* inject: route-put */
/**
 * @api {put} /oslanguage/:oslanguageId Update oslanguage
 * @apiName updateOsLanguage
 * @apiGroup OsLanguages
 * @apiPermission 'all'
 *
 * @apiParam oslanguageId OsLanguage's Unique Id
 * @apiHeaderExample {json} Input:
 *     {
 *         "name": "English"
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "oslanguage": {
 *         "id": 1,
 *         "name": "English",
 *         "updatedBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "updatedAt": '2023-01-01T18:30:00.000Z'
 *       }
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.put('/:oslanguageId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.oslanguageId, 10);
  const b: Partial<IOsLanguage> = req.body;

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for oslanguageId')),
    b: Joi.object().keys({
      name: Joi.string().error(new Error('Please provide a valid name')),
    }),
  });
  const validation: ValidationResult = schema.validate({ id, b });
  if (validation.error) {
    logger.info('[updateOsLanguage]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  const OsLanguageRepository = DB.getDataStore().getRepository(OsLanguage);
  const oslanguage = await OsLanguageRepository.findOneBy({ id });
  if (!oslanguage) {
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
  }

  if (typeof b.name !== 'undefined') {
    oslanguage.name = b.name;
  }

  try {
    oslanguage.updatedBy = req.user?.id;
    await OsLanguageRepository.save(oslanguage);
    return res.status(HttpStatus.OK).send({ status: Status.SUCCESS, oslanguage });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[updateOsLanguage]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, codes: ErrorCodes.E1004, error: ErrorMessages.E1004 });
  }
});

/* inject: route-delete */
/**
 * @api {delete} /oslanguage/:oslanguageId Delete oslanguage
 * @apiName deleteOsLanguage
 * @apiGroup OsLanguages
 * @apiPermission 'all'
 *
 * @apiParam oslanguageId OsLanguage's Unique Id
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success"
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.delete('/:oslanguageId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.oslanguageId, 10);

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for oslanguageId')),
  });
  const validation: ValidationResult = schema.validate({ id });
  if (validation.error) {
    logger.info('[deleteOsLanguage]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const OsLanguageRepository = DB.getDataStore().getRepository(OsLanguage);
    const oslanguage = await OsLanguageRepository.findOneBy({ id });
    if (!oslanguage) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
    }

    oslanguage.deletedBy = req.user?.id;
    await OsLanguageRepository.save(oslanguage);

    const result: UpdateResult = await OsLanguageRepository.softDelete(id);

    if (typeof result.affected !== 'undefined' && result.affected > 0) {
      return res.status(HttpStatus.OK).send({ status: Status.SUCCESS });
    }
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[deleteOsLanguage]', err.message);
    }
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1005, error: ErrorMessages.E1005 });
  }
});

export default router;
