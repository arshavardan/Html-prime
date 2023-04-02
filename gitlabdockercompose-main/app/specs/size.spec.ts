import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import server from '../server.js';
import DB from '../utils/connectors/typeorm.js';
import { Size } from '../models/size.js';

const token = 'none';

const toCreate = {
  name: 'Small',
  cpus: 2,
  ram: 1024,
  storage: 100,
};

const toUpdate = {
  name: 'Large',
  cpus: 4,
  ram: 2048,
  storage: 200,
};

describe('Size', () => {
  let id: string = 'none';

  beforeAll(async () => {
    // Wait for database to initiate before running the test cases
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it('should add a SINGLE size on /size POST', async () => {
    const res = await request(server)
      .post('/size')
      .set('Authorization', token)
      .send(toCreate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.size).to.be.a('object');
    expect(res.body.size).to.have.property('id');
    expect(res.body.size).to.have.property('name');
    expect(res.body.size.name).to.be.equal(toCreate.name);
    expect(res.body.size).to.have.property('cpus');
    expect(res.body.size.cpus).to.be.equal(toCreate.cpus);
    expect(res.body.size).to.have.property('ram');
    expect(res.body.size.ram).to.be.equal(toCreate.ram);
    expect(res.body.size).to.have.property('storage');
    expect(res.body.size.storage).to.be.equal(toCreate.storage);
    id = res.body.size.id;
  });

  it('should list ALL sizes on /size GET', async () => {
    const res = await request(server)
      .get('/size')
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.sizes).to.be.a('array');
    expect(res.body.count).to.be.a('number');
    expect(res.body.pages).to.be.a('number');
  });

  it('should list a SINGLE size on /size/<id> GET', async () => {
    const res = await request(server)
      .get(`/size/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.size).to.be.a('object');
    expect(res.body.size.id).to.be.equal(id);
    expect(res.body.size).to.have.property('id');
    expect(res.body.size).to.have.property('name');
    expect(res.body.size.name).to.be.equal(toCreate.name);
    expect(res.body.size).to.have.property('cpus');
    expect(res.body.size.cpus).to.be.equal(toCreate.cpus);
    expect(res.body.size).to.have.property('ram');
    expect(res.body.size.ram).to.be.equal(toCreate.ram);
    expect(res.body.size).to.have.property('storage');
    expect(res.body.size.storage).to.be.equal(toCreate.storage);
  });

  it('should update a SINGLE size on /size/<id> PUT', async () => {
    const res = await request(server)
      .put(`/size/${id}`)
      .set('Authorization', token)
      .send(toUpdate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const getRes = await request(server)
      .get(`/size/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(getRes.body).to.have.property('status');
    expect(getRes.body.status).to.be.equal('success');
    expect(getRes.body.size).to.be.a('object');
    expect(getRes.body.size).to.have.property('id');
    expect(getRes.body.size.id).to.be.equal(id);
    expect(getRes.body.size).to.have.property('name');
    expect(getRes.body.size.name).to.be.equal(toUpdate.name);
    expect(getRes.body.size).to.have.property('cpus');
    expect(getRes.body.size.cpus).to.be.equal(toUpdate.cpus);
    expect(getRes.body.size).to.have.property('ram');
    expect(getRes.body.size.ram).to.be.equal(toUpdate.ram);
    expect(getRes.body.size).to.have.property('storage');
    expect(getRes.body.size.storage).to.be.equal(toUpdate.storage);
  });

  it('should delete a SINGLE size on /size/<id> DELETE', async () => {
    const res = await request(server)
      .delete(`/size/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const SizeRepository = DB.getDataStore().getRepository(Size);
    await SizeRepository.delete(id);
  });
});
