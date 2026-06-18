// js/admin.js

document.addEventListener('DOMContentLoaded', () => {
  // Guard page for Admin role only
  window.Auth.requireRole(['Admin']);

  const tableBody = document.getElementById('users-table-body');
  const formAddUser = document.getElementById('form-add-user');

  // Load and render user list
  async function loadUsers() {
    tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-gray-500 py-4">Memuat data...</td></tr>';
    
    const { data: users, error } = await window.supabaseClient
      .from('user_roles')
      .select('*')
      .order('username', { ascending: true });

    if (error) {
      tableBody.innerHTML = `<tr><td colspan="3" class="text-center text-red-500 py-4">Error: ${error.message}</td></tr>`;
      return;
    }

    if (users.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-gray-500 py-4">Tidak ada pengguna ditemukan.</td></tr>';
      return;
    }

    tableBody.innerHTML = '';
    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="font-medium">${escapeHTML(user.username)}</td>
        <td><span class="badge ${user.role === 'Admin' ? 'badge-pass' : 'badge-waiting'}">${user.role}</span></td>
        <td class="text-right">
          ${user.username === 'admin' ? 
            `<span class="text-xs text-gray-600">Sistem</span>` : 
            `<button class="btn btn-danger text-xs py-1 px-3 btn-delete-user" data-id="${user.id}">Hapus</button>`
          }
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Attach delete listeners
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const userId = e.target.getAttribute('data-id');
        if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
          const { error: delError } = await window.supabaseClient
            .from('user_roles')
            .delete()
            .eq('id', userId);

          if (delError) {
            alert('Gagal menghapus user: ' + delError.message);
          } else {
            loadUsers();
          }
        }
      });
    });
  }

  // Handle Form submit
  formAddUser.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('add-username').value.trim();
    const password = document.getElementById('add-password').value;
    const role = document.getElementById('add-role').value;

    const { error: insertError } = await window.supabaseClient
      .from('user_roles')
      .insert([{ username, password, role }]);

    if (insertError) {
      alert('Gagal menambahkan user (kemungkinan username sudah terpakai): ' + insertError.message);
    } else {
      formAddUser.reset();
      loadUsers();
    }
  });

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Initial load
  loadUsers();
});
