import { NextRequest } from 'next/server';
import { POST } from './route';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// Mock the firebaseAdmin module
jest.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
    deleteUser: jest.fn(),
    updateUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
    generatePasswordResetLink: jest.fn(),
  },
  adminDb: {
    collection: jest.fn(),
  },
}));

describe('Admin API Action Route', () => {
  const mockVerifyIdToken = adminAuth!.verifyIdToken as jest.Mock;
  const mockAdminDbCollection = adminDb!.collection as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default adminDb behavior
    mockAdminDbCollection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
            set: jest.fn(),
            delete: jest.fn()
        })
    });
  });

  const createRequest = (body: any, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost:3000/api/admin/action', {
      method: 'POST',
      headers: new Headers(headers),
      body: JSON.stringify(body),
    });
  };

  it('should return 401 if no token is provided', async () => {
    const req = createRequest({ action: 'deleteUser', userId: 'user123' });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 if token is invalid or not admin', async () => {
    mockVerifyIdToken.mockResolvedValue({ role: 'user' }); // Not admin

    const req = createRequest(
        { action: 'deleteUser', userId: 'user123' },
        { Authorization: 'Bearer valid_user_token' }
    );
    const res = await POST(req);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Forbidden');
  });

  it('should succeed if token is valid and admin', async () => {
    mockVerifyIdToken.mockResolvedValue({ role: 'admin' });

    const req = createRequest(
        { action: 'deleteUser', userId: 'user123' },
        { Authorization: 'Bearer valid_admin_token' }
    );
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid_admin_token');
  });
});
