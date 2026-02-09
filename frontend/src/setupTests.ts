import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeEach(() => {
	vi.resetAllMocks();
	localStorage.clear();
});

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});
