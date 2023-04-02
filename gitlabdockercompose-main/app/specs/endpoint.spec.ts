import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import server from '../server.js';
import DB from '../utils/connectors/typeorm.js';
import { Endpoint } from '../models/endpoint.js';

const token = 'none';

const toCreate = {
  name: 'Endpoint Name',
  shortName: 'IN',
  url: 'https://inxxxxxx.siemens.com',
  username: 'inxxxxusername',
  password: 'xxxxxx',
  availableClusters: ['/DC0/vm/cluster'],
};

const toUpdate = {
  name: 'Endpoint Name',
  shortName: 'IN',
  url: 'https://inxxxxxx.siemens.com',
  username: 'inxxxxusername',
  password: 'xxxxxx',
  availableClusters: ['/DC0/vm/cluster'],
};

describe('Endpoint', () => {
  let id: string = 'none';

  beforeAll(async () => {
    // Wait for database to initiate before running the test cases
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it('should add a SINGLE endpoint on /endpoint POST', async () => {
    const res = await request(server)
      .post('/endpoint')
      .set('Authorization', token)
      .send(toCreate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.endpoint).to.be.a('object');
    expect(res.body.endpoint).to.have.property('id');
    expect(res.body.endpoint).to.have.property('name');
    expect(res.body.endpoint.name).to.be.equal(toCreate.name);
    expect(res.body.endpoint).to.have.property('shortName');
    expect(res.body.endpoint.shortName).to.be.equal(toCreate.shortName);
    expect(res.body.endpoint).to.have.property('url');
    expect(res.body.endpoint.url).to.be.equal(toCreate.url);
    expect(res.body.endpoint).to.have.property('username');
    expect(res.body.endpoint.username).to.be.equal(toCreate.username);
    expect(res.body.endpoint).to.have.property('password');
    expect(res.body.endpoint.password).to.be.equal(toCreate.password);
    expect(res.body.endpoint).to.have.property('availableClusters');
    expect(res.body.endpoint.availableClusters).to.be.a('array');
    expect(res.body.endpoint.availableClusters[0]).to.be.equal(toCreate.availableClusters[0]);
    id = res.body.endpoint.id;
  });

  it('should list ALL endpoints on /endpoint GET', async () => {
    const res = await request(server)
      .get('/endpoint')
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.endpoints).to.be.a('array');
    expect(res.body.count).to.be.a('number');
    expect(res.body.pages).to.be.a('number');
  });

  it('should list a SINGLE endpoint on /endpoint/<id> GET', async () => {
    const res = await request(server)
      .get(`/endpoint/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.endpoint).to.be.a('object');
    expect(res.body.endpoint.id).to.be.equal(id);
    expect(res.body.endpoint).to.have.property('id');
    expect(res.body.endpoint).to.have.property('name');
    expect(res.body.endpoint.name).to.be.equal(toCreate.name);
    expect(res.body.endpoint).to.have.property('shortName');
    expect(res.body.endpoint.shortName).to.be.equal(toCreate.shortName);
    expect(res.body.endpoint).to.have.property('url');
    expect(res.body.endpoint.url).to.be.equal(toCreate.url);
    expect(res.body.endpoint).to.have.property('username');
    expect(res.body.endpoint.username).to.be.equal(toCreate.username);
    expect(res.body.endpoint).to.have.property('password');
    expect(res.body.endpoint.password).to.be.equal(toCreate.password);
    expect(res.body.endpoint).to.have.property('availableClusters');
    expect(res.body.endpoint.availableClusters).to.be.a('array');
    expect(res.body.endpoint.availableClusters[0]).to.be.equal(toCreate.availableClusters[0]);
  });

  it('should update a SINGLE endpoint on /endpoint/<id> PUT', async () => {
    const res = await request(server)
      .put(`/endpoint/${id}`)
      .set('Authorization', token)
      .send(toUpdate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const getRes = await request(server)
      .get(`/endpoint/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(getRes.body).to.have.property('status');
    expect(getRes.body.status).to.be.equal('success');
    expect(getRes.body.endpoint).to.be.a('object');
    expect(getRes.body.endpoint).to.have.property('id');
    expect(getRes.body.endpoint.id).to.be.equal(id);
    expect(getRes.body.endpoint).to.have.property('name');
    expect(getRes.body.endpoint.name).to.be.equal(toUpdate.name);
    expect(getRes.body.endpoint).to.have.property('shortName');
    expect(getRes.body.endpoint.shortName).to.be.equal(toUpdate.shortName);
    expect(getRes.body.endpoint).to.have.property('url');
    expect(getRes.body.endpoint.url).to.be.equal(toUpdate.url);
    expect(getRes.body.endpoint).to.have.property('username');
    expect(getRes.body.endpoint.username).to.be.equal(toUpdate.username);
    expect(getRes.body.endpoint).to.have.property('password');
    expect(getRes.body.endpoint.password).to.be.equal(toUpdate.password);
    expect(getRes.body.endpoint).to.have.property('availableClusters');
    expect(getRes.body.endpoint.availableClusters).to.be.a('array');
    expect(getRes.body.endpoint.availableClusters[0]).to.be.equal(toUpdate.availableClusters[0]);
  });

  it('should delete a SINGLE endpoint on /endpoint/<id> DELETE', async () => {
    const res = await request(server)
      .delete(`/endpoint/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const EndpointRepository = DB.getDataStore().getRepository(Endpoint);
    await EndpointRepository.delete(id);
  });
});
