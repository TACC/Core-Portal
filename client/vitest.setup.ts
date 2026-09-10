import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '@tacc/test-fixtures';
import '@testing-library/jest-dom';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
