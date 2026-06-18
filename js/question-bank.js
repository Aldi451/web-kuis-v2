// js/question-bank.js

let allQuestions = [];
let categories = new Set();

async function loadQuestionBank() {
  if (!window.supabaseClient) return;

  const { data: questions, error } = await window.supabaseClient
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Gagal memuat soal:", error);
    return;
  }

  allQuestions = questions;
  categories.clear();
  questions.forEach(q => {
    if (q.category) categories.add(q.category);
  });

  updateCategoryDropdowns();
  renderQuestionBank();
  renderQuestionListForQuiz();
}

function updateCategoryDropdowns() {
  const filterSelect = document.getElementById('question-category-filter');
  const quizSelect = document.getElementById('quiz-category-select');
  
  if (filterSelect) {
    const currentFilterVal = filterSelect.value;
    filterSelect.innerHTML = '<option value="All">Semua Kategori</option>';
    categories.forEach(cat => {
      filterSelect.innerHTML += `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`;
    });
    filterSelect.value = currentFilterVal;
  }

  if (quizSelect) {
    const currentQuizVal = quizSelect.value;
    quizSelect.innerHTML = '<option value="All">Semua Kategori</option>';
    categories.forEach(cat => {
      quizSelect.innerHTML += `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`;
    });
    quizSelect.value = currentQuizVal;
  }
}

function renderQuestionBank() {
  const tbody = document.getElementById('question-bank-tbody');
  if (!tbody) return;

  const filterVal = document.getElementById('question-category-filter').value;
  const filtered = filterVal === 'All' ? allQuestions : allQuestions.filter(q => q.category === filterVal);

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500 py-4">Tidak ada soal ditemukan.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  filtered.forEach(q => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="font-medium max-w-xs truncate">${escapeHTML(q.question_text)}</td>
      <td><span class="badge badge-waiting">${escapeHTML(q.category || 'Umum')}</span></td>
      <td class="font-bold text-indigo-400">${q.correct_option}</td>
      <td class="text-right flex justify-end gap-2">
        <button onclick="editQuestion(${q.id})" class="btn btn-secondary text-xs py-1 px-3">Edit</button>
        <button onclick="deleteQuestion(${q.id})" class="btn btn-danger text-xs py-1 px-3">Hapus</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderQuestionListForQuiz() {
  const container = document.getElementById('quiz-question-list-container');
  if (!container) return;

  const categoryFilterVal = document.getElementById('quiz-category-select').value;
  const filtered = categoryFilterVal === 'All' ? allQuestions : allQuestions.filter(q => q.category === categoryFilterVal);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm">Tidak ada soal tersedia untuk kategori ini.</p>';
    return;
  }

  container.innerHTML = '';
  filtered.forEach(q => {
    const div = document.createElement('div');
    div.className = 'flex items-start gap-3 p-3 border-b border-gray-800 hover:bg-gray-900 rounded-lg mb-2';
    div.innerHTML = `
      <input type="checkbox" name="quiz_questions" value="${q.id}" id="chk-q-${q.id}" onchange="updateSelectedCount()" class="mt-1">
      <label for="chk-q-${q.id}" class="text-sm cursor-pointer flex-1">
        <div class="font-medium text-gray-200">${escapeHTML(q.question_text)}</div>
        <div class="text-xs text-gray-400 mt-1">
          Kategori: <span class="text-indigo-400">${escapeHTML(q.category || 'Umum')}</span> | Jawaban: <span class="text-green-400">${q.correct_option}</span>
        </div>
      </label>
    `;
    container.appendChild(div);
  });
  updateSelectedCount();
}

function updateSelectedCount() {
  const checkboxes = document.querySelectorAll('input[name="quiz_questions"]:checked');
  const countSpan = document.getElementById('selected-questions-count');
  if (countSpan) {
    countSpan.textContent = `${checkboxes.length} Terpilih`;
  }
}

// Modal actions
function openQuestionModal() {
  document.getElementById('form-question').reset();
  document.getElementById('edit-question-id').value = '';
  document.getElementById('question-modal-title').textContent = 'Tambah Soal Baru';
  document.getElementById('question-modal').classList.remove('hidden');
}

function closeQuestionModal() {
  document.getElementById('question-modal').classList.add('hidden');
}

async function editQuestion(id) {
  const q = allQuestions.find(item => item.id === id);
  if (!q) return;

  document.getElementById('edit-question-id').value = q.id;
  document.getElementById('question-text').value = q.question_text;
  document.getElementById('option-a').value = q.option_a;
  document.getElementById('option-b').value = q.option_b;
  document.getElementById('option-c').value = q.option_c;
  document.getElementById('option-d').value = q.option_d;
  document.getElementById('correct-option').value = q.correct_option;
  document.getElementById('question-category').value = q.category;

  document.getElementById('question-modal-title').textContent = 'Edit Soal';
  document.getElementById('question-modal').classList.remove('hidden');
}

async function deleteQuestion(id) {
  if (confirm('Apakah Anda yakin ingin menghapus soal ini?')) {
    const { error } = await window.supabaseClient
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Gagal menghapus soal: " + error.message);
    } else {
      loadQuestionBank();
    }
  }
}

// Save question handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-question');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-question-id').value;
      const question_text = document.getElementById('question-text').value.trim();
      const option_a = document.getElementById('option-a').value.trim();
      const option_b = document.getElementById('option-b').value.trim();
      const option_c = document.getElementById('option-c').value.trim();
      const option_d = document.getElementById('option-d').value.trim();
      const correct_option = document.getElementById('correct-option').value;
      const category = document.getElementById('question-category').value.trim();

      const payload = { question_text, option_a, option_b, option_c, option_d, correct_option, category };

      if (id) {
        // Update
        const { error } = await window.supabaseClient
          .from('questions')
          .update(payload)
          .eq('id', id);
        if (error) alert("Gagal mengupdate: " + error.message);
      } else {
        // Insert
        const { error } = await window.supabaseClient
          .from('questions')
          .insert([payload]);
        if (error) alert("Gagal menyimpan: " + error.message);
      }

      closeQuestionModal();
      loadQuestionBank();
    });
  }

  const catFilter = document.getElementById('question-category-filter');
  if (catFilter) {
    catFilter.addEventListener('change', renderQuestionBank);
  }

  const quizCatSelect = document.getElementById('quiz-category-select');
  if (quizCatSelect) {
    quizCatSelect.addEventListener('change', renderQuestionListForQuiz);
  }
});

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
