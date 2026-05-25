// Jest setup file
import { config } from '../src/config/env';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'messenger_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_HOST = 'localhost';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';

beforeAll(() => {
  // Setup before all tests
});

afterAll(() => {
  // Cleanup after all tests
});
