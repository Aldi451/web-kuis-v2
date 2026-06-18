// tests/timer.test.js

// Mock the global Timer object
let Timer;

beforeEach(() => {
  // Clear all timers before each test
  jest.clearAllTimers();
  jest.clearAllMocks();
  
  // Re-define Timer for each test
  Timer = {
    intervalId: null,
    timeRemaining: 0,

    start(durationSeconds, onTick, onExpired) {
      this.stop();
      this.timeRemaining = durationSeconds;

      const tick = () => {
        if (this.timeRemaining <= 0) {
          this.stop();
          if (onExpired) onExpired();
          return;
        }

        this.timeRemaining--;

        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const isLow = this.timeRemaining < 60;
        if (onTick) onTick(formattedTime, isLow);
      };

      const initialMinutes = Math.floor(durationSeconds / 60);
      const initialSeconds = durationSeconds % 60;
      onTick(`${String(initialMinutes).padStart(2, '0')}:${String(initialSeconds).padStart(2, '0')}`, durationSeconds < 60);

      this.intervalId = setInterval(tick, 1000);
    },

    stop() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  };
});

describe('Timer Module', () => {
  
  describe('start()', () => {
    it('should format time correctly for onTick callback on initial call', () => {
      jest.useFakeTimers();
      const onTick = jest.fn();
      
      Timer.start(125, onTick, null);
      
      // Should be called immediately with 02:05
      expect(onTick).toHaveBeenCalledWith('02:05', false);
      
      jest.useRealTimers();
    });

    it('should call onTick with low time flag when less than 60 seconds', () => {
      jest.useFakeTimers();
      const onTick = jest.fn();
      
      Timer.start(45, onTick, null);
      
      expect(onTick).toHaveBeenCalledWith('00:45', true);
      
      jest.useRealTimers();
    });

    it('should stop previous timer when start is called again', () => {
      jest.useFakeTimers();
      const onTick1 = jest.fn();
      const onTick2 = jest.fn();
      
      Timer.start(100, onTick1, null);
      const firstIntervalId = Timer.intervalId;
      
      Timer.start(50, onTick2, null);
      const secondIntervalId = Timer.intervalId;
      
      expect(firstIntervalId).not.toBe(secondIntervalId);
      
      jest.useRealTimers();
    });

    it('should call onExpired when time runs out', () => {
      jest.useFakeTimers();
      const onTick = jest.fn();
      const onExpired = jest.fn();
      
      Timer.start(2, onTick, onExpired);
      
      // Fast-forward time by 3 seconds
      jest.advanceTimersByTime(3000);
      
      expect(onExpired).toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('should handle zero duration', () => {
      jest.useFakeTimers();
      const onTick = jest.fn();
      const onExpired = jest.fn();
      
      Timer.start(0, onTick, onExpired);
      
      // Time should show 00:00 and isLow should be true
      expect(onTick).toHaveBeenCalledWith('00:00', true);
      
      jest.useRealTimers();
    });
  });

  describe('stop()', () => {
    it('should clear the interval', () => {
      jest.useFakeTimers();
      const onTick = jest.fn();
      
      Timer.start(100, onTick, null);
      const intervalId = Timer.intervalId;
      
      Timer.stop();
      
      expect(Timer.intervalId).toBeNull();
      
      jest.useRealTimers();
    });

    it('should not throw error when called without active timer', () => {
      expect(() => Timer.stop()).not.toThrow();
    });
  });

  describe('Time formatting', () => {
    it('should format time with leading zeros', () => {
      jest.useFakeTimers();
      const onTick = jest.fn();
      
      Timer.start(65, onTick, null); // 1 minute 5 seconds
      
      expect(onTick).toHaveBeenCalledWith('01:05', false);
      
      jest.useRealTimers();
    });

    it('should format time for single digit minutes and seconds', () => {
      jest.useFakeTimers();
      const onTick = jest.fn();
      
      Timer.start(9, onTick, null); // 0 minutes 9 seconds
      
      expect(onTick).toHaveBeenCalledWith('00:09', true);
      
      jest.useRealTimers();
    });
  });
});
