/**
 * Vitest Setup
 *
 * Global test configuration and mocks for rdtect-os
 */

import { vi, beforeAll, afterAll, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock console methods that spam test output
const originalConsole = { ...console };

beforeAll(() => {
	// Silence expected warning messages during tests
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
	// Restore console
	Object.assign(console, originalConsole);
});
