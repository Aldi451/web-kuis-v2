// tests/test-auth.js

describe('Auth Module', function() {
  beforeEach(function() {
    localStorage.removeItem('auth_user');
  });

  it('should login and save user info to localStorage', async function() {
    // Mock Supabase response
    const mockData = { username: 'admin', role: 'Host' };
    window.supabaseClient.single = function() {
      return Promise.resolve({ data: mockData, error: null });
    };

    const user = await window.Auth.login('admin', 'password');
    expect(user.username).to.equal('admin');

    const session = JSON.parse(localStorage.getItem('auth_user'));
    expect(session.username).to.equal('admin');
    expect(session.role).to.equal('Host');
  });

  it('should throw error on failed login', async function() {
    window.supabaseClient.single = function() {
      return Promise.resolve({ data: null, error: { message: "Invalid" } });
    };

    try {
      await window.Auth.login('admin', 'wrongpass');
      expect.fail('Should have thrown an error');
    } catch (e) {
      expect(e.message).to.equal("Username atau password salah.");
    }
  });

  it('should get current user from localStorage', function() {
    localStorage.setItem('auth_user', JSON.stringify({ username: 'testuser', role: 'Participant' }));
    const user = window.Auth.getCurrentUser();
    expect(user).to.not.be.null;
    expect(user.username).to.equal('testuser');
  });
});
