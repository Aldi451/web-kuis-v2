// tests/question-bank.test.js

// Mock DOM elements and question bank functionality
let allQuestions;
let categories;

beforeEach(() => {
  jest.clearAllMocks();

  allQuestions = [];
  categories = new Set();

  // Mock Supabase client
  window.supabaseClient = {
    from: jest.fn((table) => ({
      select: jest.fn(function() {
        return this;
      }),
      eq: jest.fn(function() {
        return this;
      }),
      order: jest.fn(function() {
        return this;
      }),
      delete: jest.fn(function() {
        return this;
      }),
      update: jest.fn(function() {
        return this;
      }),
      insert: jest.fn(function() {
        return this;
      }),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  };

  // Mock document elements
  document.body.innerHTML = `
    <table id="question-bank-table">
      <tbody id="question-bank-tbody"></tbody>
    </table>
    <select id="question-category-filter"></select>
    <select id="quiz-category-select"></select>
    <div id="quiz-question-list-container"></div>
    <span id="selected-questions-count">0 Terpilih</span>
    <form id="form-question">
      <input type="hidden" id="edit-question-id">
      <input id="question-text">
      <input id="option-a">
      <input id="option-b">
      <input id="option-c">
      <input id="option-d">
      <select id="correct-option"></select>
      <input id="question-category">
    </form>
    <div id="question-modal" class="hidden"></div>
  `;
});

describe('Question Bank Module', () => {
  
  describe('escapeHTML()', () => {
    it('should escape HTML special characters', () => {
      const escapeHTML = (str) => {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
          tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
      };

      expect(escapeHTML('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#47;script&gt;');
      expect(escapeHTML('Normal & Text')).toBe('Normal &amp; Text');
      expect(escapeHTML("It's")).toBe('It&#39;s');
    });

    it('should handle empty or null strings', () => {
      const escapeHTML = (str) => {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
          tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
      };

      expect(escapeHTML('')).toBe('');
      expect(escapeHTML(null)).toBe('');
    });
  });

  describe('updateCategoryDropdowns()', () => {
    it('should populate category dropdowns with available categories', () => {
      const updateCategoryDropdowns = () => {
        const filterSelect = document.getElementById('question-category-filter');
        const quizSelect = document.getElementById('quiz-category-select');
        
        if (filterSelect) {
          const currentFilterVal = filterSelect.value;
          filterSelect.innerHTML = '<option value="All">Semua Kategori</option>';
          categories.forEach(cat => {
            filterSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
          });
          filterSelect.value = currentFilterVal;
        }

        if (quizSelect) {
          const currentQuizVal = quizSelect.value;
          quizSelect.innerHTML = '<option value="All">Semua Kategori</option>';
          categories.forEach(cat => {
            quizSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
          });
          quizSelect.value = currentQuizVal;
        }
      };

      categories.add('Matematika');
      categories.add('Bahasa Indonesia');

      updateCategoryDropdowns();

      const filterSelect = document.getElementById('question-category-filter');
      expect(filterSelect.innerHTML).toContain('Matematika');
      expect(filterSelect.innerHTML).toContain('Bahasa Indonesia');
    });
  });

  describe('renderQuestionBank()', () => {
    it('should display message when no questions are available', () => {
      const renderQuestionBank = () => {
        const tbody = document.getElementById('question-bank-tbody');
        if (!tbody) return;

        const filterVal = 'All';
        const filtered = allQuestions;

        if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500 py-4">Tidak ada soal ditemukan.</td></tr>';
          return;
        }
      };

      renderQuestionBank();

      const tbody = document.getElementById('question-bank-tbody');
      expect(tbody.innerHTML).toContain('Tidak ada soal ditemukan');
    });

    it('should render questions in table format', () => {
      const escapeHTML = (str) => {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
          tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
      };

      const renderQuestionBank = () => {
        const tbody = document.getElementById('question-bank-tbody');
        if (!tbody) return;

        const filtered = allQuestions;

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
      };

      allQuestions = [
        { id: 1, question_text: 'Test Question', category: 'Math', correct_option: 'A' }
      ];

      renderQuestionBank();

      const tbody = document.getElementById('question-bank-tbody');
      expect(tbody.innerHTML).toContain('Test Question');
      expect(tbody.innerHTML).toContain('Math');
    });
  });

  describe('updateSelectedCount()', () => {
    it('should update count of selected questions', () => {
      document.body.innerHTML += `
        <input type="checkbox" name="quiz_questions" value="1" checked>
        <input type="checkbox" name="quiz_questions" value="2" checked>
        <input type="checkbox" name="quiz_questions" value="3">
      `;

      const updateSelectedCount = () => {
        const checkboxes = document.querySelectorAll('input[name="quiz_questions"]:checked');
        const countSpan = document.getElementById('selected-questions-count');
        if (countSpan) {
          countSpan.textContent = `${checkboxes.length} Terpilih`;
        }
      };

      updateSelectedCount();

      const countSpan = document.getElementById('selected-questions-count');
      expect(countSpan.textContent).toBe('2 Terpilih');
    });
  });

  describe('Question validation', () => {
    it('should validate required question fields', () => {
      const validateQuestion = (q) => {
        return q.question_text && q.option_a && q.option_b && q.option_c && q.option_d && q.correct_option;
      };

      const validQuestion = {
        question_text: 'What is 2+2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_option: 'B'
      };

      const invalidQuestion = {
        question_text: 'What is 2+2?',
        option_a: '3',
        // Missing other options
      };

      expect(validateQuestion(validQuestion)).toBe(true);
      expect(validateQuestion(invalidQuestion)).toBe(false);
    });
  });
});
