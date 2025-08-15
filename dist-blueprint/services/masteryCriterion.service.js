"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.masteryCriterionService = exports.MasteryCriterionService = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var MasteryCriterionService = /** @class */ (function () {
    function MasteryCriterionService() {
    }
    /**
     * Create a new mastery criterion
     */
    MasteryCriterionService.prototype.createCriterion = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.masteryCriterion.create({
                            data: {
                                id: data.id,
                                blueprintSectionId: data.blueprintSectionId,
                                uueStage: data.uueStage,
                                weight: data.weight,
                                masteryThreshold: data.masteryThreshold,
                                description: data.description,
                                questionTypes: data.questionTypes,
                            },
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Get a criterion by ID
     */
    MasteryCriterionService.prototype.getCriterion = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.masteryCriterion.findUnique({
                            where: { id: id },
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Update a criterion
     */
    MasteryCriterionService.prototype.updateCriterion = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.masteryCriterion.update({
                            where: { id: id },
                            data: data,
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Delete a criterion
     */
    MasteryCriterionService.prototype.deleteCriterion = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.masteryCriterion.delete({
                            where: { id: id },
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process a criterion review and update mastery tracking
     */
    MasteryCriterionService.prototype.processCriterionReview = function (userId_1, criterionId_1, isCorrect_1, performance_1) {
        return __awaiter(this, arguments, void 0, function (userId, criterionId, isCorrect, performance, // 0.0 - 1.0 score
        options) {
            var criterion, userMastery, threshold, minGapDays, daysSinceLastAttempt, newAttemptHistory, newMasteryScore, newConsecutiveIntervals, isMastered, lastMasteredDate, updatedMastery, nextReviewAt;
            var _a, _b;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getCriterion(criterionId)];
                    case 1:
                        criterion = _c.sent();
                        if (!criterion) {
                            throw new Error("Criterion ".concat(criterionId, " not found"));
                        }
                        return [4 /*yield*/, this.getOrCreateUserCriterionMastery(userId, criterionId)];
                    case 2:
                        userMastery = _c.sent();
                        threshold = (_a = options.customThreshold) !== null && _a !== void 0 ? _a : criterion.masteryThreshold;
                        minGapDays = (_b = options.minGapDays) !== null && _b !== void 0 ? _b : 1;
                        // Check if enough time has passed since last attempt
                        if (!options.allowRetrySameDay && userMastery.lastAttemptDate) {
                            daysSinceLastAttempt = this.getDaysDifference(userMastery.lastAttemptDate, new Date());
                            if (daysSinceLastAttempt < minGapDays) {
                                return [2 /*return*/, {
                                        success: false,
                                        newMasteryScore: userMastery.masteryScore,
                                        isMastered: userMastery.isMastered,
                                        consecutiveIntervals: userMastery.consecutiveIntervals,
                                        nextReviewAt: userMastery.nextReviewAt,
                                        message: "Minimum gap of ".concat(minGapDays, " days required between attempts"),
                                    }];
                            }
                        }
                        newAttemptHistory = this.updateAttemptHistory(userMastery.attemptHistory, performance);
                        newMasteryScore = this.calculateMasteryScore(newAttemptHistory);
                        newConsecutiveIntervals = this.updateConsecutiveIntervals(userMastery.consecutiveIntervals, performance, threshold, userMastery.lastAttemptDate);
                        isMastered = newConsecutiveIntervals >= 2;
                        lastMasteredDate = isMastered && !userMastery.isMastered ? new Date() : userMastery.lastMasteredDate;
                        return [4 /*yield*/, prisma.userCriterionMastery.update({
                                where: { id: userMastery.id },
                                data: {
                                    masteryScore: newMasteryScore,
                                    isMastered: isMastered,
                                    consecutiveIntervals: newConsecutiveIntervals,
                                    lastMasteredDate: lastMasteredDate,
                                    lastAttemptDate: new Date(),
                                    attemptHistory: newAttemptHistory,
                                },
                            })];
                    case 3:
                        updatedMastery = _c.sent();
                        nextReviewAt = this.calculateNextReviewInterval(userMastery.currentIntervalStep, isCorrect, userMastery.trackingIntensity);
                        return [2 /*return*/, {
                                success: true,
                                newMasteryScore: newMasteryScore,
                                isMastered: isMastered,
                                consecutiveIntervals: newConsecutiveIntervals,
                                nextReviewAt: nextReviewAt,
                                message: isMastered ? 'Criterion mastered!' : 'Progress recorded',
                            }];
                }
            });
        });
    };
    /**
     * Calculate criterion mastery score from attempt history
     */
    MasteryCriterionService.prototype.calculateCriterionMastery = function (criterionId_1, userId_1) {
        return __awaiter(this, arguments, void 0, function (criterionId, userId, options) {
            var userMastery;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserCriterionMastery(userId, criterionId)];
                    case 1:
                        userMastery = _a.sent();
                        if (!userMastery) {
                            throw new Error("User mastery not found for criterion ".concat(criterionId));
                        }
                        return [2 /*return*/, {
                                criterionId: criterionId,
                                masteryScore: userMastery.masteryScore,
                                isMastered: userMastery.isMastered,
                                consecutiveIntervals: userMastery.consecutiveIntervals,
                                lastMasteredDate: userMastery.lastMasteredDate,
                                lastAttemptDate: userMastery.lastAttemptDate,
                                attemptHistory: userMastery.attemptHistory,
                            }];
                }
            });
        });
    };
    /**
     * Check if criterion meets consecutive interval mastery requirements
     */
    MasteryCriterionService.prototype.checkConsecutiveIntervalMastery = function (criterionId_1, userId_1) {
        return __awaiter(this, arguments, void 0, function (criterionId, userId, options) {
            var userMastery, criterion, lastTwoDates, daysDiff, _a, attempt1, attempt2, threshold;
            var _b, _c;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.getUserCriterionMastery(userId, criterionId)];
                    case 1:
                        userMastery = _d.sent();
                        if (!userMastery)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, this.getCriterion(criterionId)];
                    case 2:
                        criterion = _d.sent();
                        if (!criterion)
                            return [2 /*return*/, false];
                        // Must have at least 2 attempts
                        if (userMastery.attemptHistory.length < 2)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, this.getLastTwoAttemptDates(userId, criterionId)];
                    case 3:
                        lastTwoDates = _d.sent();
                        if (lastTwoDates.length < 2)
                            return [2 /*return*/, false];
                        daysDiff = this.getDaysDifference(lastTwoDates[0], lastTwoDates[1]);
                        if (daysDiff < ((_b = options.minGapDays) !== null && _b !== void 0 ? _b : 1))
                            return [2 /*return*/, false];
                        _a = userMastery.attemptHistory.slice(-2), attempt1 = _a[0], attempt2 = _a[1];
                        threshold = (_c = options.customThreshold) !== null && _c !== void 0 ? _c : criterion.masteryThreshold;
                        return [2 /*return*/, attempt1 >= threshold && attempt2 >= threshold];
                }
            });
        });
    };
    /**
     * Get criteria by UUE stage for a section
     */
    MasteryCriterionService.prototype.getCriteriaByUueStage = function (sectionId, uueStage) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.masteryCriterion.findMany({
                            where: {
                                blueprintSectionId: sectionId,
                                uueStage: uueStage,
                            },
                            orderBy: { weight: 'desc' },
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Check if user can progress to next UUE stage
     */
    MasteryCriterionService.prototype.canProgressToNextUueStage = function (userId, sectionId, currentStage) {
        return __awaiter(this, void 0, void 0, function () {
            var currentStageCriteria, userMasteries, _loop_1, _i, currentStageCriteria_1, criterion, state_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCriteriaByUueStage(sectionId, currentStage)];
                    case 1:
                        currentStageCriteria = _a.sent();
                        return [4 /*yield*/, this.getUserMasteriesForCriteria(currentStageCriteria.map(function (c) { return c.id; }), userId)];
                    case 2:
                        userMasteries = _a.sent();
                        _loop_1 = function (criterion) {
                            var userMastery = userMasteries.find(function (m) { return m.masteryCriterionId === criterion.id; });
                            if (!userMastery || !userMastery.isMastered) {
                                return { value: false };
                            }
                        };
                        // All criteria in current stage must be mastered
                        for (_i = 0, currentStageCriteria_1 = currentStageCriteria; _i < currentStageCriteria_1.length; _i++) {
                            criterion = currentStageCriteria_1[_i];
                            state_1 = _loop_1(criterion);
                            if (typeof state_1 === "object")
                                return [2 /*return*/, state_1.value];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    // Private helper methods
    MasteryCriterionService.prototype.getOrCreateUserCriterionMastery = function (userId, criterionId) {
        return __awaiter(this, void 0, void 0, function () {
            var userMastery, criterion;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserCriterionMastery(userId, criterionId)];
                    case 1:
                        userMastery = _a.sent();
                        if (!!userMastery) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getCriterion(criterionId)];
                    case 2:
                        criterion = _a.sent();
                        if (!criterion) {
                            throw new Error("Criterion ".concat(criterionId, " not found"));
                        }
                        return [4 /*yield*/, prisma.userCriterionMastery.create({
                                data: {
                                    userId: userId,
                                    masteryCriterionId: criterionId,
                                    blueprintSectionId: criterion.blueprintSectionId,
                                    masteryScore: 0.0,
                                    consecutiveIntervals: 0,
                                    attemptHistory: [],
                                    currentIntervalStep: 0,
                                    trackingIntensity: 'NORMAL',
                                },
                            })];
                    case 3:
                        userMastery = _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, userMastery];
                }
            });
        });
    };
    MasteryCriterionService.prototype.getUserCriterionMastery = function (userId, criterionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.userCriterionMastery.findUnique({
                            where: {
                                userId_masteryCriterionId: {
                                    userId: userId,
                                    masteryCriterionId: criterionId,
                                },
                            },
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    MasteryCriterionService.prototype.getUserMasteriesForCriteria = function (criterionIds, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.userCriterionMastery.findMany({
                            where: {
                                userId: userId,
                                masteryCriterionId: { in: criterionIds },
                            },
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    MasteryCriterionService.prototype.getLastTwoAttemptDates = function (userId, criterionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would need to be implemented based on your actual data structure
                // For now, returning empty array as placeholder
                return [2 /*return*/, []];
            });
        });
    };
    MasteryCriterionService.prototype.getDaysDifference = function (date1, date2) {
        var timeDiff = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    };
    MasteryCriterionService.prototype.updateAttemptHistory = function (currentHistory, newPerformance) {
        var maxHistoryLength = 10; // Keep last 10 attempts
        var newHistory = __spreadArray(__spreadArray([], currentHistory, true), [newPerformance], false);
        return newHistory.slice(-maxHistoryLength);
    };
    MasteryCriterionService.prototype.calculateMasteryScore = function (attemptHistory) {
        if (attemptHistory.length === 0)
            return 0.0;
        // Use weighted average with recent attempts having more weight
        var totalWeightedScore = 0;
        var totalWeight = 0;
        for (var i = 0; i < attemptHistory.length; i++) {
            var weight = Math.pow(0.8, attemptHistory.length - 1 - i); // Decay factor
            totalWeightedScore += attemptHistory[i] * weight;
            totalWeight += weight;
        }
        return totalWeight > 0 ? totalWeightedScore / totalWeight : 0.0;
    };
    MasteryCriterionService.prototype.updateConsecutiveIntervals = function (currentConsecutive, performance, threshold, lastAttemptDate) {
        if (performance >= threshold) {
            // Check if this is a different day from last attempt
            if (!lastAttemptDate || this.getDaysDifference(lastAttemptDate, new Date()) >= 1) {
                return currentConsecutive + 1;
            }
        }
        else {
            // Reset consecutive count on failure
            return 0;
        }
        return currentConsecutive;
    };
    MasteryCriterionService.prototype.calculateNextReviewInterval = function (currentStep, isCorrect, trackingIntensity) {
        var baseIntervals = [1, 3, 7, 21, 60, 180]; // Days
        var intensityMultipliers = {
            DENSE: 0.7,
            NORMAL: 1.0,
            SPARSE: 1.5,
        };
        var nextStep = currentStep;
        if (isCorrect) {
            nextStep = Math.min(currentStep + 1, baseIntervals.length - 1);
        }
        else {
            nextStep = Math.max(currentStep - 1, 0);
        }
        var baseInterval = baseIntervals[nextStep];
        var multiplier = intensityMultipliers[trackingIntensity];
        var adjustedInterval = Math.round(baseInterval * multiplier);
        var nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + adjustedInterval);
        return nextReviewDate;
    };
    return MasteryCriterionService;
}());
exports.MasteryCriterionService = MasteryCriterionService;
exports.masteryCriterionService = new MasteryCriterionService();
