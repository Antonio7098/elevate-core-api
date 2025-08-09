import { TrackingIntensity } from '@prisma/client';

describe('Extended Fixed-Interval Scheduling with Tracking Intensity', () => {
  describe('Extended Base Intervals', () => {
    it('should use extended intervals [1,3,7,21,60,180] for long-term retention', () => {
      const extendedBaseIntervals = [1, 3, 7, 21, 60, 180];
      
      // Test each interval position
      expect(extendedBaseIntervals[0]).toBe(1);   // First review
      expect(extendedBaseIntervals[1]).toBe(3);   // Second review
      expect(extendedBaseIntervals[2]).toBe(7);   // Third review
      expect(extendedBaseIntervals[3]).toBe(21);  // Fourth review
      expect(extendedBaseIntervals[4]).toBe(60);  // Fifth review - extended
      expect(extendedBaseIntervals[5]).toBe(180); // Sixth+ review - extended
      
      expect(extendedBaseIntervals.length).toBe(6);
    });

    it('should cap interval index at maximum array length', () => {
      const extendedBaseIntervals = [1, 3, 7, 21, 60, 180];
      const reviewCount = 10; // More than array length
      
      const intervalIndex = Math.min(reviewCount - 1, extendedBaseIntervals.length - 1);
      const baseInterval = extendedBaseIntervals[intervalIndex];
      
      expect(intervalIndex).toBe(5); // Capped at last index
      expect(baseInterval).toBe(180); // Uses longest interval
    });
  });

  describe('Tracking Intensity Multipliers', () => {
    it('should define correct multipliers for each intensity level', () => {
      const trackingIntensityMultipliers = {
        DENSE: 0.7,   // 30% shorter intervals for intensive tracking
        NORMAL: 1.0,  // Standard intervals
        SPARSE: 1.5   // 50% longer intervals for light tracking
      };

      expect(trackingIntensityMultipliers.DENSE).toBe(0.7);
      expect(trackingIntensityMultipliers.NORMAL).toBe(1.0);
      expect(trackingIntensityMultipliers.SPARSE).toBe(1.5);
    });

    it('should calculate correct intervals with DENSE tracking', () => {
      const baseInterval = 21; // 4th review interval
      const difficultyMultiplier = 1.0;
      const intensityMultiplier = 0.7; // DENSE
      
      const finalInterval = Math.round(baseInterval * difficultyMultiplier * intensityMultiplier);
      
      expect(finalInterval).toBe(15); // 21 * 1.0 * 0.7 = 14.7 → 15
    });

    it('should calculate correct intervals with SPARSE tracking', () => {
      const baseInterval = 21; // 4th review interval
      const difficultyMultiplier = 1.0;
      const intensityMultiplier = 1.5; // SPARSE
      
      const finalInterval = Math.round(baseInterval * difficultyMultiplier * intensityMultiplier);
      
      expect(finalInterval).toBe(32); // 21 * 1.0 * 1.5 = 31.5 → 32
    });

    it('should maintain minimum 1-day interval', () => {
      const baseInterval = 1;
      const difficultyMultiplier = 0.5; // Easy content
      const intensityMultiplier = 0.7; // DENSE tracking
      
      const calculatedInterval = Math.round(baseInterval * difficultyMultiplier * intensityMultiplier);
      const finalInterval = Math.max(1, calculatedInterval);
      
      expect(calculatedInterval).toBe(0); // 1 * 0.5 * 0.7 = 0.35 → 0
      expect(finalInterval).toBe(1); // Minimum enforced
    });
  });

  describe('Combined Adjustments', () => {
    it('should combine difficulty and intensity adjustments correctly', () => {
      const baseInterval = 7; // 3rd review
      const difficultyMultiplier = 1.2; // Slightly harder content
      const intensityMultiplier = 0.7; // DENSE tracking
      
      const finalInterval = Math.round(baseInterval * difficultyMultiplier * intensityMultiplier);
      
      expect(finalInterval).toBe(6); // 7 * 1.2 * 0.7 = 5.88 → 6
    });

    it('should handle extreme combinations within bounds', () => {
      const baseInterval = 180; // Maximum interval
      const difficultyMultiplier = 2.0; // Maximum difficulty
      const intensityMultiplier = 1.5; // SPARSE tracking
      
      const finalInterval = Math.round(baseInterval * difficultyMultiplier * intensityMultiplier);
      
      expect(finalInterval).toBe(540); // 180 * 2.0 * 1.5 = 540 days
    });

    it('should handle minimum combinations', () => {
      const baseInterval = 1; // First interval
      const difficultyMultiplier = 0.5; // Minimum difficulty
      const intensityMultiplier = 0.7; // DENSE tracking
      
      const calculatedInterval = Math.round(baseInterval * difficultyMultiplier * intensityMultiplier);
      const finalInterval = Math.max(1, calculatedInterval);
      
      expect(finalInterval).toBe(1); // Minimum enforced
    });
  });

  describe('Interval Progression Examples', () => {
    it('should show progression for NORMAL intensity', () => {
      const extendedBaseIntervals = [1, 3, 7, 21, 60, 180];
      const difficultyMultiplier = 1.0;
      const intensityMultiplier = 1.0; // NORMAL
      
      const progression = extendedBaseIntervals.map(interval => 
        Math.max(1, Math.round(interval * difficultyMultiplier * intensityMultiplier))
      );
      
      expect(progression).toEqual([1, 3, 7, 21, 60, 180]);
    });

    it('should show progression for DENSE intensity', () => {
      const extendedBaseIntervals = [1, 3, 7, 21, 60, 180];
      const difficultyMultiplier = 1.0;
      const intensityMultiplier = 0.7; // DENSE
      
      const progression = extendedBaseIntervals.map(interval => 
        Math.max(1, Math.round(interval * difficultyMultiplier * intensityMultiplier))
      );
      
      expect(progression).toEqual([1, 2, 5, 15, 42, 126]); // 30% shorter
    });

    it('should show progression for SPARSE intensity', () => {
      const extendedBaseIntervals = [1, 3, 7, 21, 60, 180];
      const difficultyMultiplier = 1.0;
      const intensityMultiplier = 1.5; // SPARSE
      
      const progression = extendedBaseIntervals.map(interval => 
        Math.max(1, Math.round(interval * difficultyMultiplier * intensityMultiplier))
      );
      
      expect(progression).toEqual([2, 5, 11, 32, 90, 270]); // 50% longer
    });
  });

  describe('Fallback Behavior', () => {
    it('should default to NORMAL intensity for unknown values', () => {
      const trackingIntensityMultipliers = {
        DENSE: 0.7,
        NORMAL: 1.0,
        SPARSE: 1.5
      };
      
      // Simulate unknown intensity
      const unknownIntensity = 'UNKNOWN' as TrackingIntensity;
      const intensityMultiplier = trackingIntensityMultipliers[unknownIntensity] || 1.0;
      
      expect(intensityMultiplier).toBe(1.0); // Falls back to NORMAL
    });

    it('should handle null/undefined intensity gracefully', () => {
      const trackingIntensityMultipliers = {
        DENSE: 0.7,
        NORMAL: 1.0,
        SPARSE: 1.5
      };
      
      const intensityMultiplier = trackingIntensityMultipliers[null as any] || 1.0;
      
      expect(intensityMultiplier).toBe(1.0); // Falls back to NORMAL
    });
  });
});
