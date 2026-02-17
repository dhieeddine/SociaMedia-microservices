const express = require('express');
const supertest = require('supertest');
const mongoose = require('mongoose');

// Mock mongoose
jest.mock('mongoose', () => {
    const actualMongoose = jest.requireActual('mongoose');
    const mockModel = {
        find: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        updateOne: jest.fn(),
    };

    // Constructor mock
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

const router = require('../posts');
const app = express();
app.use(express.json());
app.use('/', router);

describe('Post Service Unit Tests', () => {
    let MockPost;

    beforeEach(() => {
        jest.clearAllMocks();
        MockPost = mongoose.model('Post');
    });

    describe('GET /', () => {
        it('should return all posts sorted by date', async () => {
            const posts = [{ content: 'Post 1' }, { content: 'Post 2' }];
            MockPost.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue(posts)
            });

            const res = await supertest(app).get('/');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(posts);
        });
    });

    describe('POST /', () => {
        it('should create a new post', async () => {
            const postData = { userId: 'user123', content: 'Test content' };
            const res = await supertest(app)
                .post('/')
                .send(postData);

            expect(res.status).toBe(201);
            expect(res.body.content).toBe(postData.content);
        });
    });
});
