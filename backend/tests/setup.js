process.env.MONGO_URI = 'mongodb://localhost:27017/event-ats-test';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-min32chars';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key-for-testing-min32chars';
process.env.JWT_EXPIRE = '15m';
process.env.JWT_REFRESH_EXPIRE = '7d';
process.env.PORT = '5002'; // avoid conflict with dev server
