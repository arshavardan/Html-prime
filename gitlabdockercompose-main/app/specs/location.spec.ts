import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import server from '../server.js';
import DB from '../utils/connectors/typeorm.js';
import { Location } from '../models/location.js';

const token = 'none';

const toCreate = {
  name: 'Keonics',
  availableNetworks: ['/DC0/vm/network'],
};

const toUpdate = {
  name: 'Salarpuria',
  availableNetworks: ['/DC1/vm/network'],
};

describe('Location', () => {
  let id: string = 'none';

  beforeAll(async () => {
    // Wait for database to initiate before running the test cases
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it('should add a SINGLE location on /location POST', async () => {
    const res = await request(server)
      .post('/location')
      .set('Authorization', token)
      .send(toCreate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.location).to.be.a('object');
    expect(res.body.location).to.have.property('id');
    expect(res.body.location).to.have.property('name');
    expect(res.body.location.name).to.be.equal(toCreate.name);
    expect(res.body.location).to.have.property('availableNetworks');
    expect(res.body.location.availableNetworks).to.be.a('array');
    expect(res.body.location.availableNetworks[0]).to.be.equal(toCreate.availableNetworks[0]);
    id = res.body.location.id;
  });

  it('should list ALL locations on /location GET', async () => {
    const res = await request(server)
      .get('/location')
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.locations).to.be.a('array');
    expect(res.body.count).to.be.a('number');
    expect(res.body.pages).to.be.a('number');
  });

  it('should list a SINGLE location on /location/<id> GET', async () => {
    const res = await request(server)
      .get(`/location/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.location).to.be.a('object');
    expect(res.body.location.id).to.be.equal(id);
    expect(res.body.location).to.have.property('id');
    expect(res.body.location).to.have.property('name');
    expect(res.body.location.name).to.be.equal(toCreate.name);
    expect(res.body.location).to.have.property('availableNetworks');
    expect(res.body.location.availableNetworks).to.be.a('array');
    expect(res.body.location.availableNetworks[0]).to.be.equal(toCreate.availableNetworks[0]);
  });

  it('should update a SINGLE location on /location/<id> PUT', async () => {
    const res = await request(server)
      .put(`/location/${id}`)
      .set('Authorization', token)
      .send(toUpdate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const getRes = await request(server)
      .get(`/location/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(getRes.body).to.have.property('status');
    expect(getRes.body.status).to.be.equal('success');
    expect(getRes.body.location).to.be.a('object');
    expect(getRes.body.location).to.have.property('id');
    expect(getRes.body.location.id).to.be.equal(id);
    expect(getRes.body.location).to.have.property('name');
    expect(getRes.body.location.name).to.be.equal(toUpdate.name);
    expect(getRes.body.location).to.have.property('availableNetworks');
    expect(getRes.body.location.availableNetworks).to.be.a('array');
    expect(getRes.body.location.availableNetworks[0]).to.be.equal(toUpdate.availableNetworks[0]);
  });

  it('should delete a SINGLE location on /location/<id> DELETE', async () => {
    const res = await request(server)
      .delete(`/location/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const LocationRepository = DB.getDataStore().getRepository(Location);
    await LocationRepository.delete(id);
  });
});
