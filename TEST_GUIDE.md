# Test-Driven Development (TDD) Guide

## Overview
Repository ini telah dikonfigurasi dengan Jest untuk menjalankan Unit Tests pada semua modul JavaScript.

## Setup Awal

### 1. Install Dependencies
```bash
npm install
```

## Menjalankan Tests

### Run semua tests
```bash
npm test
```

### Run tests dalam watch mode (reload otomatis)
```bash
npm run test:watch
```

### Run tests dengan coverage report
```bash
npm run test:coverage
```

### Run tests dalam CI environment
```bash
npm run test:ci
```

## Test Files

### 1. **tests/timer.test.js**
Tests untuk modul Timer yang menangani countdown dalam quiz.

**Fitur yang di-test:**
- Formatting waktu dengan leading zeros (00:05, 01:30, dll)
- Start timer dengan callback onTick dan onExpired
- Stop timer
- Deteksi waktu rendah (< 60 detik)

**Test Cases:**
- ✅ Format time correctly for onTick callback
- ✅ Call onTick with low time flag
- ✅ Stop previous timer on restart
- ✅ Call onExpired when time runs out
- ✅ Handle zero duration
- ✅ Clear interval on stop
- ✅ Format time with leading zeros
- ✅ Format single digit times

### 2. **tests/auth.test.js**
Tests untuk modul Authentication.

**Fitur yang di-test:**
- Login dengan validasi kredensial
- Menyimpan session di localStorage
- Mengambil current user
- Logout dan redirect
- Role-based access control (RBAC)

**Test Cases:**
- ✅ Throw error if Supabase not initialized
- ✅ Throw error with invalid credentials
- ✅ Store user session on successful login
- ✅ Return user data after login
- ✅ Get current user from localStorage
- ✅ Handle corrupted localStorage data
- ✅ Remove session on logout
- ✅ Redirect to index.html on logout
- ✅ Check role permissions
- ✅ Redirect on unauthorized access
- ✅ Support multiple valid roles

### 3. **tests/question-bank.test.js**
Tests untuk modul Question Bank.

**Fitur yang di-test:**
- HTML escaping untuk security
- Update kategori dropdown
- Render questions dalam table format
- Update count of selected questions
- Validasi question fields

**Test Cases:**
- ✅ Escape HTML special characters
- ✅ Handle empty/null strings
- ✅ Populate category dropdowns
- ✅ Display message when no questions
- ✅ Render questions in table format
- ✅ Update selected count
- ✅ Validate required question fields

## Workflow GitHub Actions

File: `.github/workflows/test.yml`

**Trigger:**
- Setiap push ke branch `main` atau `develop`
- Setiap pull request ke branch `main` atau `develop`

**Jobs:**
- Run tests pada Node.js 18.x dan 20.x
- Upload coverage report ke Codecov

**Status:** 
- Tests harus pass sebelum merge PR

## Coverage Report

Untuk melihat coverage report:
```bash
npm run test:coverage
```

Coverage report akan generate di folder `coverage/`

## Best Practices

### 1. Write Tests First (TDD)
```
1. Write failing test
2. Write minimum code to pass test
3. Refactor if needed
```

### 2. Mock External Dependencies
```javascript
// Mock Supabase
window.supabaseClient = {
  from: jest.fn(() => ({...}))
};

// Mock localStorage
localStorage.getItem = jest.fn();
localStorage.setItem = jest.fn();
```

### 3. Use Descriptive Test Names
```javascript
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('should throw error if Supabase client is not initialized', () => { ... });
```

### 4. Arrange-Act-Assert Pattern
```javascript
it('should do something', () => {
  // Arrange - Setup
  const input = { /* ... */ };
  
  // Act - Execute
  const result = functionToTest(input);
  
  // Assert - Verify
  expect(result).toBe(expected);
});
```

## Adding New Tests

### Template untuk test baru:
```javascript
// tests/new-module.test.js

describe('New Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup fixtures
  });

  describe('Feature Name', () => {
    it('should do something', () => {
      // Arrange
      const input = { /* ... */ };
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

## Debugging Tests

### Run specific test file
```bash
npm test -- tests/timer.test.js
```

### Run specific test suite
```bash
npm test -- --testNamePattern="Timer"
```

### Debug mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## CI/CD Integration

Tests akan otomatis berjalan saat:
1. **Push ke repository** - Memastikan code quality
2. **Pull Request** - Verifikasi sebelum merge
3. **Deployment** - Pastikan release aman

## Troubleshooting

### Error: "Supabase client is not initialized"
```javascript
// Pastikan mock Supabase sebelum test
window.supabaseClient = { /* ... */ };
```

### Error: "localStorage is not defined"
```javascript
// Jest setup sudah handle ini di jest.setup.js
// Check jest.setup.js jika masalah persisten
```

### Tests timeout
```javascript
// Tambahkan timeout jika diperlukan
it('should do async operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing JavaScript](https://testingjavascript.com/)
- [TDD Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Last Updated:** 2026-06-18  
**Maintained by:** Aldi451
**Live Demo:** https://powerprokuis.vercel.app/
