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
Object.defineProperty(exports, "__esModule", { value: true });
exports.masteryCalculationService = exports.MasteryCalculationService = void 0;
var client_1 = require("@prisma/client");
var masteryCriterion_service_1 = require("./masteryCriterion.service");
var prisma = new client_1.PrismaClient();
var MasteryCalculationService = /** @class */ (function () {
    function MasteryCalculationService() {
        // Default mastery thresholds
        this.defaultThresholds = {
            SURVEY: 0.6, // 60% - Basic familiarity
            PROFICIENT: 0.8, // 80% - Solid understanding
            EXPERT: 0.95, // 95% - Deep mastery
        };
    }
    /**
     * Calculate mastery score for a specific criterion
     */
    MasteryCalculationService.prototype.calculateCriterionMasteryScore = function (criterionId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userMastery;
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
                    case 1:
                        userMastery = _a.sent();
                        if (!userMastery)
                            return [2 /*return*/, 0.0];
                        // Use the stored mastery score (calculated by MasteryCriterionService)
                        return [2 /*return*/, userMastery.masteryScore];
                }
            });
        });
    };
    /**
     * Calculate UUE stage mastery from weighted average of criterion mastery
     */
    MasteryCalculationService.prototype.calculateUueStageMastery = function (sectionId, uueStage, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var criteria, userMasteries, _a, weightedMastery, totalWeight, masteredCriteria, breakdown, userThreshold, thresholdValue, isMastered;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, masteryCriterion_service_1.masteryCriterionService.getCriteriaByUueStage(sectionId, uueStage)];
                    case 1:
                        criteria = _b.sent();
                        if (criteria.length === 0) {
                            return [2 /*return*/, {
                                    stage: uueStage,
                                    masteryScore: 0.0,
                                    isMastered: false,
                                    totalCriteria: 0,
                                    masteredCriteria: 0,
                                    totalWeight: 0,
                                    criteriaBreakdown: [],
                                }];
                        }
                        return [4 /*yield*/, this.getUserMasteriesForCriteria(criteria.map(function (c) { return c.id; }), userId)];
                    case 2:
                        userMasteries = _b.sent();
                        _a = this.calculateWeightedMastery(criteria, userMasteries), weightedMastery = _a.weightedMastery, totalWeight = _a.totalWeight, masteredCriteria = _a.masteredCriteria, breakdown = _a.breakdown;
                        return [4 /*yield*/, this.getUserMasteryThreshold(sectionId, userId)];
                    case 3:
                        userThreshold = _b.sent();
                        thresholdValue = this.defaultThresholds[userThreshold];
                        isMastered = weightedMastery >= thresholdValue;
                        return [2 /*return*/, {
                                stage: uueStage,
                                masteryScore: weightedMastery,
                                isMastered: isMastered,
                                totalCriteria: criteria.length,
                                masteredCriteria: masteredCriteria,
                                totalWeight: totalWeight,
                                criteriaBreakdown: breakdown,
                            }];
                }
            });
        });
    };
    /**
     * Calculate primitive mastery (all stages must be mastered)
     */
    MasteryCalculationService.prototype.calculatePrimitiveMastery = function (sectionId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var stages, stageResults, totalMasteryScore, masteredStages, _i, stages_1, stage, stageResult, overallMastery, isMastered, overallProgress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stages = ['UNDERSTAND', 'USE', 'EXPLORE'];
                        stageResults = [];
                        totalMasteryScore = 0;
                        masteredStages = 0;
                        _i = 0, stages_1 = stages;
                        _a.label = 1;
                    case 1:
                        if (!(_i < stages_1.length)) return [3 /*break*/, 4];
                        stage = stages_1[_i];
                        return [4 /*yield*/, this.calculateUueStageMastery(sectionId, stage, userId)];
                    case 2:
                        stageResult = _a.sent();
                        stageResults.push({
                            stage: stage,
                            masteryScore: stageResult.masteryScore,
                            isMastered: stageResult.isMastered,
                            criteriaCount: stageResult.totalCriteria,
                            masteredCriteria: stageResult.masteredCriteria,
                        });
                        totalMasteryScore += stageResult.masteryScore;
                        if (stageResult.isMastered) {
                            masteredStages++;
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        overallMastery = stages.length > 0 ? totalMasteryScore / stages.length : 0;
                        isMastered = masteredStages === stages.length;
                        overallProgress = (masteredStages / stages.length) * 100;
                        return [2 /*return*/, {
                                primitiveId: sectionId, // Using sectionId as primitiveId for now
                                sectionId: sectionId,
                                masteryScore: overallMastery,
                                isMastered: isMastered,
                                totalStages: stages.length,
                                masteredStages: masteredStages,
                                stageBreakdown: stageResults,
                                overallProgress: overallProgress,
                            }];
                }
            });
        });
    };
    /**
     * Calculate weighted mastery from criteria and user masteries
     */
    MasteryCalculationService.prototype.calculateWeightedMastery = function (criteria, userMasteries) {
        var _a, _b, _c;
        var totalWeightedScore = 0;
        var totalWeight = 0;
        var masteredCriteria = 0;
        var breakdown = [];
        var _loop_1 = function (criterion) {
            var userMastery = userMasteries.find(function (m) { return m.masteryCriterionId === criterion.id; });
            var masteryScore = (_a = userMastery === null || userMastery === void 0 ? void 0 : userMastery.masteryScore) !== null && _a !== void 0 ? _a : 0.0;
            var weight = criterion.weight;
            totalWeightedScore += masteryScore * weight;
            totalWeight += weight;
            if (userMastery === null || userMastery === void 0 ? void 0 : userMastery.isMastered) {
                masteredCriteria++;
            }
            breakdown.push({
                criterionId: criterion.id,
                description: criterion.description,
                weight: weight,
                masteryScore: masteryScore,
                isMastered: (_b = userMastery === null || userMastery === void 0 ? void 0 : userMastery.isMastered) !== null && _b !== void 0 ? _b : false,
                consecutiveIntervals: (_c = userMastery === null || userMastery === void 0 ? void 0 : userMastery.consecutiveIntervals) !== null && _c !== void 0 ? _c : 0,
            });
        };
        for (var _i = 0, criteria_1 = criteria; _i < criteria_1.length; _i++) {
            var criterion = criteria_1[_i];
            _loop_1(criterion);
        }
        var weightedMastery = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
        return {
            weightedMastery: weightedMastery,
            totalWeight: totalWeight,
            masteredCriteria: masteredCriteria,
            breakdown: breakdown,
        };
    };
    /**
     * Get mastery summary for a user across all sections
     */
    MasteryCalculationService.prototype.getUserMasterySummary = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userMasteries, sectionGroups, _i, userMasteries_1, mastery, sectionId, totalSections, masteredSections, totalCriteria, masteredCriteria, totalMasteryScore, stageBreakdown, _a, sectionGroups_1, _b, sectionId, masteries, sectionMastery, _c, _d, stageResult, averageMasteryScore;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, prisma.userCriterionMastery.findMany({
                            where: { userId: userId },
                            include: {
                                masteryCriterion: true,
                                blueprintSection: true,
                            },
                        })];
                    case 1:
                        userMasteries = _e.sent();
                        sectionGroups = new Map();
                        for (_i = 0, userMasteries_1 = userMasteries; _i < userMasteries_1.length; _i++) {
                            mastery = userMasteries_1[_i];
                            sectionId = mastery.blueprintSectionId;
                            if (!sectionGroups.has(sectionId)) {
                                sectionGroups.set(sectionId, []);
                            }
                            sectionGroups.get(sectionId).push(mastery);
                        }
                        totalSections = sectionGroups.size;
                        masteredSections = 0;
                        totalCriteria = userMasteries.length;
                        masteredCriteria = userMasteries.filter(function (m) { return m.isMastered; }).length;
                        totalMasteryScore = 0;
                        stageBreakdown = {
                            UNDERSTAND: { count: 0, mastered: 0 },
                            USE: { count: 0, mastered: 0 },
                            EXPLORE: { count: 0, mastered: 0 },
                        };
                        _a = 0, sectionGroups_1 = sectionGroups;
                        _e.label = 2;
                    case 2:
                        if (!(_a < sectionGroups_1.length)) return [3 /*break*/, 5];
                        _b = sectionGroups_1[_a], sectionId = _b[0], masteries = _b[1];
                        return [4 /*yield*/, this.calculatePrimitiveMastery(sectionId, userId)];
                    case 3:
                        sectionMastery = _e.sent();
                        if (sectionMastery.isMastered) {
                            masteredSections++;
                        }
                        totalMasteryScore += sectionMastery.masteryScore;
                        // Update stage breakdown
                        for (_c = 0, _d = sectionMastery.stageBreakdown; _c < _d.length; _c++) {
                            stageResult = _d[_c];
                            stageBreakdown[stageResult.stage].count += stageResult.criteriaCount;
                            stageBreakdown[stageResult.stage].mastered += stageResult.masteredCriteria;
                        }
                        _e.label = 4;
                    case 4:
                        _a++;
                        return [3 /*break*/, 2];
                    case 5:
                        averageMasteryScore = totalSections > 0 ? totalMasteryScore / totalSections : 0;
                        return [2 /*return*/, {
                                totalSections: totalSections,
                                masteredSections: masteredSections,
                                totalCriteria: totalCriteria,
                                masteredCriteria: masteredCriteria,
                                averageMasteryScore: averageMasteryScore,
                                stageBreakdown: stageBreakdown,
                            }];
                }
            });
        });
    };
    /**
     * Get learning progress over time
     */
    MasteryCalculationService.prototype.getLearningProgress = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, days) {
            var startDate, masteries, dailyProgress, _i, masteries_1, mastery, dateKey, dayData, progress;
            if (days === void 0) { days = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startDate = new Date();
                        startDate.setDate(startDate.getDate() - days);
                        return [4 /*yield*/, prisma.userCriterionMastery.findMany({
                                where: {
                                    userId: userId,
                                    lastAttemptDate: {
                                        gte: startDate,
                                    },
                                },
                                orderBy: { lastAttemptDate: 'asc' },
                            })];
                    case 1:
                        masteries = _a.sent();
                        dailyProgress = new Map();
                        for (_i = 0, masteries_1 = masteries; _i < masteries_1.length; _i++) {
                            mastery = masteries_1[_i];
                            dateKey = mastery.lastAttemptDate.toISOString().split('T')[0];
                            if (!dailyProgress.has(dateKey)) {
                                dailyProgress.set(dateKey, {
                                    criteriaAttempted: 0,
                                    criteriaMastered: 0,
                                    totalScore: 0,
                                    count: 0,
                                });
                            }
                            dayData = dailyProgress.get(dateKey);
                            dayData.criteriaAttempted++;
                            dayData.totalScore += mastery.masteryScore;
                            dayData.count++;
                            if (mastery.isMastered) {
                                dayData.criteriaMastered++;
                            }
                        }
                        progress = Array.from(dailyProgress.entries()).map(function (_a) {
                            var date = _a[0], data = _a[1];
                            return ({
                                date: date,
                                criteriaAttempted: data.criteriaAttempted,
                                criteriaMastered: data.criteriaMastered,
                                averageScore: data.count > 0 ? data.totalScore / data.count : 0,
                            });
                        });
                        return [2 /*return*/, progress.sort(function (a, b) { return a.date.localeCompare(b.date); })];
                }
            });
        });
    };
    /**
     * Get user's mastery threshold for a section
     */
    MasteryCalculationService.prototype.getUserMasteryThreshold = function (sectionId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userThreshold;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.sectionMasteryThreshold.findUnique({
                            where: {
                                userId_sectionId: {
                                    userId: userId,
                                    sectionId: sectionId,
                                },
                            },
                        })];
                    case 1:
                        userThreshold = _a.sent();
                        if (userThreshold) {
                            return [2 /*return*/, userThreshold.threshold];
                        }
                        // Default to PROFICIENT if no user preference
                        return [2 /*return*/, 'PROFICIENT'];
                }
            });
        });
    };
    /**
     * Set user's mastery threshold for a section
     */
    MasteryCalculationService.prototype.setUserMasteryThreshold = function (userId, sectionId, threshold) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.sectionMasteryThreshold.upsert({
                            where: {
                                userId_sectionId: {
                                    userId: userId,
                                    sectionId: sectionId,
                                },
                            },
                            update: {
                                threshold: threshold,
                                thresholdValue: this.defaultThresholds[threshold],
                                description: "User prefers ".concat(threshold.toLowerCase(), " level mastery"),
                            },
                            create: {
                                userId: userId,
                                sectionId: sectionId,
                                threshold: threshold,
                                thresholdValue: this.defaultThresholds[threshold],
                                description: "User prefers ".concat(threshold.toLowerCase(), " level mastery"),
                            },
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get criteria that need attention (low mastery scores)
     */
    MasteryCalculationService.prototype.getCriteriaNeedingAttention = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, threshold) {
            var lowMasteryCriteria;
            var _this = this;
            if (threshold === void 0) { threshold = 0.5; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.userCriterionMastery.findMany({
                            where: {
                                userId: userId,
                                masteryScore: {
                                    lt: threshold,
                                },
                                isMastered: false,
                            },
                            include: {
                                masteryCriterion: true,
                            },
                            orderBy: { masteryScore: 'asc' },
                        })];
                    case 1:
                        lowMasteryCriteria = _a.sent();
                        return [2 /*return*/, lowMasteryCriteria.map(function (mastery) {
                                var daysSinceLastAttempt = mastery.lastAttemptDate
                                    ? _this.getDaysDifference(mastery.lastAttemptDate, new Date())
                                    : 999;
                                var recommendedAction = 'Review soon';
                                if (daysSinceLastAttempt > 7) {
                                    recommendedAction = 'Urgent review needed';
                                }
                                else if (daysSinceLastAttempt > 3) {
                                    recommendedAction = 'Review this week';
                                }
                                return {
                                    criterionId: mastery.masteryCriterionId,
                                    description: mastery.masteryCriterion.description,
                                    currentScore: mastery.masteryScore,
                                    daysSinceLastAttempt: daysSinceLastAttempt,
                                    recommendedAction: recommendedAction,
                                };
                            })];
                }
            });
        });
    };
    // Private helper methods
    MasteryCalculationService.prototype.getUserMasteriesForCriteria = function (criterionIds, userId) {
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
    MasteryCalculationService.prototype.getDaysDifference = function (date1, date2) {
        var timeDiff = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    };
    return MasteryCalculationService;
}());
exports.MasteryCalculationService = MasteryCalculationService;
exports.masteryCalculationService = new MasteryCalculationService();
