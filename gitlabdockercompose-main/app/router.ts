import { Express } from 'express';
import sizeRouter from './routes/size.js';
import osLanguageRouter from './routes/osLanguage.js';
import osFamilyRouter from './routes/osFamily.js';
import locationRouter from './routes/location.js';
import endpointRouter from './routes/endpoint.js';
import approvalPolicyRouter from './routes/approvalPolicy.js';
import osTemplateRouter from './routes/osTemplate.js';
import catalogRouter from './routes/catalog.js';
/* inject: route-import */

const init: (app: Express) => void = (app) => {
  app.use('/size', sizeRouter);
  app.use('/oslanguage', osLanguageRouter);
  app.use('/osfamily', osFamilyRouter);
  app.use('/location', locationRouter);
  app.use('/endpoint', endpointRouter);
  app.use('/approvalpolicy', approvalPolicyRouter);
  app.use('/ostemplate', osTemplateRouter);
  app.use('/catalog', catalogRouter);
/* inject: route-define */
};

export default { init };
