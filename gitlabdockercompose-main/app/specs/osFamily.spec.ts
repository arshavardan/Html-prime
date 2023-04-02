import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import server from '../server.js';
import DB from '../utils/connectors/typeorm.js';
import { OsFamily } from '../models/osFamily.js';

const token = 'none';

const toCreate = {
  name: 'Linux',
  shortName: 'LN',
};

const toUpdate = {
  name: 'Windows',
  shortName: 'WS',
};

describe('Osfamily', () => {
  let id: string = 'none';

  beforeAll(async () => {
    // Wait for database to initiate before running the test cases
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it('should add a SINGLE osfamily on /osfamily POST', async () => {
    const res = await request(server)
      .post('/osfamily')
      .set('Authorization', token)
      .send(toCreate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.osfamily).to.be.a('object');
    expect(res.body.osfamily).to.have.property('id');
    expect(res.body.osfamily).to.have.property('name');
    expect(res.body.osfamily.name).to.be.equal(toCreate.name);
    expect(res.body.osfamily).to.have.property('shortName');
    expect(res.body.osfamily.shortName).to.be.equal(toCreate.shortName);
    id = res.body.osfamily.id;
  });

  it('should list ALL osfamilies on /osfamily GET', async () => {
    const res = await request(server)
      .get('/osfamily')
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.osfamilies).to.be.a('array');
    expect(res.body.count).to.be.a('number');
    expect(res.body.pages).to.be.a('number');
  });

  it('should list a SINGLE osfamily on /osfamily/<id> GET', async () => {
    const res = await request(server)
      .get(`/osfamily/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.osfamily).to.be.a('object');
    expect(res.body.osfamily.id).to.be.equal(id);
    expect(res.body.osfamily).to.have.property('id');
    expect(res.body.osfamily).to.have.property('name');
    expect(res.body.osfamily.name).to.be.equal(toCreate.name);
    expect(res.body.osfamily).to.have.property('shortName');
    expect(res.body.osfamily.shortName).to.be.equal(toCreate.shortName);
  });

  it('should update a SINGLE osfamily on /osfamily/<id> PUT', async () => {
    const res = await request(server)
      .put(`/osfamily/${id}`)
      .set('Authorization', token)
      .send(toUpdate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const getRes = await request(server)
      .get(`/osfamily/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(getRes.body).to.have.property('status');
    expect(getRes.body.status).to.be.equal('success');
    expect(getRes.body.osfamily).to.be.a('object');
    expect(getRes.body.osfamily).to.have.property('id');
    expect(getRes.body.osfamily.id).to.be.equal(id);
    expect(getRes.body.osfamily).to.have.property('name');
    expect(getRes.body.osfamily.name).to.be.equal(toUpdate.name);
    expect(getRes.body.osfamily).to.have.property('shortName');
    expect(getRes.body.osfamily.shortName).to.be.equal(toUpdate.shortName);
  });

  it('should delete a SINGLE osfamily on /osfamily/<id> DELETE', async () => {
    const res = await request(server)
      .delete(`/osfamily/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const OsFamilyRepository = DB.getDataStore().getRepository(OsFamily);
    await OsFamilyRepository.delete(id);
  });
});
