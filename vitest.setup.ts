import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock next/headers
vi.mock('next/headers', () => ({
    headers: vi.fn(() => ({
        get: vi.fn(),
    })),
    cookies: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn(() => []),
    })),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key'
