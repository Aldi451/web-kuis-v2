// tests/test-timer.js

describe('Timer Module', function() {
  afterEach(function() {
    window.Timer.stop();
  });

  it('should format time correctly for exact minutes', function(done) {
    let tickCount = 0;
    window.Timer.start(120, function(formattedTime, isLow) {
      if (tickCount === 0) {
        expect(formattedTime).to.equal('02:00');
        expect(isLow).to.be.false;
        done();
      }
      tickCount++;
    });
  });

  it('should set isLow to true when time is under 60 seconds', function(done) {
    let tickCount = 0;
    window.Timer.start(59, function(formattedTime, isLow) {
      if (tickCount === 0) {
        expect(isLow).to.be.true;
        done();
      }
      tickCount++;
    });
  });

  it('should call onExpired when time is up', function(done) {
    // We override start's interval temporarily for faster testing or just test 1 second
    window.Timer.start(1, function() {}, function() {
      // Expired!
      expect(window.Timer.timeRemaining).to.equal(0);
      done();
    });
  });
});
