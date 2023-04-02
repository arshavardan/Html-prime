import { Size } from '../models/size.js';
import { OsLanguage } from '../models/osLanguage.js';
import { OsFamily } from '../models/osFamily.js';
import { Location } from '../models/location.js';
import { Endpoint } from '../models/endpoint.js';
import { ApprovalPolicy } from '../models/approvalPolicy.js';
import { OsTemplate } from '../models/osTemplate.js';
import { Catalog } from '../models/catalog.js';
/* inject: entity-import */

// eslint-disable-next-line prettier/prettier
const entities = [
  Size,
  OsLanguage,
  OsFamily,
  Location,
  Endpoint,
  ApprovalPolicy,
  OsTemplate,
  Catalog,
/* inject: entity-define */
];

export default entities;
