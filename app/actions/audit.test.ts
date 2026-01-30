import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logAudit } from './audit'
import { createClient } from '@/lib/supabase/server'

// Mock the dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}))

describe('logAudit', () => {
    const mockInsert = vi.fn()
    const mockSupabase = {
        from: vi.fn(() => ({
            insert: mockInsert,
        })),
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } } })),
        },
    }

    beforeEach(() => {
        vi.clearAllMocks()
            ; (createClient as any).mockResolvedValue(mockSupabase)
        mockInsert.mockResolvedValue({ error: null })
    })

    it('should call supabase insert with correct parameters', async () => {
        const params = {
            action: 'create' as const,
            entityType: 'properties',
            entityId: 'prop-123',
            changeSummary: 'Test summary',
        }

        await logAudit(params)

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            action: 'create',
            entity_type: 'properties',
            entity_id: 'prop-123',
            change_summary: 'Test summary',
            user_id: 'test-user-id',
        }))
    })

    it('should handle errors gracefully', async () => {
        mockInsert.mockResolvedValue({ error: { message: 'DB Error' } })

        const result = await logAudit({
            action: 'create',
            entityType: 'test',
            entityId: '123',
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('DB Error')
    })
})
