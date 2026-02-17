const express = require('express');
const supertest = require('supertest');
const mongoose = require('mongoose');

// Mock mongoose
jest.mock('mongoose', () => {
    const actualMongoose = jest.requireActual('mongoose');
    const mockModel = {
        aggregate: jest.fn(),
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

const router = require('../stories');
const app = express();
app.use(express.json());
app.use('/', router);

describe('Story Service Unit Tests', () => {
    let MockStory;

    beforeEach(() => {
        jest.clearAllMocks();
        MockStory = mongoose.model('Story');
    });

    describe('GET /', () => {
        it('should return grouped stories', async () => {
            const groupedStories = [{ _id: 'user1', stories: [] }];
            MockStory.aggregate.mockResolvedValue(groupedStories);

            const res = await supertest(app).get('/');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(groupedStories);
        });
    });

    describe('POST /', () => {
        it('should create a new story', async () => {
            const storyData = { userId: 'u1', image: 'base64...' };
            const res = await supertest(app)
                .post('/')
                .send(storyData);

            expect(res.status).toBe(201);
            expect(res.body.userId).toBe(storyData.userId);
        });
    });
});
