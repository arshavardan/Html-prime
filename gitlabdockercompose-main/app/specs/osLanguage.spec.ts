import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import server from '../server.js';
import DB from '../utils/connectors/typeorm.js';
import { OsLanguage } from '../models/osLanguage.js';

const token = 'none';

const toCreate = {
  name: 'English',
};

const toUpdate = {
  name: 'French',
};

describe('Oslanguage', () => {
  let id: string = 'none';

  beforeAll(async () => {
    // Wait for database to initiate before running the test cases
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it('should add a SINGLE oslanguage on /oslanguage POST', async () => {
    const res = await request(server)
      .post('/oslanguage')
      .set('Authorization', token)
      .send(toCreate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.oslanguage).to.be.a('object');
    expect(res.body.oslanguage).to.have.property('id');
    expect(res.body.oslanguage).to.have.property('name');
    expect(res.body.oslanguage.name).to.be.equal(toCreate.name);
    id = res.body.oslanguage.id;
  });

  it('should list ALL oslanguages on /oslanguage GET', async () => {
    const res = await request(server)
      .get('/oslanguage')
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.oslanguages).to.be.a('array');
    expect(res.body.count).to.be.a('number');
    expect(res.body.pages).to.be.a('number');
  });

  it('should list a SINGLE oslanguage on /oslanguage/<id> GET', async () => {
    const res = await request(server)
      .get(`/oslanguage/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.oslanguage).to.be.a('object');
    expect(res.body.oslanguage.id).to.be.equal(id);
    expect(res.body.oslanguage).to.have.property('id');
    expect(res.body.oslanguage).to.have.property('name');
    expect(res.body.oslanguage.name).to.be.equal(toCreate.name);
  });

  it('should update a SINGLE oslanguage on /oslanguage/<id> PUT', async () => {
    const res = await request(server)
      .put(`/oslanguage/${id}`)
      .set('Authorization', token)
      .send(toUpdate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const getRes = await request(server)
      .get(`/oslanguage/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(getRes.body).to.have.property('status');
    expect(getRes.body.status).to.be.equal('success');
    expect(getRes.body.oslanguage).to.be.a('object');
    expect(getRes.body.oslanguage).to.have.property('id');
    expect(getRes.body.oslanguage.id).to.be.equal(id);
    expect(getRes.body.oslanguage).to.have.property('name');
    expect(getRes.body.oslanguage.name).to.be.equal(toUpdate.name);
  });

  it('should delete a SINGLE oslanguage on /oslanguage/<id> DELETE', async () => {
    const res = await request(server)
      .delete(`/oslanguage/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const OsLanguageRepository = DB.getDataStore().getRepository(OsLanguage);
    await OsLanguageRepository.delete(id);
  });
});
