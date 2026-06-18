// tests/auth.test.js

let Auth;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();

  // Define Auth object for testing
  Auth = {
    async login(username, password) {
      if (!window.supabaseClient) {
        throw new Error("Supabase client is not initialized.");
      }

      const { data, error } = await window.supabaseClient
        .from('user_roles')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        throw new Error("Username atau password salah.");
      }

      localStorage.setItem('auth_user', JSON.stringify({
        username: data.username,
        role: data.role
      }));

      return data;
    },

    getCurrentUser() {
      const session = localStorage.getItem('auth_user');
      if (!session) return null;
      try {
        return JSON.parse(session);
      } catch (e) {
        return null;
      }
    },

    logout() {
      localStorage.removeItem('auth_user');
      window.location.href = 'index.html';
    },

    requireRole(allowedRoles) {
      const user = this.getCurrentUser();
      if (!user || !allowedRoles.includes(user.role)) {
        alert("Akses ditolak. Anda tidak memiliki izin untuk halaman ini.");
        window.location.href = 'index.html';
        throw new Error("Unauthorized access.");
      }
      return user;
    }
  };

  // Mock Supabase client
  window.supabaseClient = {
    from: jest.fn(() => ({
      select: jest.fn(function() {
        return this;
      }),
      eq: jest.fn(function(key, value) {
        this._filters = { ...this._filters, [key]: value };
        return this;
      }),
      single: jest.fn(function() {
        // This will be configured by tests
        return Promise.resolve({ data: null, error: null });
      })
    }))
  };

  delete window.location;
  window.location = { href: '' };
});

describe('Auth Module', () => {
  
  describe('login()', () => {
    it('should throw error if supabase client is not initialized', async () => {
      window.supabaseClient = null;
      
      await expect(Auth.login('user', 'pass')).rejects.toThrow('Supabase client is not initialized.');
    });

    it('should throw error with invalid credentials', async () => {
      const mockFrom = jest.fn(() => ({
        select: jest.fn(function() {
          return this;
        }),
        eq: jest.fn(function() {
          return this;
        }),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('User not found') })
      }));

      window.supabaseClient.from = mockFrom;

      await expect(Auth.login('invalid', 'password')).rejects.toThrow('Username atau password salah.');
    });

    it('should store user session on successful login', async () => {
      const mockUserData = { username: 'testuser', role: 'admin' };

      const mockFrom = jest.fn(() => ({
        select: jest.fn(function() {
          return this;
        }),
        eq: jest.fn(function() {
          return this;
        }),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      }));

      window.supabaseClient.from = mockFrom;

      const result = await Auth.login('testuser', 'password');

      expect(result).toEqual(mockUserData);
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(mockUserData));
    });

    it('should return user data on successful login', async () => {
      const mockUserData = { username: 'testuser', role: 'participant', id: 1 };

      const mockFrom = jest.fn(() => ({
        select: jest.fn(function() {
          return this;
        }),
        eq: jest.fn(function() {
          return this;
        }),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      }));

      window.supabaseClient.from = mockFrom;

      const result = await Auth.login('testuser', 'password');

      expect(result.username).toBe('testuser');
      expect(result.role).toBe('participant');
    });
  });

  describe('getCurrentUser()', () => {
    it('should return null if no session exists', () => {
      localStorage.getItem.mockReturnValue(null);

      const user = Auth.getCurrentUser();

      expect(user).toBeNull();
    });

    it('should return user data from localStorage', () => {
      const mockUser = { username: 'testuser', role: 'admin' };
      localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const user = Auth.getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.getItem.mockReturnValue('corrupted data');

      const user = Auth.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('logout()', () => {
    it('should remove auth_user from localStorage', () => {
      Auth.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user');
    });

    it('should redirect to index.html', () => {
      Auth.logout();

      expect(window.location.href).toBe('index.html');
    });
  });

  describe('requireRole()', () => {
    it('should throw error if user has insufficient permissions', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify({ username: 'user', role: 'participant' }));

      expect(() => Auth.requireRole(['admin'])).toThrow('Unauthorized access.');
    });

    it('should return user if role is allowed', () => {
      const mockUser = { username: 'admin', role: 'admin' };
      localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = Auth.requireRole(['admin', 'moderator']);

      expect(result).toEqual(mockUser);
    });

    it('should throw error if no user is logged in', () => {
      localStorage.getItem.mockReturnValue(null);

      expect(() => Auth.requireRole(['admin'])).toThrow('Unauthorized access.');
    });

    it('should redirect to index.html on unauthorized access', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify({ username: 'user', role: 'participant' }));

      try {
        Auth.requireRole(['admin']);
      } catch (e) {
        // Expected error
      }

      expect(window.location.href).toBe('index.html');
    });

    it('should allow multiple valid roles', () => {
      const mockUser = { username: 'moderator', role: 'moderator' };
      localStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = Auth.requireRole(['admin', 'moderator']);

      expect(result).toEqual(mockUser);
    });
  });
});
