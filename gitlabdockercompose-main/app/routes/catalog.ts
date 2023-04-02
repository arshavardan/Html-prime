import express from 'express';
import HttpStatus from 'http-status';
import { ObjectSchema, ValidationResult } from 'joi';
import { each, has, isEmpty } from 'lodash';
import path from 'path';
import multer from 'multer';
import { FindOneOptions, FindManyOptions, UpdateResult } from 'typeorm';
import Joi from '../utils/helpers/joi.js';
import DB from '../utils/connectors/typeorm.js';
import { Catalog } from '../models/catalog.js';
import logger from '../utils/logger.js';
import permit from '../utils/auth/permit.js';
import upload from '../utils/helpers/upload.js';
import { Status } from '../types/enums/Status.js';
import { ErrorCodes } from '../types/errors/codes.js';
import { ErrorMessages } from '../types/errors/messages.js';
import { OsTemplate } from '../models/osTemplate.js';
import { ApprovalPolicy } from '../models/approvalPolicy.js';

const router = express.Router();

/* inject: upload-init */

const storage = upload.diskStorage('catalogs');
/* [security]: filter appropriate files by file mime type */
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!req.fileError) req.fileError = {};
  if (file.fieldname === 'icon') {
    if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      req.fileError.icon = 'Unsupported file format, please upload a valid file';
      cb(null, false);
    }
  }
};

/* [fields]: specify list of file fields below */
const fileFields: Array<{ name: string }> = [{ name: 'icon' }];

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
 * @api {get} /catalog/?page=1&limit=1&relations=true Fetch all catalogs
 * @apiName fetchAllCatalogs
 * @apiGroup Catalogs
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
 *      "icon": true,
 *      "shortName": true,
 *      "defaultTemplate": true,
 *      "defaultApprovalPolicy": true,
 *      "defaultLeasePeriod": true,
 *      "permittedMaxLeaseExtensions": true,
 *      "type": true,
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
 *      "icon": 'asc' / 'desc',
 *      "shortName": 'asc' / 'desc',
 *      "defaultTemplate": 'asc' / 'desc',
 *      "defaultApprovalPolicy": 'asc' / 'desc',
 *      "defaultLeasePeriod": 'asc' / 'desc',
 *      "permittedMaxLeaseExtensions": 'asc' / 'desc',
 *      "type": 'asc' / 'desc',
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
 *       "catalogs": [{
 *         "id": 1,
 *         "name": "Catalog Name",
 *         "icon": "File",
 *         "shortName": "ST",
 *         "defaultTemplate": 1,
 *         "defaultApprovalPolicy": 1,
 *         "defaultLeasePeriod": 5,
 *         "permittedMaxLeaseExtensions": 10,
 *         "type": "Standard / Custom",
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
        name: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for name')).optional(),
        icon: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for icon')).optional(),
        shortName: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for shortName')).optional(),
        defaultTemplate: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for defaultTemplate')).optional(),
        defaultApprovalPolicy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for defaultApprovalPolicy')).optional(),
        defaultLeasePeriod: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for defaultLeasePeriod')).optional(),
        permittedMaxLeaseExtensions: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for permittedMaxLeaseExtensions')).optional(),
        type: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for type')).optional(),
        createdBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdBy')).optional(),
        updatedBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedBy')).optional(),
        createdAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdAt')).optional(),
        updatedAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedAt')).optional(),
      }),
      sort: Joi.object().keys({
        name: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for name')).optional(),
        icon: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for icon')).optional(),
        shortName: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for shortName')).optional(),
        defaultTemplate: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for defaultTemplate')).optional(),
        defaultApprovalPolicy: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for defaultApprovalPolicy')).optional(),
        defaultLeasePeriod: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for defaultLeasePeriod')).optional(),
        permittedMaxLeaseExtensions: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for permittedMaxLeaseExtensions')).optional(),
        type: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for type')).optional(),
        createdBy: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for createdBy')).optional(),
        updatedBy: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for updatedBy')).optional(),
        createdAt: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for createdAt')).optional(),
        updatedAt: Joi.string().valid('asc', 'desc').error(new Error('Please provide a valid sort option for updatedAt')).optional(),
      }),
    });
    const validation: ValidationResult = schema.validate({ q, fields });
    if (validation.error) {
      logger.info('[fetchAllCatalogs]', validation.error.message);
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
        defaultTemplate: true,
        defaultApprovalPolicy: true,
      };
    } else {
      query.loadRelationIds = true;
    }

    const CatalogRepository = DB.getDataStore().getRepository(Catalog);
    const [result, count] = await CatalogRepository.findAndCount(query);
    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, catalogs: result, count, pages: Math.ceil(count / limit) });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[fetchAllCatalogs]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1001, error: ErrorMessages.E1001 });
  }
});

/* inject: route-get */
/**
 * @api {get} /catalog/:catalogId?relations=true Fetch catalog with given Id
 * @apiName fetchCatalog
 * @apiGroup Catalogs
 * @apiPermission 'all'
 *
 * @apiParam catalogId Catalog's Unique Id
 * @apiQuery {boolean} [relations] If relations is set to true, returned object will have foreign keys populated with foreign documents
 *
 * @apiHeaderExample {json} X-API-Fields:
 *   {
 *      "id": true,
 *      "name": true,
 *      "icon": true,
 *      "shortName": true,
 *      "defaultTemplate": true,
 *      "defaultApprovalPolicy": true,
 *      "defaultLeasePeriod": true,
 *      "permittedMaxLeaseExtensions": true,
 *      "type": true,
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
 *       "catalog": {
 *         "id": 1,
 *         "name": "Catalog Name",
 *         "icon": "File",
 *         "shortName": "ST",
 *         "defaultTemplate": 1,
 *         "defaultApprovalPolicy": 1,
 *         "defaultLeasePeriod": 5,
 *         "permittedMaxLeaseExtensions": 10,
 *         "type": "Standard / Custom",
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

router.get('/:catalogId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.catalogId, 10);
  const q: qs.ParsedQs = req.query;
  const fields: { [key: string]: boolean } = JSON.parse(req.get('X-API-Fields') || '{}');

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for catalogId')),
    q: Joi.object().keys({
      relations: Joi.boolean().error(new Error('Please provide a valid relations')).optional(),
    }),
    fields: Joi.object().keys({
      name: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for name')).optional(),
      icon: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for icon')).optional(),
      shortName: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for shortName')).optional(),
      defaultTemplate: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for defaultTemplate')).optional(),
      defaultApprovalPolicy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for defaultApprovalPolicy')).optional(),
      defaultLeasePeriod: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for defaultLeasePeriod')).optional(),
      permittedMaxLeaseExtensions: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for permittedMaxLeaseExtensions')).optional(),
      type: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for type')).optional(),
      createdBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdBy')).optional(),
      updatedBy: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedBy')).optional(),
      createdAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for createdAt')).optional(),
      updatedAt: Joi.boolean().valid(true).error(new Error('Please provide a valid field option for updatedAt')).optional(),
    }),
  });
  const validation: ValidationResult = schema.validate({ id, q, fields });
  if (validation.error) {
    logger.info('[fetchCatalog]', validation.error.message);
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
        defaultTemplate: true,
        defaultApprovalPolicy: true,
      };
    } else {
      query.loadRelationIds = true;
    }

    const CatalogRepository = DB.getDataStore().getRepository(Catalog);
    const catalog = await CatalogRepository.findOne(query);
    if (!catalog) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
    }
    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, catalog });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[fetchCatalog]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1002, error: ErrorMessages.E1002 });
  }
});

/**
 * @api {post} /catalog/ Create catalog
 * @apiName createCatalog
 * @apiGroup Catalogs
 * @apiPermission 'all'
 *
 * @apiHeaderExample {json} Input:
 *     {
 *         "name": "Catalog Name",
 *         "shortName": "ST",
 *         "defaultTemplate": 1,
 *         "defaultApprovalPolicy": 1,
 *         "defaultLeasePeriod": 5,
 *         "permittedMaxLeaseExtensions": 10,
 *         "type": "Standard / Custom"
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "catalog": {
 *         "id": 1,
 *         "name": "Catalog Name",
 *         "shortName": "ST",
 *         "defaultTemplate": 1,
 *         "defaultApprovalPolicy": 1,
 *         "defaultLeasePeriod": 5,
 *         "permittedMaxLeaseExtensions": 10,
 *         "type": "Standard / Custom",
 *         "createdBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "createdAt": '2023-01-01T18:30:00.000Z'
 *       }
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.post('/', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const b: ICatalog = req.body;

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    b: Joi.object().keys({
      name: Joi.string().required().error(new Error('Please provide a valid name')),
      shortName: Joi.string().required().error(new Error('Please provide a valid shortName')),
      defaultTemplate: Joi.number().required().error(new Error('Please provide a valid number for defaultTemplate')),
      defaultApprovalPolicy: Joi.number().required().error(new Error('Please provide a valid number for defaultApprovalPolicy')),
      defaultLeasePeriod: Joi.number().required().error(new Error('Please provide a valid number for defaultLeasePeriod')),
      permittedMaxLeaseExtensions: Joi.number().required().error(new Error('Please provide a valid number for permittedMaxLeaseExtensions')),
      type: Joi.string().valid('Standard', 'Custom').required().error(new Error('Please provide a valid string for type')),
    }),
  });
  const validation: ValidationResult = schema.validate({ b });
  if (validation.error) {
    logger.info('[createCatalog]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const OsTemplateRepository = DB.getDataStore().getRepository(OsTemplate);
    const osTemplate = await OsTemplateRepository.findOneBy({ id: b.defaultTemplate });
    if (!osTemplate) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: "Provided defaultTemplate doesn't exist" });
    }

    const ApprovalPolicyRepository = DB.getDataStore().getRepository(ApprovalPolicy);
    const approvalPolicy = await ApprovalPolicyRepository.findOneBy({ id: b.defaultApprovalPolicy });
    if (!approvalPolicy) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: "Provided defaultApprovalPolicy doesn't exist" });
    }

    const catalog = new Catalog();
    catalog.name = b.name;
    catalog.shortName = b.shortName;
    catalog.defaultTemplate = osTemplate;
    catalog.defaultApprovalPolicy = approvalPolicy;
    catalog.defaultLeasePeriod = b.defaultLeasePeriod;
    catalog.permittedMaxLeaseExtensions = b.permittedMaxLeaseExtensions;
    catalog.type = b.type;
    catalog.createdBy = req.user?.id;
    catalog.updatedBy = req.user?.id;

    const CatalogRepository = DB.getDataStore().getRepository(Catalog);
    await CatalogRepository.save(catalog);

    res.status(HttpStatus.OK).send({ status: Status.SUCCESS, catalog });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[createCatalog]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1003, error: ErrorMessages.E1003 });
  }
});

/**
 * @api {post} /catalog/upload/:catalogId Upload related files for catalog
 * @apiName uploadCatalogFiles
 * @apiGroup Catalogs
 * @apiPermission 'all'
 *
 * @apiParam catalogId Catalog's Unique Id
 * @apiHeaderExample {json} Input:
 *     {
 *         "icon": "File",
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "accepted": {
 *          "icon": "catalogs/82a6c417c55599f5d533b078ec08055a1680421647834.png"
 *       },
 *       "rejected": {
 *          "icon": "Unsupported file format, please upload a valid file"
 *       }
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.post('/upload/:catalogId', permit.allow('all'), multer({ storage, fileFilter }).fields(fileFields), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.catalogId, 10);

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for catalogId')),
  });
  const validation: ValidationResult = schema.validate({ id });
  if (validation.error) {
    logger.error('[uploadCatalogFiles]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }
  try {
    const CatalogRepository = DB.getDataStore().getRepository(Catalog);
    const catalog = await CatalogRepository.findOneBy({ id });
    if (!catalog) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accepted: { [key: string]: string | string[] } = {};
    const toCleanUp: string[] = [];
    each(req.files, (files: unknown, fieldname: string) => {
      const multerFiles: Express.Multer.File[] = files as Express.Multer.File[];
      if (fieldname === 'icon') {
        const currentValue = catalog.icon;
        if (currentValue) {
          toCleanUp.push(String(currentValue));
        }
        catalog.icon = `catalogs/${path.basename(multerFiles[0].path)}`;
        accepted[fieldname] = catalog.icon;
      }
    });

    await CatalogRepository.save(catalog);
    if (toCleanUp.length > 0) {
      upload.cleanUp(toCleanUp);
    }
    return res.status(HttpStatus.OK).send({ status: Status.SUCCESS, accepted, rejected: req.fileError });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[uploadCatalogFiles]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1008, error: ErrorMessages.E1008 });
  }
});

/* inject: route-post */
/* inject: route-put */
/**
 * @api {put} /catalog/:catalogId Update catalog
 * @apiName updateCatalog
 * @apiGroup Catalogs
 * @apiPermission 'all'
 *
 * @apiParam catalogId Catalog's Unique Id
 * @apiHeaderExample {json} Input:
 *     {
 *         "name": "Catalog Name",
 *         "shortName": "ST",
 *         "defaultTemplate": 1,
 *         "defaultApprovalPolicy": 1,
 *         "defaultLeasePeriod": 5,
 *         "permittedMaxLeaseExtensions": 10,
 *         "type": "Standard / Custom"
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success",
 *       "catalog": {
 *         "id": 1,
 *         "name": "Catalog Name",
 *         "shortName": "ST",
 *         "defaultTemplate": 1,
 *         "defaultApprovalPolicy": 1,
 *         "defaultLeasePeriod": 5,
 *         "permittedMaxLeaseExtensions": 10,
 *         "type": "Standard / Custom",
 *         "updatedBy": 'a023ff8b-cc37-4495-8ea4-258d2ffdc3f0',
 *         "updatedAt": '2023-01-01T18:30:00.000Z'
 *       }
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.put('/:catalogId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.catalogId, 10);
  const b: Partial<ICatalog> = req.body;

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for catalogId')),
    b: Joi.object().keys({
      name: Joi.string().error(new Error('Please provide a valid name')),
      shortName: Joi.string().error(new Error('Please provide a valid shortName')),
      defaultTemplate: Joi.number().error(new Error('Please provide a valid number for defaultTemplate')),
      defaultApprovalPolicy: Joi.number().error(new Error('Please provide a valid number for defaultApprovalPolicy')),
      defaultLeasePeriod: Joi.number().error(new Error('Please provide a valid number for defaultLeasePeriod')),
      permittedMaxLeaseExtensions: Joi.number().error(new Error('Please provide a valid number for permittedMaxLeaseExtensions')),
      type: Joi.string().valid('Standard', 'Custom').error(new Error('Please provide a valid string for type')),
    }),
  });
  const validation: ValidationResult = schema.validate({ id, b });
  if (validation.error) {
    logger.info('[updateCatalog]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  const CatalogRepository = DB.getDataStore().getRepository(Catalog);
  const catalog = await CatalogRepository.findOneBy({ id });
  if (!catalog) {
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
  }

  if (typeof b.name !== 'undefined') {
    catalog.name = b.name;
  }

  if (typeof b.shortName !== 'undefined') {
    catalog.shortName = b.shortName;
  }

  if (typeof b.defaultTemplate !== 'undefined') {
    const OsTemplateRepository = DB.getDataStore().getRepository(OsTemplate);
    const osTemplate = await OsTemplateRepository.findOneBy({ id: b.defaultTemplate });
    if (!osTemplate) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: "Provided defaultTemplate doesn't exist" });
    }
    catalog.defaultTemplate = osTemplate;
  }

  if (typeof b.defaultApprovalPolicy !== 'undefined') {
    const ApprovalPolicyRepository = DB.getDataStore().getRepository(ApprovalPolicy);
    const approvalPolicy = await ApprovalPolicyRepository.findOneBy({ id: b.defaultApprovalPolicy });
    if (!approvalPolicy) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: "Provided defaultApprovalPolicy doesn't exist" });
    }
    catalog.defaultApprovalPolicy = approvalPolicy;
  }

  if (typeof b.defaultLeasePeriod !== 'undefined') {
    catalog.defaultLeasePeriod = b.defaultLeasePeriod;
  }

  if (typeof b.permittedMaxLeaseExtensions !== 'undefined') {
    catalog.permittedMaxLeaseExtensions = b.permittedMaxLeaseExtensions;
  }

  if (typeof b.type !== 'undefined') {
    catalog.type = b.type;
  }

  try {
    catalog.updatedBy = req.user?.id;
    await CatalogRepository.save(catalog);
    return res.status(HttpStatus.OK).send({ status: Status.SUCCESS, catalog });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[updateCatalog]', err.message);
    }
    res.status(HttpStatus.OK).send({ status: Status.ERROR, codes: ErrorCodes.E1004, error: ErrorMessages.E1004 });
  }
});

/* inject: route-delete */
/**
 * @api {delete} /catalog/:catalogId Delete catalog
 * @apiName deleteCatalog
 * @apiGroup Catalogs
 * @apiPermission 'all'
 *
 * @apiParam catalogId Catalog's Unique Id
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "success"
 *     }
 * @apiError ErrorRetrieving
 * @apiUse ErrorBlock
 */

router.delete('/:catalogId', permit.allow('all'), async (req: express.Request, res: express.Response) => {
  const id: number = parseInt(req.params.catalogId, 10);

  // Validate Input
  const schema: ObjectSchema = Joi.object().keys({
    id: Joi.number().required().error(new Error('Please provide a valid number for catalogId')),
  });
  const validation: ValidationResult = schema.validate({ id });
  if (validation.error) {
    logger.info('[deleteCatalog]', validation.error.message);
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1007, error: validation.error.message });
  }

  try {
    const CatalogRepository = DB.getDataStore().getRepository(Catalog);
    const catalog = await CatalogRepository.findOneBy({ id });
    if (!catalog) {
      return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
    }

    catalog.deletedBy = req.user?.id;
    await CatalogRepository.save(catalog);

    const result: UpdateResult = await CatalogRepository.softDelete(id);

    if (typeof result.affected !== 'undefined' && result.affected > 0) {
      return res.status(HttpStatus.OK).send({ status: Status.SUCCESS });
    }
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1006, error: ErrorMessages.E1006 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error('[deleteCatalog]', err.message);
    }
    return res.status(HttpStatus.OK).send({ status: Status.ERROR, code: ErrorCodes.E1005, error: ErrorMessages.E1005 });
  }
});

export default router;
