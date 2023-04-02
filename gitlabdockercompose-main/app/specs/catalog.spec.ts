import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { isArray } from 'lodash';
import path from 'path';
import server from '../server.js';
import DB from '../utils/connectors/typeorm.js';
import { Catalog } from '../models/catalog.js';
import { OsTemplate } from '../models/osTemplate.js';
import { OsFamily } from '../models/osFamily.js';
import { Location } from '../models/location.js';
import { ApprovalPolicy } from '../models/approvalPolicy.js';

const assetBasePath = path.join(__dirname, '../assets/test');
const token = 'none';

const toCreate = {
  name: 'Standard Catalog',
  shortName: 'ST',
  defaultTemplate: 0,
  defaultApprovalPolicy: 0,
  defaultLeasePeriod: 5,
  permittedMaxLeaseExtensions: 10,
  type: 'Standard',
};

const toUpdate = {
  name: 'Custom Catalog',
  shortName: 'CM',
  defaultTemplate: 0,
  defaultApprovalPolicy: 0,
  defaultLeasePeriod: 10,
  permittedMaxLeaseExtensions: 3,
  type: 'Custom',
};

const toUpload = {
  icon: 'test.jpg',
};

describe('Catalog', () => {
  let id: string = 'none';

  beforeAll(async () => {
    // Wait for database to initiate before running the test cases
    await new Promise((resolve) => setTimeout(resolve, 200));

    const OsFamilyRepository = DB.getDataStore().getRepository(OsFamily);
    const osFamily = new OsFamily();
    osFamily.name = 'Template';
    osFamily.shortName = 'TPL';
    await OsFamilyRepository.save(osFamily);

    const LocationRepository = DB.getDataStore().getRepository(Location);
    const location = new Location();
    location.name = 'Template';
    location.availableNetworks = ['/DC0/vm/network'];
    await LocationRepository.save(location);

    const OsTemplateRepository = DB.getDataStore().getRepository(OsTemplate);
    const osTemplate = new OsTemplate();
    osTemplate.name = 'Template';
    osTemplate.templateId = '/DC0/vm/template';
    osTemplate.osFamily = osFamily;
    osTemplate.location = location;
    osTemplate.availableNetwork = '/DC0/vm/network';
    await OsTemplateRepository.save(osTemplate);

    const ApprovalPolicyRepository = DB.getDataStore().getRepository(ApprovalPolicy);
    const approvalPolicy = new ApprovalPolicy();
    approvalPolicy.name = 'Approval Policy';
    approvalPolicy.policies = [];
    await ApprovalPolicyRepository.save(approvalPolicy);

    toCreate.defaultTemplate = osTemplate.id;
    toCreate.defaultApprovalPolicy = approvalPolicy.id;

    toUpdate.defaultTemplate = osTemplate.id;
    toUpdate.defaultApprovalPolicy = approvalPolicy.id;
  });

  it('should add a SINGLE catalog on /catalog POST', async () => {
    const res = await request(server)
      .post('/catalog')
      .set('Authorization', token)
      .send(toCreate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.catalog).to.be.a('object');
    expect(res.body.catalog).to.have.property('id');
    expect(res.body.catalog).to.have.property('name');
    expect(res.body.catalog.name).to.be.equal(toCreate.name);
    expect(res.body.catalog).to.have.property('shortName');
    expect(res.body.catalog.shortName).to.be.equal(toCreate.shortName);
    expect(res.body.catalog).to.have.property('defaultTemplate');
    expect(res.body.catalog.defaultTemplate.id).to.be.equal(toCreate.defaultTemplate);
    expect(res.body.catalog).to.have.property('defaultApprovalPolicy');
    expect(res.body.catalog.defaultApprovalPolicy.id).to.be.equal(toCreate.defaultApprovalPolicy);
    expect(res.body.catalog).to.have.property('defaultLeasePeriod');
    expect(res.body.catalog.defaultLeasePeriod).to.be.equal(toCreate.defaultLeasePeriod);
    expect(res.body.catalog).to.have.property('permittedMaxLeaseExtensions');
    expect(res.body.catalog.permittedMaxLeaseExtensions).to.be.equal(
      toCreate.permittedMaxLeaseExtensions
    );
    expect(res.body.catalog).to.have.property('type');
    expect(res.body.catalog.type).to.be.a('string');
    expect(res.body.catalog.type).to.be.equal(toCreate.type);
    id = res.body.catalog.id;
  });

  it('should list ALL catalogs on /catalog GET', async () => {
    const res = await request(server)
      .get('/catalog')
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.catalogs).to.be.a('array');
    expect(res.body.count).to.be.a('number');
    expect(res.body.pages).to.be.a('number');
  });

  it('should list a SINGLE catalog on /catalog/<id> GET', async () => {
    const res = await request(server)
      .get(`/catalog/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.catalog).to.be.a('object');
    expect(res.body.catalog.id).to.be.equal(id);
    expect(res.body.catalog).to.have.property('id');
    expect(res.body.catalog).to.have.property('name');
    expect(res.body.catalog.name).to.be.equal(toCreate.name);
    expect(res.body.catalog).to.have.property('shortName');
    expect(res.body.catalog.shortName).to.be.equal(toCreate.shortName);
    expect(res.body.catalog).to.have.property('defaultTemplate');
    expect(res.body.catalog.defaultTemplate).to.be.equal(toCreate.defaultTemplate);
    expect(res.body.catalog).to.have.property('defaultApprovalPolicy');
    expect(res.body.catalog.defaultApprovalPolicy).to.be.equal(toCreate.defaultApprovalPolicy);
    expect(res.body.catalog).to.have.property('defaultLeasePeriod');
    expect(res.body.catalog.defaultLeasePeriod).to.be.equal(toCreate.defaultLeasePeriod);
    expect(res.body.catalog).to.have.property('permittedMaxLeaseExtensions');
    expect(res.body.catalog.permittedMaxLeaseExtensions).to.be.equal(
      toCreate.permittedMaxLeaseExtensions
    );
    expect(res.body.catalog).to.have.property('type');
    expect(res.body.catalog.type).to.be.a('string');
    expect(res.body.catalog.type).to.be.equal(toCreate.type);
  });

  it('should upload a SINGLE catalog on /catalog/upload/<id> POST', async () => {
    const uploadRequest = request(server).post(`/catalog/upload/${id}`);
    Object.entries(toUpload).forEach((entry) => {
      const [key, value] = entry;
      if (isArray(value)) {
        value.forEach((file: string) => {
          uploadRequest.attach(key, path.join(assetBasePath, file), file);
        });
      } else {
        uploadRequest.attach(key, path.join(assetBasePath, value), value);
      }
    });
    const res = await uploadRequest
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
  });

  it('should update a SINGLE catalog on /catalog/<id> PUT', async () => {
    const res = await request(server)
      .put(`/catalog/${id}`)
      .set('Authorization', token)
      .send(toUpdate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const getRes = await request(server)
      .get(`/catalog/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(getRes.body).to.have.property('status');
    expect(getRes.body.status).to.be.equal('success');
    expect(getRes.body.catalog).to.be.a('object');
    expect(getRes.body.catalog).to.have.property('id');
    expect(getRes.body.catalog.id).to.be.equal(id);
    expect(getRes.body.catalog).to.have.property('name');
    expect(getRes.body.catalog.name).to.be.equal(toUpdate.name);
    expect(getRes.body.catalog).to.have.property('shortName');
    expect(getRes.body.catalog.shortName).to.be.equal(toUpdate.shortName);
    expect(getRes.body.catalog).to.have.property('defaultTemplate');
    expect(getRes.body.catalog.defaultTemplate).to.be.equal(toUpdate.defaultTemplate);
    expect(getRes.body.catalog).to.have.property('defaultApprovalPolicy');
    expect(getRes.body.catalog.defaultApprovalPolicy).to.be.equal(toUpdate.defaultApprovalPolicy);
    expect(getRes.body.catalog).to.have.property('defaultLeasePeriod');
    expect(getRes.body.catalog.defaultLeasePeriod).to.be.equal(toUpdate.defaultLeasePeriod);
    expect(getRes.body.catalog).to.have.property('permittedMaxLeaseExtensions');
    expect(getRes.body.catalog.permittedMaxLeaseExtensions).to.be.equal(
      toUpdate.permittedMaxLeaseExtensions
    );
    expect(getRes.body.catalog).to.have.property('type');
    expect(getRes.body.catalog.type).to.be.a('string');
    expect(getRes.body.catalog.type).to.be.equal(toUpdate.type);
  });

  it('should delete a SINGLE catalog on /catalog/<id> DELETE', async () => {
    const res = await request(server)
      .delete(`/catalog/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const CatalogRepository = DB.getDataStore().getRepository(Catalog);
    await CatalogRepository.delete(id);

    const OsTemplateRepository = DB.getDataStore().getRepository(OsTemplate);
    const osTemplate = await OsTemplateRepository.findOne({
      where: { id: toCreate.defaultTemplate },
      relations: { osFamily: true, location: true },
    });

    if (osTemplate) {
      await OsTemplateRepository.delete(osTemplate.id);

      const OsFamilyRepository = DB.getDataStore().getRepository(OsFamily);
      await OsFamilyRepository.delete(osTemplate.osFamily.id);

      const LocationRepository = DB.getDataStore().getRepository(Location);
      await LocationRepository.delete(osTemplate.location.id);
    }

    const ApprovalPolicyRepository = DB.getDataStore().getRepository(ApprovalPolicy);
    await ApprovalPolicyRepository.delete(toCreate.defaultApprovalPolicy);
  });
});
