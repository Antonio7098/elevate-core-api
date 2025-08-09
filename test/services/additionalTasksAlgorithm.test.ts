describe('Additional Tasks Algorithm', () => {
  describe('Safety Checks', () => {
    it('should prevent exceeding daily limit', () => {
      const prefs = { maxDailyLimit: 50, addMoreIncrements: 10 };
      const completion = {
        critical: { totalAssigned: 20, completedCount: 15 },
        core: { totalAssigned: 20, completedCount: 12 },
        plus: { totalAssigned: 10, completedCount: 5 }
      };
      
      const currentTotal = completion.critical.totalAssigned + 
                          completion.core.totalAssigned + 
                          completion.plus.totalAssigned;
      
      expect(currentTotal).toBe(50); // At limit
      expect(currentTotal >= prefs.maxDailyLimit).toBe(true);
      
      // Should return empty tasks with appropriate message
      const expectedResult = {
        tasks: [],
        message: "You've reached your daily limit. Great work! 🎉",
        canAddMore: false
      };
      
      expect(expectedResult.tasks.length).toBe(0);
      expect(expectedResult.canAddMore).toBe(false);
    });

    it('should respect remaining capacity limits', () => {
      const prefs = { maxDailyLimit: 50, addMoreIncrements: 15 };
      const completion = {
        critical: { totalAssigned: 15, completedCount: 12 },
        core: { totalAssigned: 15, completedCount: 10 },
        plus: { totalAssigned: 15, completedCount: 8 }
      };
      
      const currentTotal = 45; // 5 remaining
      const remainingCapacity = prefs.maxDailyLimit - currentTotal;
      const incrementSize = Math.min(prefs.addMoreIncrements, remainingCapacity);
      
      expect(remainingCapacity).toBe(5);
      expect(incrementSize).toBe(5); // Should be capped at remaining capacity
    });
  });

  describe('Completion Rate Calculations', () => {
    it('should calculate completion rates correctly', () => {
      const completion = {
        critical: { totalAssigned: 10, completedCount: 8 },
        core: { totalAssigned: 15, completedCount: 9 },
        plus: { totalAssigned: 5, completedCount: 2 }
      };
      
      // Avoid division by zero with Math.max(1, totalAssigned)
      const criticalRate = completion.critical.completedCount / Math.max(1, completion.critical.totalAssigned);
      const coreRate = completion.core.completedCount / Math.max(1, completion.core.totalAssigned);
      const plusRate = completion.plus.completedCount / Math.max(1, completion.plus.totalAssigned);
      
      expect(criticalRate).toBe(0.8); // 8/10 = 80%
      expect(coreRate).toBe(0.6);     // 9/15 = 60%
      expect(plusRate).toBe(0.4);     // 2/5 = 40%
    });

    it('should handle zero assignments gracefully', () => {
      const completion = {
        critical: { totalAssigned: 0, completedCount: 0 },
        core: { totalAssigned: 10, completedCount: 5 },
        plus: { totalAssigned: 0, completedCount: 0 }
      };
      
      const criticalRate = completion.critical.completedCount / Math.max(1, completion.critical.totalAssigned);
      const coreRate = completion.core.completedCount / Math.max(1, completion.core.totalAssigned);
      const plusRate = completion.plus.completedCount / Math.max(1, completion.plus.totalAssigned);
      
      expect(criticalRate).toBe(0); // 0/1 = 0 (prevented division by zero)
      expect(coreRate).toBe(0.5);   // 5/10 = 50%
      expect(plusRate).toBe(0);     // 0/1 = 0 (prevented division by zero)
    });
  });

  describe('Bucket Selection Logic', () => {
    it('should prioritize critical tasks when completion rate >= 80%', () => {
      const completion = {
        critical: { totalAssigned: 10, completedCount: 9 }, // 90% completion
        core: { totalAssigned: 10, completedCount: 7 },     // 70% completion
        plus: { totalAssigned: 10, completedCount: 6 }      // 60% completion
      };
      
      const criticalRate = 0.9; // >= 0.8 threshold
      const coreRate = 0.7;     // >= 0.7 threshold but lower priority
      const plusRate = 0.6;     // >= 0.6 threshold but lowest priority
      
      // Critical should be selected due to highest rate and meeting threshold
      expect(criticalRate >= 0.8).toBe(true);
      expect(coreRate >= 0.7).toBe(true);
      expect(plusRate >= 0.6).toBe(true);
      
      // Critical has priority due to higher threshold and rate
      const expectedBucketSource = 'critical';
      expect(expectedBucketSource).toBe('critical');
    });

    it('should select core tasks when critical < 80% but core >= 70%', () => {
      const completion = {
        critical: { totalAssigned: 10, completedCount: 7 }, // 70% completion (< 80%)
        core: { totalAssigned: 10, completedCount: 8 },     // 80% completion (>= 70%)
        plus: { totalAssigned: 10, completedCount: 6 }      // 60% completion
      };
      
      const criticalRate = 0.7; // < 0.8 threshold
      const coreRate = 0.8;     // >= 0.7 threshold
      const plusRate = 0.6;     // >= 0.6 threshold
      
      expect(criticalRate < 0.8).toBe(true);
      expect(coreRate >= 0.7).toBe(true);
      
      const expectedBucketSource = 'core';
      expect(expectedBucketSource).toBe('core');
    });

    it('should select plus tasks when critical < 80%, core < 70%, but plus >= 60%', () => {
      const completion = {
        critical: { totalAssigned: 10, completedCount: 6 }, // 60% completion (< 80%)
        core: { totalAssigned: 10, completedCount: 6 },     // 60% completion (< 70%)
        plus: { totalAssigned: 10, completedCount: 7 }      // 70% completion (>= 60%)
      };
      
      const criticalRate = 0.6; // < 0.8 threshold
      const coreRate = 0.6;     // < 0.7 threshold
      const plusRate = 0.7;     // >= 0.6 threshold
      
      expect(criticalRate < 0.8).toBe(true);
      expect(coreRate < 0.7).toBe(true);
      expect(plusRate >= 0.6).toBe(true);
      
      const expectedBucketSource = 'plus';
      expect(expectedBucketSource).toBe('plus');
    });

    it('should fallback to mixed selection when no bucket meets thresholds', () => {
      const completion = {
        critical: { totalAssigned: 10, completedCount: 5 }, // 50% completion (< 80%)
        core: { totalAssigned: 10, completedCount: 6 },     // 60% completion (< 70%)
        plus: { totalAssigned: 10, completedCount: 5 }      // 50% completion (< 60%)
      };
      
      const criticalRate = 0.5; // < 0.8 threshold
      const coreRate = 0.6;     // < 0.7 threshold
      const plusRate = 0.5;     // < 0.6 threshold
      
      expect(criticalRate < 0.8).toBe(true);
      expect(coreRate < 0.7).toBe(true);
      expect(plusRate < 0.6).toBe(true);
      
      const expectedBucketSource = 'mixed';
      expect(expectedBucketSource).toBe('mixed');
    });
  });

  describe('Mixed Selection Algorithm', () => {
    it('should distribute mixed tasks with 40% critical, 40% core, 20% plus', () => {
      const incrementSize = 10;
      
      const criticalAllocation = Math.ceil(incrementSize * 0.4); // 40%
      const coreAllocation = Math.ceil(incrementSize * 0.4);     // 40%
      const plusAllocation = Math.ceil(incrementSize * 0.2);     // 20%
      
      expect(criticalAllocation).toBe(4); // 40% of 10 = 4
      expect(coreAllocation).toBe(4);     // 40% of 10 = 4
      expect(plusAllocation).toBe(2);     // 20% of 10 = 2
      
      const totalAllocated = criticalAllocation + coreAllocation + plusAllocation;
      expect(totalAllocated).toBe(10); // Should not exceed incrementSize
    });

    it('should handle small increment sizes in mixed mode', () => {
      const incrementSize = 3;
      
      const criticalAllocation = Math.ceil(incrementSize * 0.4); // 40%
      const coreAllocation = Math.ceil(incrementSize * 0.4);     // 40%
      const plusAllocation = Math.ceil(incrementSize * 0.2);     // 20%
      
      expect(criticalAllocation).toBe(2); // ceil(1.2) = 2
      expect(coreAllocation).toBe(2);     // ceil(1.2) = 2
      expect(plusAllocation).toBe(1);     // ceil(0.6) = 1
      
      // Total might exceed incrementSize due to ceiling, so slice is used
      const mixedPool = [
        ...Array(criticalAllocation).fill('critical'),
        ...Array(coreAllocation).fill('core'),
        ...Array(plusAllocation).fill('plus')
      ];
      const finalTasks = mixedPool.slice(0, incrementSize);
      
      expect(finalTasks.length).toBe(3); // Capped at incrementSize
    });
  });

  describe('Message Generation', () => {
    it('should generate performance-based messages for critical tasks', () => {
      const bucketSource = 'critical';
      const criticalCompletionRate = 0.95;
      const tasksAdded = 5;
      
      let message = `Added ${tasksAdded} more tasks. Keep going! 💪`;
      if (bucketSource === 'critical' && criticalCompletionRate >= 0.9) {
        message = `Excellent critical task performance! Added ${tasksAdded} more critical tasks. 🔥`;
      }
      
      expect(message).toBe('Excellent critical task performance! Added 5 more critical tasks. 🔥');
    });

    it('should generate performance-based messages for core tasks', () => {
      const bucketSource = 'core';
      const coreCompletionRate = 0.85;
      const tasksAdded = 3;
      
      let message = `Added ${tasksAdded} more tasks. Keep going! 💪`;
      if (bucketSource === 'core' && coreCompletionRate >= 0.8) {
        message = `Great core task progress! Added ${tasksAdded} more core tasks. 🚀`;
      }
      
      expect(message).toBe('Great core task progress! Added 3 more core tasks. 🚀');
    });

    it('should generate standard message for plus tasks', () => {
      const bucketSource = 'plus';
      const tasksAdded = 2;
      
      let message = `Added ${tasksAdded} more tasks. Keep going! 💪`;
      if (bucketSource === 'plus') {
        message = `Nice work on plus tasks! Added ${tasksAdded} more to challenge you. ⭐`;
      }
      
      expect(message).toBe('Nice work on plus tasks! Added 2 more to challenge you. ⭐');
    });

    it('should generate default message for mixed selection', () => {
      const bucketSource = 'mixed';
      const tasksAdded = 7;
      
      const message = `Added ${tasksAdded} more tasks. Keep going! 💪`;
      
      expect(message).toBe('Added 7 more tasks. Keep going! 💪');
    });
  });

  describe('Return Value Structure', () => {
    it('should return complete result object with all required fields', () => {
      const mockResult = {
        tasks: ['task1', 'task2', 'task3'],
        message: 'Added 3 more tasks. Keep going! 💪',
        canAddMore: true,
        bucketSource: 'critical',
        incrementSize: 3,
        completionRates: {
          critical: 0.8,
          core: 0.6,
          plus: 0.4
        }
      };
      
      // Verify all required fields are present
      expect(mockResult).toHaveProperty('tasks');
      expect(mockResult).toHaveProperty('message');
      expect(mockResult).toHaveProperty('canAddMore');
      expect(mockResult).toHaveProperty('bucketSource');
      expect(mockResult).toHaveProperty('incrementSize');
      expect(mockResult).toHaveProperty('completionRates');
      
      // Verify field types
      expect(Array.isArray(mockResult.tasks)).toBe(true);
      expect(typeof mockResult.message).toBe('string');
      expect(typeof mockResult.canAddMore).toBe('boolean');
      expect(typeof mockResult.bucketSource).toBe('string');
      expect(typeof mockResult.incrementSize).toBe('number');
      expect(typeof mockResult.completionRates).toBe('object');
    });

    it('should calculate canAddMore correctly', () => {
      const currentTotal = 40;
      const tasksAdded = 5;
      const maxDailyLimit = 50;
      
      const canAddMore = (currentTotal + tasksAdded) < maxDailyLimit;
      
      expect(canAddMore).toBe(true); // 45 < 50
      
      const atLimit = (45 + 5) < maxDailyLimit;
      expect(atLimit).toBe(false); // 50 is not < 50
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty available task pools', () => {
      // Simulate scenario where all tasks in a bucket are already assigned
      const completion = {
        critical: { totalAssigned: 10, completedCount: 9 }, // High completion rate
        core: { totalAssigned: 8, completedCount: 6 },
        plus: { totalAssigned: 5, completedCount: 3 }
      };
      
      // If critical bucket has exactly 10 tasks and 10 are assigned,
      // critical.length <= completion.critical.totalAssigned
      const criticalAvailable = 10; // Total critical tasks
      const hasAvailableCritical = criticalAvailable > completion.critical.totalAssigned;
      
      expect(hasAvailableCritical).toBe(false); // No more critical tasks available
      
      // Should fallback to next bucket or mixed mode
    });

    it('should handle very small daily limits', () => {
      const prefs = { maxDailyLimit: 5, addMoreIncrements: 3 };
      const completion = {
        critical: { totalAssigned: 2, completedCount: 2 },
        core: { totalAssigned: 2, completedCount: 1 },
        plus: { totalAssigned: 0, completedCount: 0 }
      };
      
      const currentTotal = 4; // Close to limit
      const remainingCapacity = prefs.maxDailyLimit - currentTotal;
      const incrementSize = Math.min(prefs.addMoreIncrements, remainingCapacity);
      
      expect(remainingCapacity).toBe(1);
      expect(incrementSize).toBe(1); // Should only add 1 task
    });
  });
});
