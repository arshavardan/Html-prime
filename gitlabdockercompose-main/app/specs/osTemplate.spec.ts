import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import server from '../server.js';
import DB from '../utils/connectors/typeorm.js';
import { OsTemplate } from '../models/osTemplate.js';
import { OsFamily } from '../models/osFamily.js';
import { Location } from '../models/location.js';

const token = 'none';

const toCreate = {
  name: 'Ubuntu 20.08',
  templateId: '/DC0/vm/template',
  osFamily: 0,
  location: 0,
  availableNetwork: '/DC0/vm/network',
};

const toUpdate = {
  name: 'Windows 11',
  templateId: '/DC1/vm/template',
  osFamily: 0,
  location: 0,
  availableNetwork: '/DC1/vm/network',
};

describe('Ostemplate', () => {
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
    location.availableNetworks = [toCreate.availableNetwork, toUpdate.availableNetwork];
    await LocationRepository.save(location);

    toCreate.osFamily = osFamily.id;
    toCreate.location = location.id;

    toUpdate.osFamily = osFamily.id;
    toUpdate.location = location.id;
  });

  it('should add a SINGLE ostemplate on /ostemplate POST', async () => {
    const res = await request(server)
      .post('/ostemplate')
      .set('Authorization', token)
      .send(toCreate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.ostemplate).to.be.a('object');
    expect(res.body.ostemplate).to.have.property('id');
    expect(res.body.ostemplate).to.have.property('name');
    expect(res.body.ostemplate.name).to.be.equal(toCreate.name);
    expect(res.body.ostemplate).to.have.property('templateId');
    expect(res.body.ostemplate.templateId).to.be.equal(toCreate.templateId);
    expect(res.body.ostemplate).to.have.property('osFamily');
    expect(res.body.ostemplate.osFamily.id).to.be.equal(toCreate.osFamily);
    expect(res.body.ostemplate).to.have.property('location');
    expect(res.body.ostemplate.location.id).to.be.equal(toCreate.location);
    expect(res.body.ostemplate).to.have.property('availableNetwork');
    expect(res.body.ostemplate.availableNetwork).to.be.equal(toCreate.availableNetwork);
    id = res.body.ostemplate.id;
  });

  it('should list ALL ostemplates on /ostemplate GET', async () => {
    const res = await request(server)
      .get('/ostemplate')
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.ostemplates).to.be.a('array');
    expect(res.body.count).to.be.a('number');
    expect(res.body.pages).to.be.a('number');
  });

  it('should list a SINGLE ostemplate on /ostemplate/<id> GET', async () => {
    const res = await request(server)
      .get(`/ostemplate/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.ostemplate).to.be.a('object');
    expect(res.body.ostemplate.id).to.be.equal(id);
    expect(res.body.ostemplate).to.have.property('id');
    expect(res.body.ostemplate).to.have.property('name');
    expect(res.body.ostemplate.name).to.be.equal(toCreate.name);
    expect(res.body.ostemplate).to.have.property('templateId');
    expect(res.body.ostemplate.templateId).to.be.equal(toCreate.templateId);
    expect(res.body.ostemplate).to.have.property('osFamily');
    expect(res.body.ostemplate.osFamily).to.be.equal(toCreate.osFamily);
    expect(res.body.ostemplate).to.have.property('location');
    expect(res.body.ostemplate.location).to.be.equal(toCreate.location);
    expect(res.body.ostemplate).to.have.property('availableNetwork');
    expect(res.body.ostemplate.availableNetwork).to.be.equal(toCreate.availableNetwork);
  });

  it('should update a SINGLE ostemplate on /ostemplate/<id> PUT', async () => {
    const res = await request(server)
      .put(`/ostemplate/${id}`)
      .set('Authorization', token)
      .send(toUpdate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const getRes = await request(server)
      .get(`/ostemplate/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(getRes.body).to.have.property('status');
    expect(getRes.body.status).to.be.equal('success');
    expect(getRes.body.ostemplate).to.be.a('object');
    expect(getRes.body.ostemplate).to.have.property('id');
    expect(getRes.body.ostemplate.id).to.be.equal(id);
    expect(getRes.body.ostemplate).to.have.property('name');
    expect(getRes.body.ostemplate.name).to.be.equal(toUpdate.name);
    expect(getRes.body.ostemplate).to.have.property('templateId');
    expect(getRes.body.ostemplate.templateId).to.be.equal(toUpdate.templateId);
    expect(getRes.body.ostemplate).to.have.property('availableNetwork');
    expect(getRes.body.ostemplate.availableNetwork).to.be.equal(toUpdate.availableNetwork);
  });

  it('should delete a SINGLE ostemplate on /ostemplate/<id> DELETE', async () => {
    const res = await request(server)
      .delete(`/ostemplate/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const OsTemplateRepository = DB.getDataStore().getRepository(OsTemplate);
    await OsTemplateRepository.delete(id);

    const OsFamilyRepository = DB.getDataStore().getRepository(OsFamily);
    await OsFamilyRepository.delete(toCreate.osFamily);

    const LocationRepository = DB.getDataStore().getRepository(Location);
    await LocationRepository.delete(toCreate.location);
  });
});
