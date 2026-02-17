const express = require('express');
const supertest = require('supertest');
const mongoose = require('mongoose');

// Mock mongoose
jest.mock('mongoose', () => {
    const actualMongoose = jest.requireActual('mongoose');
    const mockModel = {
        find: jest.fn(),
    };

    function MockModel(data) {
        Object.assign(this, data);
        this.save = jest.fn().mockResolvedValue(this);
    }
    Object.assign(MockModel, mockModel);

    return {
        ...actualMongoose,
        Schema: actualMongoose.Schema,
        model: jest.fn().mockReturnValue(MockModel),
        connect: jest.fn().mockResolvedValue(null),
    };
});

const router = require('../messages');
const app = express();
app.use(express.json());
app.use('/', router);

describe('Message Service Unit Tests', () => {
    let MockMessage;

    beforeEach(() => {
        jest.clearAllMocks();
        MockMessage = mongoose.model('Message');
    });

    describe('GET /:userId1/:userId2', () => {
        it('should return messages between two users', async () => {
            const messages = [{ senderId: 'u1', receiverId: 'u2', content: 'Hi' }];
            MockMessage.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue(messages)
            });

            const res = await supertest(app).get('/u1/u2');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(messages);
        });
    });

    describe('POST /', () => {
        it('should send a new message', async () => {
            const msgData = { senderId: 'u1', receiverId: 'u2', content: 'Hello' };
            const res = await supertest(app)
                .post('/')
                .send(msgData);

            expect(res.status).toBe(201);
            expect(res.body.content).toBe(msgData.content);
        });
    });
});
