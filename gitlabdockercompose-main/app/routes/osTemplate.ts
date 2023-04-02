import express from 'express';
import HttpStatus from 'http-status';
import { ObjectSchema, ValidationResult } from 'joi';
import { has, isEmpty } from 'lodash';
import { FindOneOptions, FindManyOptions, UpdateResult } from 'typeorm';
import Joi from '../utils/helpers/joi.js';
import DB from '../utils/connectors/typeorm.js';
import { OsTemplate } from '../models/osTemplate.js';
import { OsFamily } from '../models/osFamily.js';
import { Location } from '../models/location.js';
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
 * @api {get} /ostemplate/?page=1&limit=1&relations=true Fetch all ostemplates
 * @apiName fetchAllOsTemplates
 * @apiGroup OsTemplates
 * @apiPermission 'all'
 *
 * @apiQuery {number} [page] Page number of result
 * @apiQuery {number} [limit] No of results to return per page
 * @apiQuery {boolean} [relations] If relations is set to true, returned object will have foreign keys populated with foreign documents
 *
 * @apiHeaderExample {json} X-API-Fields:
 *   {
 *      "id": true,
 *      "name": true,
 *      "templateId": true,
 *      "osFamily": true,
 *      "location": true,
 *      "availableNetwork": true,
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
 *      "templateId": 'asc' / 'desc',
 *      "osFamily": 'asc' / 'desc',
 *      "location": 'asc' / 'desc',
 *      "availableNetwork": 'asc' / 'desc',
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
 *       "ostemplates": [{
 *         "id": 1,
 *         "name": "Ubuntu 20.08",
 *         "templateId": "/DC0/vm/template",
 *         "osFamily": 1,
 *         "location": 1,
 *         "availableNetwork": "/DC0/vm/network",
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
        templateId: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for templateId')).optional(),
        osFamily: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for osFamily')).optional(),
        location: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for location')).optional(),
        availableNetwork: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for availableNetwork')).optional(),
        createdBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdBy')).optional(),
        updatedBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedBy')).optional(),
        createdAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdAt')).optional(),
        updatedAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedAt')).optional(),
      }),
      sort: Joi.object().keys({
        id: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for id')).optional(),
        name: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for name')).optional(),
        templateId: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for templateId')).optional(),
        osFamily: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for osFamily')).optional(),
        location: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for location')).optional(),
        availableNetwork: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for availableNetwork')).optional(),
        createdBy: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for createdBy')).optional(),
        updatedBy: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for updatedBy')).optional(),
        createdAt: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for createdAt')).optional(),
        updatedAt: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for updatedAt')).optional(),
      }),
    });
    const validation: ValidationResult = schema.validate({ q, fields });
    if (validation.error) {
      logger.info('[fetchAllOsTemplates]', validation.error.message);
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

    if (has(q, 'relations') && q.relations === 'true') {
      query.relations = {
        osFamily: true,
        location: true,
      };
    } else {
      query.loadRelationIds = true;
    }

    const OsTemplateRepository = DB.getDataStore().getRepository(OsTemplate);
    const [result, count] = await OsTemplateRepository.findAndCount(query);
    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, ostemplates: result, count, pages: Math.ceil(count / limit) });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[fetchAllOsTemplates]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1001, error: ErrorMessages.E1001 });
  }
});

/* inject: route-get */
/**
 * @api {get} /ostemplate/:ostemplateId?relations=true Fetch ostemplate with given Id
 * @apiName fetchOsTemplate
 * @apiGroup OsTemplates
 * @apiPermission 'all'
 *
 * @apiParam ostemplateId OsTemplate's Unique Id
 * @apiQuery {boolean} [relations] If relations is set to true, returned object will have foreign keys populated with foreign documents
 *
 * @apiHeaderExample {json} X-API-Fields:
 *   {
 *      "id": true,
 *      "name": true,
 *      "templateId": true,
 *      "osFamily": true,
 *      "location": true,
 *      "availableNetwork": true,
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
 *       "ostemplate": {
 *         "id": 1,
 *         "name": "Ubuntu 20.08",
 *         "templateId": "/DC0/vm/template",
 *         "osFamily": 1,
 *         "location": 1,
 *         "availableNetwork": "/DC0/vm/network",
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

router.get('/:ostemplateId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.ostemplateId, 10);
  const q: qs.ParsedQs = req.query;
  const fields: { [key: string]: boolean } = JSON.parse(req.get('X-API-Fields') || '{}');

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for ostemplateId')),
    q: Joi.object().keys({
      relations: Joi.boolean().error(new Error('Please provide a valid relations')).optional(),
    }),
    fields: Joi.object().keys({
      id: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for id')).optional(),
      name: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for name')).optional(),
      templateId: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for templateId')).optional(),
      osFamily: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for osFamily')).optional(),
      location: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for location')).optional(),
      availableNetwork: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for availableNetwork')).optional(),
      createdBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdBy')).optional(),
      updatedBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedBy')).optional(),
      createdAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdAt')).optional(),
      updatedAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedAt')).optional(),
    }),
  });
  const validation: ValidationResult = schema.validate({ id, q, fields });
  if (validation.error) {
    logger.info('[fetchOsTemplate]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const query: FindOneOptions = {
      where: { id },
    };

    if (!isEmpty(fields)) {
      query.select = fields;
    }

    if (has(q, 'relations') && q.relations === 'true') {
      query.relations = {
        osFamily: true,
        location: true,
      };
    } else {
      query.loadRelationIds = true;
    }

    const OsTemplateRepository = DB.getDataStore().getRepository(OsTemplate);
    const ostemplate = await OsTemplateRepository.findOne(query);
    if (!ostemplate) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
    }
    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, ostemplate });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[fetchOsTemplate]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1002, error: ErrorMessages.E1002 });
  }
});

/**
 * @api {post} /ostemplate/ Create ostemplate
 * @apiName createOsTemplate
 * @apiGroup OsTemplates
 * @apiPermission 'all'
 *
 * @apiHeaderExample {json} Input:
 *     {
 *         "name": "Ubuntu 20.08",
 *         "templateId": "/DC0/vm/template",
 *         "osFamily": 1,
 *         "location": 1,
 *         "availableNetwork": "/DC0/vm/network"
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "ostemplate": {
 *         "name": "Ubuntu 20.08",
 *         "templateId": "/DC0/vm/template",
 *         "osFamily": 1,
 *         "location": 1,
 *         "availableNetwork": "/DC0/vm/network",
 *         "createdBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "createdAt": '2023-01-01T18:30:00.000Z'
 *       }
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.post('/', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const b: IOsTemplate = req.body;

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    b: Joi.object().keys({
      name: Joi.string().required().error(new Error('Please provide a valid name')),
      templateId: Joi.string().required().error(new Error('Please provide a valid templateId')),
      osFamily: Joi.number().required().error(new Error('Please provide a valid number for osFamily')),
      location: Joi.number().required().error(new Error('Please provide a valid number for location')),
      availableNetwork: Joi.string().required().error(new Error('Please provide a valid availableNetwork')),
    }),
  });
  const validation: ValidationResult = schema.validate({ b });
  if (validation.error) {
    logger.info('[createOsTemplate]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const OsFamilyRepository = DB.getDataStore().getRepository(OsFamily);
    const osFamily = await OsFamilyRepository.findOneBy({ id: b.osFamily });
    if (!osFamily) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: "Provided osFamily doesn't exist" });
    }
    const LocationRepository = DB.getDataStore().getRepository(Location);
    const location = await LocationRepository.findOneBy({ id: b.location });
    if (!location) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: "Provided location doesn't exist" });
    }

    if (!location.availableNetworks.includes(b.availableNetwork)) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: 'Provided availableNetwork is not part of location' });
    }

    const ostemplate = new OsTemplate();
    ostemplate.name = b.name;
    ostemplate.templateId = b.templateId;
    ostemplate.osFamily = osFamily;
    ostemplate.location = location;
    ostemplate.availableNetwork = b.availableNetwork;
    ostemplate.createdBy = req.user?.id;
    ostemplate.updatedBy = req.user?.id;

    const OsTemplateRepository = DB.getDataStore().getRepository(OsTemplate);
    await OsTemplateRepository.save(ostemplate);

    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, ostemplate });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[createOsTemplate]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1003, error: ErrorMessages.E1003 });
  }
});

/* inject: route-post */
/* inject: route-put */
/**
 * @api {put} /ostemplate/:ostemplateId Update ostemplate
 * @apiName updateOsTemplate
 * @apiGroup OsTemplates
 * @apiPermission 'all'
 *
 * @apiParam ostemplateId OsTemplate's Unique Id
 * @apiHeaderExample {json} Input:
 *     {
 *         "name": "Ubuntu 20.08",
 *         "templateId": "/DC0/vm/template",
 *         "availableNetwork": "/DC0/vm/network"
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "ostemplate": {
 *         "id": 1,
 *         "name": "Ubuntu 20.08",
 *         "templateId": "/DC0/vm/template",
 *         "osFamily": 1,
 *         "location": 1,
 *         "availableNetwork": "/DC0/vm/network",
 *         "updatedBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "updatedAt": '2023-01-01T18:30:00.000Z'
 *       }
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.put('/:ostemplateId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.ostemplateId, 10);
  const b: Partial<IOsTemplate> = req.body;

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for ostemplateId')),
    b: Joi.object().keys({
      name: Joi.string().error(new Error('Please provide a valid name')),
      templateId: Joi.string().error(new Error('Please provide a valid templateId')),
      osFamily: Joi.number().required().error(new Error('Please provide a valid number for osFamily')),
      location: Joi.number().required().error(new Error('Please provide a valid number for location')),
      availableNetwork: Joi.string().error(new Error('Please provide a valid availableNetwork')),
    }),
  });
  const validation: ValidationResult = schema.validate({ id, b });
  if (validation.error) {
    logger.info('[updateOsTemplate]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  const OsTemplateRepository = DB.getDataStore().getRepository(OsTemplate);
  const ostemplate = await OsTemplateRepository.findOne({ where: { id }, relations: { location: true } });
  if (!ostemplate) {
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
  }

  if (typeof b.name !== 'undefined') {
    ostemplate.name = b.name;
  }

  if (typeof b.templateId !== 'undefined') {
    ostemplate.templateId = b.templateId;
  }

  if (typeof b.osFamily !== 'undefined') {
    const OsFamilyRepository = DB.getDataStore().getRepository(OsFamily);
    const osFamily = await OsFamilyRepository.findOneBy({ id: b.osFamily });
    if (!osFamily) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: "Provided osFamily doesn't exist" });
    }
    ostemplate.osFamily = osFamily;
  }

  if (typeof b.location !== 'undefined') {
    const LocationRepository = DB.getDataStore().getRepository(Location);
    const location = await LocationRepository.findOneBy({ id: b.location });
    if (!location) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: "Provided location doesn't exist" });
    }
    ostemplate.location = location;
  }

  if (typeof b.availableNetwork !== 'undefined') {
    if (!ostemplate.location?.availableNetworks.includes(b.availableNetwork)) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: 'Provided availableNetwork is not part of location' });
    }
    ostemplate.availableNetwork = b.availableNetwork;
  }

  try {
    ostemplate.updatedBy = req.user?.id;
    await OsTemplateRepository.save(ostemplate);
    return res.status(HttpStatus.OK).send({ status: Status.SUCCESS, ostemplate });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[updateOsTemplate]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, codes: ErrorCodes.E1004, error: ErrorMessages.E1004 });
  }
});

/* inject: route-delete */
/**
 * @api {delete} /ostemplate/:ostemplateId Delete ostemplate
 * @apiName deleteOsTemplate
 * @apiGroup OsTemplates
 * @apiPermission 'all'
 *
 * @apiParam ostemplateId OsTemplate's Unique Id
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success"
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.delete('/:ostemplateId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.ostemplateId, 10);

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for ostemplateId')),
  });
  const validation: ValidationResult = schema.validate({ id });
  if (validation.error) {
    logger.info('[deleteOsTemplate]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const OsTemplateRepository = DB.getDataStore().getRepository(OsTemplate);
    const ostemplate = await OsTemplateRepository.findOneBy({ id });
    if (!ostemplate) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
    }

    ostemplate.deletedBy = req.user?.id;
    await OsTemplateRepository.save(ostemplate);

    const result: UpdateResult = await OsTemplateRepository.softDelete(id);

    if (typeof result.affected !== 'undefined' && result.affected > 0) {
      return res.status(HttpStatus.OK).send({ status: Status.SUCCESS });
    }
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[deleteOsTemplate]', err.message);
    }
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1005, error: ErrorMessages.E1005 });
  }
});

export default router;
