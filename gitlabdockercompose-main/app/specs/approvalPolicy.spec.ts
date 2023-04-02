import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import server from '../server.js';
import DB from '../utils/connectors/typeorm.js';
import { ApprovalPolicy } from '../models/approvalPolicy.js';

const token = 'none';

const toCreate = {
  name: 'Policy 1',
  policies: [{ userGroups: 'admin', expiresInDays: 7, defaultAction: 'reject' }],
};

const toUpdate = {
  name: 'Policy 1',
  policies: [{ userGroups: 'admin', expiresInDays: 7, defaultAction: 'reject' }],
};

describe('Approvalpolicy', () => {
  let id: string = 'none';

  beforeAll(async () => {
    // Wait for database to initiate before running the test cases
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it('should add a SINGLE approvalpolicy on /approvalpolicy POST', async () => {
    const res = await request(server)
      .post('/approvalpolicy')
      .set('Authorization', token)
      .send(toCreate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.approvalpolicy).to.be.a('object');
    expect(res.body.approvalpolicy).to.have.property('id');
    expect(res.body.approvalpolicy).to.have.property('name');
    expect(res.body.approvalpolicy.name).to.be.equal(toCreate.name);
    expect(res.body.approvalpolicy).to.have.property('policies');
    expect(res.body.approvalpolicy.policies).to.be.a('array');
    expect(res.body.approvalpolicy.policies[0]).toMatchObject(toCreate.policies[0]);
    id = res.body.approvalpolicy.id;
  });

  it('should list ALL approvalpolicies on /approvalpolicy GET', async () => {
    const res = await request(server)
      .get('/approvalpolicy')
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.approvalpolicies).to.be.a('array');
    expect(res.body.count).to.be.a('number');
    expect(res.body.pages).to.be.a('number');
  });

  it('should list a SINGLE approvalpolicy on /approvalpolicy/<id> GET', async () => {
    const res = await request(server)
      .get(`/approvalpolicy/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');
    expect(res.body.approvalpolicy).to.be.a('object');
    expect(res.body.approvalpolicy.id).to.be.equal(id);
    expect(res.body.approvalpolicy).to.have.property('id');
    expect(res.body.approvalpolicy).to.have.property('name');
    expect(res.body.approvalpolicy.name).to.be.equal(toCreate.name);
    expect(res.body.approvalpolicy).to.have.property('policies');
    expect(res.body.approvalpolicy.policies).to.be.a('array');
    expect(res.body.approvalpolicy.policies[0]).toMatchObject(toCreate.policies[0]);
  });

  it('should update a SINGLE approvalpolicy on /approvalpolicy/<id> PUT', async () => {
    const res = await request(server)
      .put(`/approvalpolicy/${id}`)
      .set('Authorization', token)
      .send(toUpdate)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const getRes = await request(server)
      .get(`/approvalpolicy/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(getRes.body).to.have.property('status');
    expect(getRes.body.status).to.be.equal('success');
    expect(getRes.body.approvalpolicy).to.be.a('object');
    expect(getRes.body.approvalpolicy).to.have.property('id');
    expect(getRes.body.approvalpolicy.id).to.be.equal(id);
    expect(getRes.body.approvalpolicy).to.have.property('name');
    expect(getRes.body.approvalpolicy.name).to.be.equal(toUpdate.name);
    expect(getRes.body.approvalpolicy).to.have.property('policies');
    expect(getRes.body.approvalpolicy.policies).to.be.a('array');
    expect(getRes.body.approvalpolicy.policies[0]).toMatchObject(toUpdate.policies[0]);
  });

  it('should delete a SINGLE approvalpolicy on /approvalpolicy/<id> DELETE', async () => {
    const res = await request(server)
      .delete(`/approvalpolicy/${id}`)
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8');
    expect(res.body).to.have.property('status');
    expect(res.body.status).to.be.equal('success');

    const ApprovalPolicyRepository = DB.getDataStore().getRepository(ApprovalPolicy);
    await ApprovalPolicyRepository.delete(id);
  });
});
