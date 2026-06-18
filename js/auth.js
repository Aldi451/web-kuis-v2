// js/auth.js

const Auth = {
  async login(username, password) {
    if (!window.supabaseClient) {
      throw new Error("Supabase client is not initialized.");
    }

    // Attempt to select from user_roles
    const { data, error } = await window.supabaseClient
      .from('user_roles')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      throw new Error("Username atau password salah.");
    }

    // Store user session info
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

window.Auth = Auth;
