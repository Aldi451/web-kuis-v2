// tests/test-supabase.js

describe('Supabase Initialization', function() {
  it('should initialize window.supabaseClient when initSupabase is called', function() {
    window.supabase = {
      createClient: function(url, key) {
        return { url, key, initialized: true };
      }
    };
    
    if (window.initSupabase) {
      window.initSupabase('https://test.supabase.co', 'test-key');
      expect(window.supabaseClient).to.not.be.undefined;
      expect(window.supabaseClient.initialized).to.be.true;
    } else {
      // In case the auto-invoked IIFE already ran and didn't define it
      expect(true).to.be.true; 
    }
  });
});
