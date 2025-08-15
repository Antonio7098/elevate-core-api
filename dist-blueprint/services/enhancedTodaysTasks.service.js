"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.enhancedTodaysTasksService = exports.EnhancedTodaysTasksService = void 0;
var client_1 = require("@prisma/client");
var client_2 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var EnhancedTodaysTasksService = /** @class */ (function () {
    function EnhancedTodaysTasksService() {
        // Default capacity estimates (in minutes)
        this.defaultTaskTimes = {
            CRITICAL: 8, // Overdue tasks take longer
            CORE: 5, // Standard task time
            PLUS: 3, // Preview tasks are shorter
        };
    }
    /**
     * Generate today's tasks for a user using section-based organization
     */
    EnhancedTodaysTasksService.prototype.generateTodaysTasksForUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userPrefs, userCapacity, dueSections, dueCriteria, taskBuckets, balancedTasks, capacityAnalysis, recommendations, totalTasks, estimatedTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserPreferences(userId)];
                    case 1:
                        userPrefs = _a.sent();
                        userCapacity = userPrefs.dailyStudyTime;
                        return [4 /*yield*/, this.getDueSectionsForUser(userId)];
                    case 2:
                        dueSections = _a.sent();
                        return [4 /*yield*/, this.getDueCriteriaForUser(userId)];
                    case 3:
                        dueCriteria = _a.sent();
                        taskBuckets = this.categorizeTasksByPriority(dueCriteria, dueSections);
                        return [4 /*yield*/, this.balanceUueStages(taskBuckets, userPrefs, userCapacity)];
                    case 4:
                        balancedTasks = _a.sent();
                        capacityAnalysis = this.analyzeCapacity(balancedTasks, userCapacity);
                        recommendations = this.generateRecommendations(capacityAnalysis, balancedTasks);
                        totalTasks = balancedTasks.critical.length + balancedTasks.core.length + balancedTasks.plus.length;
                        estimatedTime = this.calculateEstimatedTime(balancedTasks);
                        return [2 /*return*/, {
                                critical: {
                                    tasks: balancedTasks.critical,
                                    count: balancedTasks.critical.length,
                                    priority: 'CRITICAL',
                                    description: 'Urgent items - overdue by 3+ days or failed multiple times',
                                },
                                core: {
                                    tasks: balancedTasks.core,
                                    count: balancedTasks.core.length,
                                    priority: 'CORE',
                                    description: 'Important items - due today/tomorrow or new content',
                                },
                                plus: {
                                    tasks: balancedTasks.plus,
                                    count: balancedTasks.plus.length,
                                    priority: 'PLUS',
                                    description: 'Nice to have - next stage previews, long-term reinforcement',
                                },
                                capacityAnalysis: capacityAnalysis,
                                recommendations: recommendations,
                                totalTasks: totalTasks,
                                estimatedTime: estimatedTime,
                            }];
                }
            });
        });
    };
    /**
     * Get due sections for a user
     */
    EnhancedTodaysTasksService.prototype.getDueSectionsForUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    // Mock implementation - in real system this would query the database
                    return [2 /*return*/, [
                            {
                                id: 1,
                                title: 'Mock Section 1',
                                description: 'Mock section for testing',
                                blueprintId: 1,
                                parentSectionId: 0,
                                depth: 0,
                                orderIndex: 1,
                                difficulty: 'BEGINNER',
                                estimatedTimeMinutes: 30,
                                userId: userId,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            }
                        ]];
                }
                catch (error) {
                    console.error("Error getting due sections for user ".concat(userId, ":"), error);
                    return [2 /*return*/, []];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get due criteria for a user
     */
    EnhancedTodaysTasksService.prototype.getDueCriteriaForUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    // Mock implementation - in real system this would query the database
                    return [2 /*return*/, [
                            {
                                id: 1,
                                userId: userId,
                                criterionId: 1,
                                masteryScore: 0.5,
                                isMastered: false,
                                lastAttempt: new Date(),
                                attempts: 3,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            }
                        ]];
                }
                catch (error) {
                    console.error("Error getting due criteria for user ".concat(userId, ":"), error);
                    return [2 /*return*/, []];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Categorize tasks by priority
     */
    EnhancedTodaysTasksService.prototype.categorizeTasksByPriority = function (dueCriteria, dueSections) {
        var critical = [
            {
                id: 'task_1',
                criterionId: 'criterion_1',
                sectionId: 'section_1',
                sectionName: 'Mock Section 1',
                uueStage: 'UNDERSTAND',
                description: 'Critical task 1',
                priority: 'CRITICAL',
                estimatedTime: 8,
                masteryScore: 0.3,
                daysOverdue: 5,
                questionTypes: ['MULTIPLE_CHOICE']
            }
        ];
        var core = [
            {
                id: 'task_2',
                criterionId: 'criterion_2',
                sectionId: 'section_1',
                sectionName: 'Mock Section 1',
                uueStage: 'USE',
                description: 'Core task 1',
                priority: 'CORE',
                estimatedTime: 5,
                masteryScore: 0.6,
                daysOverdue: 0,
                questionTypes: ['MULTIPLE_CHOICE']
            }
        ];
        var plus = [
            {
                id: 'task_3',
                criterionId: 'criterion_3',
                sectionId: 'section_1',
                sectionName: 'Mock Section 1',
                uueStage: 'EXPLORE',
                description: 'Plus task 1',
                priority: 'PLUS',
                estimatedTime: 3,
                masteryScore: 0.8,
                daysOverdue: 0,
                questionTypes: ['MULTIPLE_CHOICE']
            }
        ];
        return { critical: critical, core: core, plus: plus };
    };
    /**
     * Balance UUE stages within user capacity
     */
    EnhancedTodaysTasksService.prototype.balanceUueStages = function (taskBuckets, userPrefs, userCapacity) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Mock implementation - in real system this would balance tasks based on UUE stages
                return [2 /*return*/, {
                        critical: taskBuckets.critical,
                        core: taskBuckets.core,
                        plus: taskBuckets.plus,
                        overflow: []
                    }];
            });
        });
    };
    /**
     * Generate question tasks from balanced tasks
     */
    EnhancedTodaysTasksService.prototype.generateQuestionTasks = function (balancedTasks, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var allTasks, questionSets, _i, allTasks_1, task, questionCount, difficulty, totalQuestions;
            return __generator(this, function (_a) {
                allTasks = __spreadArray(__spreadArray(__spreadArray([], balancedTasks.critical, true), balancedTasks.core, true), balancedTasks.plus, true);
                questionSets = [];
                for (_i = 0, allTasks_1 = allTasks; _i < allTasks_1.length; _i++) {
                    task = allTasks_1[_i];
                    questionCount = this.calculateQuestionCount(task);
                    difficulty = this.determineQuestionDifficulty(task);
                    questionSets.push({
                        criterionId: task.criterionId,
                        questionCount: questionCount,
                        questionTypes: task.questionTypes,
                        difficulty: difficulty,
                    });
                }
                totalQuestions = questionSets.reduce(function (sum, set) { return sum + set.questionCount; }, 0);
                return [2 /*return*/, {
                        tasks: allTasks,
                        questionSets: questionSets,
                        totalQuestions: totalQuestions,
                    }];
            });
        });
    };
    /**
     * Generate infinite "Generate More" questions
     */
    EnhancedTodaysTasksService.prototype.generateMoreQuestions = function (userId_1, sectionId_1, uueStage_1) {
        return __awaiter(this, arguments, void 0, function (userId, sectionId, uueStage, count) {
            var additionalCriteria, tasks, questionSets;
            var _this = this;
            if (count === void 0) { count = 5; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAdditionalCriteriaForReview(userId, sectionId, uueStage, count)];
                    case 1:
                        additionalCriteria = _a.sent();
                        tasks = additionalCriteria.map(function (criterion) { return ({
                            id: "additional-".concat(criterion.id),
                            criterionId: criterion.id,
                            sectionId: criterion.blueprintSectionId,
                            sectionName: 'Additional Practice',
                            uueStage: criterion.uueStage,
                            description: criterion.description,
                            priority: 'PLUS',
                            estimatedTime: _this.defaultTaskTimes.PLUS,
                            masteryScore: 0,
                            daysOverdue: 0,
                            questionTypes: criterion.questionTypes,
                        }); });
                        questionSets = additionalCriteria.map(function (criterion) { return ({
                            criterionId: criterion.id,
                            questionCount: 3, // Default to 3 questions for additional practice
                            questionTypes: criterion.questionTypes,
                            difficulty: 'MEDIUM',
                        }); });
                        return [2 /*return*/, {
                                tasks: tasks,
                                questionSets: questionSets,
                                totalQuestions: questionSets.reduce(function (sum, set) { return sum + set.questionCount; }, 0),
                            }];
                }
            });
        });
    };
    // Private helper methods
    /**
     * Get user preferences
     */
    EnhancedTodaysTasksService.prototype.getUserPreferences = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    // Mock implementation - in real system this would query the database
                    return [2 /*return*/, {
                            dailyStudyTime: 120, // 2 hours default
                            preferredUueStages: [client_2.UueStage.UNDERSTAND, client_2.UueStage.USE],
                            trackingIntensity: client_2.TrackingIntensity.NORMAL,
                            masteryThreshold: 'PROFICIENT'
                        }];
                }
                catch (error) {
                    console.error("Error getting user preferences for user ".concat(userId, ":"), error);
                    // Return default preferences
                    return [2 /*return*/, {
                            dailyStudyTime: 120,
                            preferredUueStages: [client_2.UueStage.UNDERSTAND, client_2.UueStage.USE],
                            trackingIntensity: client_2.TrackingIntensity.NORMAL,
                            masteryThreshold: 'PROFICIENT'
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Create a daily task from criterion and section data
     */
    EnhancedTodaysTasksService.prototype.createDailyTask = function (criterion, section) {
        // Mock implementation - in real system this would create tasks from actual data
        return {
            id: "task_".concat(Date.now()),
            criterionId: criterion.criterionId.toString(),
            sectionId: section.id.toString(),
            sectionName: section.title || 'Unknown Section',
            uueStage: client_2.UueStage.UNDERSTAND, // Default stage
            description: 'Mock task description',
            priority: 'CORE',
            estimatedTime: 5,
            masteryScore: criterion.masteryScore,
            daysOverdue: 0,
            questionTypes: ['MULTIPLE_CHOICE']
        };
    };
    /**
     * Determine task priority based on criterion data
     */
    EnhancedTodaysTasksService.prototype.determineTaskPriority = function (criterion) {
        // Mock implementation - in real system this would determine priority based on actual data
        if (criterion.isMastered) {
            return 'PLUS';
        }
        else if (criterion.masteryScore < 0.5) {
            return 'CRITICAL';
        }
        else {
            return 'CORE';
        }
    };
    /**
     * Calculate estimated time for a set of tasks
     */
    EnhancedTodaysTasksService.prototype.calculateEstimatedTime = function (taskBuckets) {
        // Mock implementation - in real system this would calculate based on actual task times
        return taskBuckets.critical.length * this.defaultTaskTimes.CRITICAL +
            taskBuckets.core.length * this.defaultTaskTimes.CORE +
            taskBuckets.plus.length * this.defaultTaskTimes.PLUS;
    };
    /**
     * Get overdue criteria for a user
     */
    EnhancedTodaysTasksService.prototype.getOverdueCriteria = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Mock implementation - in real system this would query the database
                return [2 /*return*/, []];
            });
        });
    };
    /**
     * Get mastery criteria for a user
     */
    EnhancedTodaysTasksService.prototype.getMasteryCriteria = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Mock implementation - in real system this would query the database
                return [2 /*return*/, []];
            });
        });
    };
    /**
     * Get section hierarchy for a user
     */
    EnhancedTodaysTasksService.prototype.getSectionHierarchy = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Mock implementation - in real system this would query the database
                return [2 /*return*/, []];
            });
        });
    };
    EnhancedTodaysTasksService.prototype.analyzeCapacity = function (balancedTasks, userCapacity) {
        var usedCapacity = this.calculateEstimatedTime(balancedTasks);
        var remainingCapacity = Math.max(0, userCapacity - usedCapacity);
        var capacityUtilization = (usedCapacity / userCapacity) * 100;
        var criticalOverflow = balancedTasks.overflow.filter(function (t) { return t.priority === 'CRITICAL'; }).length;
        var coreOverflow = balancedTasks.overflow.filter(function (t) { return t.priority === 'CORE'; }).length;
        var plusOverflow = balancedTasks.overflow.filter(function (t) { return t.priority === 'PLUS'; }).length;
        return {
            userCapacity: userCapacity,
            usedCapacity: usedCapacity,
            remainingCapacity: remainingCapacity,
            capacityUtilization: capacityUtilization,
            criticalOverflow: criticalOverflow,
            coreOverflow: coreOverflow,
            plusOverflow: plusOverflow,
        };
    };
    EnhancedTodaysTasksService.prototype.generateRecommendations = function (capacityAnalysis, balancedTasks) {
        var recommendations = [];
        if (capacityAnalysis.criticalOverflow > 0) {
            recommendations.push("\u26A0\uFE0F ".concat(capacityAnalysis.criticalOverflow, " critical tasks couldn't fit. Consider increasing study time or reducing tracking intensity."));
        }
        if (capacityAnalysis.capacityUtilization < 80) {
            recommendations.push("\uD83D\uDCDA You have ".concat(capacityAnalysis.remainingCapacity, " minutes remaining. Consider adding more core tasks or previewing next stage content."));
        }
        if (capacityAnalysis.capacityUtilization > 120) {
            recommendations.push("\u23F0 You're over capacity by ".concat(Math.abs(capacityAnalysis.remainingCapacity), " minutes. Consider reducing study time or prioritizing critical tasks only."));
        }
        if (balancedTasks.plus.length === 0 && balancedTasks.core.length > 0) {
            recommendations.push('🎯 All tasks are high priority. Great focus! Consider adding some preview content for variety.');
        }
        return recommendations;
    };
    EnhancedTodaysTasksService.prototype.calculateQuestionCount = function (task) {
        // Base question count on priority and mastery
        var baseCount = 3;
        if (task.priority === 'CRITICAL') {
            baseCount = 5; // More questions for critical tasks
        }
        else if (task.priority === 'PLUS') {
            baseCount = 2; // Fewer questions for preview tasks
        }
        // Adjust based on mastery score
        if (task.masteryScore < 0.3) {
            baseCount += 2; // More questions for struggling concepts
        }
        else if (task.masteryScore > 0.8) {
            baseCount = Math.max(1, baseCount - 1); // Fewer questions for well-mastered concepts
        }
        return baseCount;
    };
    EnhancedTodaysTasksService.prototype.determineQuestionDifficulty = function (task) {
        if (task.uueStage === 'UNDERSTAND')
            return 'EASY';
        if (task.uueStage === 'USE')
            return 'MEDIUM';
        if (task.uueStage === 'EXPLORE')
            return 'HARD';
        return 'MEDIUM';
    };
    EnhancedTodaysTasksService.prototype.getAdditionalCriteriaForReview = function (userId_1, sectionId_1, uueStage_1) {
        return __awaiter(this, arguments, void 0, function (userId, sectionId, uueStage, count) {
            var whereClause;
            if (count === void 0) { count = 5; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        whereClause = { userId: userId };
                        if (sectionId) {
                            whereClause.blueprintSectionId = sectionId;
                        }
                        if (uueStage) {
                            whereClause.uueStage = uueStage;
                        }
                        return [4 /*yield*/, prisma.userCriterionMastery.findMany({
                                where: __assign(__assign({}, whereClause), { OR: [
                                        { lastReviewedAt: null },
                                        { lastReviewedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Not reviewed in 7 days
                                        { masteryScore: { lt: 0.7 } }, // Low mastery scores
                                    ] }),
                                include: {
                                    masteryCriterion: true,
                                },
                                take: count,
                                orderBy: [
                                    { lastReviewedAt: 'asc' },
                                    { masteryScore: 'asc' },
                                    { consecutiveFailures: 'desc' },
                                ],
                            })];
                    case 1: 
                    // Get criteria that haven't been reviewed recently or need reinforcement
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    EnhancedTodaysTasksService.prototype.getDaysDifference = function (date1, date2) {
        var timeDiff = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    };
    /**
     * Get user capacity and preferences
     */
    EnhancedTodaysTasksService.prototype.getUserCapacityAndPreferences = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var user, userPreferences;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, prisma.user.findUnique({
                            where: { id: userId },
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                dailyStudyTimeMinutes: true
                            }
                        })];
                    case 1:
                        user = _c.sent();
                        if (!user) {
                            throw new Error('User not found');
                        }
                        return [4 /*yield*/, prisma.userPreferences.findUnique({
                                where: { userId: userId }
                            })];
                    case 2:
                        userPreferences = _c.sent();
                        return [2 /*return*/, {
                                dailyStudyTime: user.dailyStudyTimeMinutes || 120, // Default to 2 hours
                                preferredUueStages: (userPreferences === null || userPreferences === void 0 ? void 0 : userPreferences.preferredUueStages) || ['UNDERSTAND', 'USE', 'EXPLORE'],
                                trackingIntensity: (_a = userPreferences === null || userPreferences === void 0 ? void 0 : userPreferences.defaultTrackingIntensity) !== null && _a !== void 0 ? _a : 'NORMAL',
                                masteryThreshold: (_b = userPreferences === null || userPreferences === void 0 ? void 0 : userPreferences.defaultMasteryThreshold) !== null && _b !== void 0 ? _b : 'PROFICIENT',
                            }];
                }
            });
        });
    };
    /**
     * Get capacity gap analysis with user recommendations
     */
    EnhancedTodaysTasksService.prototype.getCapacityGapAnalysis = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userPrefs, dueCriteria, criticalCount, coreCount, requiredCapacity, gap, recommendations, priorityAdjustments;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserCapacityAndPreferences(userId)];
                    case 1:
                        userPrefs = _a.sent();
                        return [4 /*yield*/, this.getDueCriteriaForUser(userId)];
                    case 2:
                        dueCriteria = _a.sent();
                        criticalCount = dueCriteria.filter(function (c) { return _this.determineTaskPriority(c) === 'CRITICAL'; }).length;
                        coreCount = dueCriteria.filter(function (c) { return _this.determineTaskPriority(c) === 'CORE'; }).length;
                        requiredCapacity = (criticalCount * this.defaultTaskTimes.CRITICAL) +
                            (coreCount * this.defaultTaskTimes.CORE);
                        gap = requiredCapacity - userPrefs.dailyStudyTime;
                        recommendations = [];
                        priorityAdjustments = [];
                        if (gap > 0) {
                            recommendations.push("Increase daily study time by ".concat(gap, " minutes to cover all due tasks"));
                            recommendations.push('Consider reducing tracking intensity for non-critical criteria');
                            recommendations.push('Focus on critical tasks first, defer core tasks to tomorrow');
                            if (criticalCount > 5) {
                                priorityAdjustments.push('Too many critical tasks - consider reducing tracking intensity');
                            }
                        }
                        else if (gap < -20) {
                            recommendations.push("You have ".concat(Math.abs(gap), " minutes of extra capacity"));
                            recommendations.push('Consider adding more core tasks or previewing next stage content');
                            recommendations.push('Increase tracking intensity for faster progression');
                        }
                        return [2 /*return*/, {
                                currentCapacity: userPrefs.dailyStudyTime,
                                requiredCapacity: requiredCapacity,
                                gap: gap,
                                recommendations: recommendations,
                                priorityAdjustments: priorityAdjustments,
                            }];
                }
            });
        });
    };
    /**
     * Get user's capacity analysis
     */
    EnhancedTodaysTasksService.prototype.getUserCapacityAnalysis = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userPrefs, dueCriteria, criticalCount, coreCount, plusCount, usedCapacity, remainingCapacity, capacityUtilization, criticalOverflow, coreOverflow, plusOverflow;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserCapacityAndPreferences(userId)];
                    case 1:
                        userPrefs = _a.sent();
                        return [4 /*yield*/, this.getDueCriteriaForUser(userId)];
                    case 2:
                        dueCriteria = _a.sent();
                        criticalCount = dueCriteria.filter(function (c) { return _this.determineTaskPriority(c) === 'CRITICAL'; }).length;
                        coreCount = dueCriteria.filter(function (c) { return _this.determineTaskPriority(c) === 'CORE'; }).length;
                        plusCount = dueCriteria.filter(function (c) { return _this.determineTaskPriority(c) === 'PLUS'; }).length;
                        usedCapacity = (criticalCount * this.defaultTaskTimes.CRITICAL) +
                            (coreCount * this.defaultTaskTimes.CORE) +
                            (plusCount * this.defaultTaskTimes.PLUS);
                        remainingCapacity = Math.max(0, userPrefs.dailyStudyTime - usedCapacity);
                        capacityUtilization = (usedCapacity / userPrefs.dailyStudyTime) * 100;
                        criticalOverflow = Math.max(0, criticalCount - Math.floor(userPrefs.dailyStudyTime * 0.4 / this.defaultTaskTimes.CRITICAL));
                        coreOverflow = Math.max(0, coreCount - Math.floor(userPrefs.dailyStudyTime * 0.4 / this.defaultTaskTimes.CORE));
                        plusOverflow = Math.max(0, plusCount - Math.floor(userPrefs.dailyStudyTime * 0.2 / this.defaultTaskTimes.PLUS));
                        return [2 /*return*/, {
                                userCapacity: userPrefs.dailyStudyTime,
                                usedCapacity: usedCapacity,
                                remainingCapacity: remainingCapacity,
                                capacityUtilization: capacityUtilization,
                                criticalOverflow: criticalOverflow,
                                coreOverflow: coreOverflow,
                                plusOverflow: plusOverflow,
                            }];
                }
            });
        });
    };
    /**
     * Complete a task
     */
    EnhancedTodaysTasksService.prototype.completeTask = function (userId, taskId, completionData) {
        return __awaiter(this, void 0, void 0, function () {
            var masteryGain, nextReviewDate;
            return __generator(this, function (_a) {
                masteryGain = Math.min(0.1, completionData.performance * 0.15);
                nextReviewDate = new Date();
                nextReviewDate.setDate(nextReviewDate.getDate() + Math.ceil(1 / masteryGain));
                return [2 /*return*/, {
                        taskId: taskId,
                        completed: true,
                        performance: completionData.performance,
                        nextReviewDate: nextReviewDate,
                        masteryGain: masteryGain
                    }];
            });
        });
    };
    /**
     * Get today's task progress
     */
    EnhancedTodaysTasksService.prototype.getTodaysTaskProgress = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var todaysTasks, completedCritical, completedCore, completedPlus, totalCompleted, totalTasks, completionRate, estimatedTimeRemaining;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.generateTodaysTasksForUser(userId)];
                    case 1:
                        todaysTasks = _a.sent();
                        completedCritical = Math.floor(todaysTasks.critical.count * 0.3);
                        completedCore = Math.floor(todaysTasks.core.count * 0.5);
                        completedPlus = Math.floor(todaysTasks.plus.count * 0.2);
                        totalCompleted = completedCritical + completedCore + completedPlus;
                        totalTasks = todaysTasks.totalTasks;
                        completionRate = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;
                        estimatedTimeRemaining = todaysTasks.estimatedTime * (1 - completionRate / 100);
                        return [2 /*return*/, {
                                totalTasks: totalTasks,
                                completedTasks: totalCompleted,
                                inProgressTasks: totalTasks - totalCompleted,
                                completionRate: completionRate,
                                estimatedTimeRemaining: estimatedTimeRemaining,
                                progressByBucket: {
                                    critical: {
                                        total: todaysTasks.critical.count,
                                        completed: completedCritical,
                                        progress: todaysTasks.critical.count > 0 ? (completedCritical / todaysTasks.critical.count) * 100 : 0
                                    },
                                    core: {
                                        total: todaysTasks.core.count,
                                        completed: completedCore,
                                        progress: todaysTasks.core.count > 0 ? (completedCore / todaysTasks.core.count) * 100 : 0
                                    },
                                    plus: {
                                        total: todaysTasks.plus.count,
                                        completed: completedPlus,
                                        progress: todaysTasks.plus.count > 0 ? (completedPlus / todaysTasks.plus.count) * 100 : 0
                                    }
                                }
                            }];
                }
            });
        });
    };
    /**
     * Reprioritize tasks
     */
    EnhancedTodaysTasksService.prototype.reprioritizeTasks = function (userId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var newOrder, estimatedTimeImpact, recommendations;
            return __generator(this, function (_a) {
                newOrder = options.priorityOrder;
                estimatedTimeImpact = Math.random() * 30 - 15;
                recommendations = [];
                if (options.focusAreas.length > 0) {
                    recommendations.push("Focus areas: ".concat(options.focusAreas.join(', ')));
                }
                if (estimatedTimeImpact > 0) {
                    recommendations.push("Estimated time increase: ".concat(Math.round(estimatedTimeImpact), " minutes"));
                }
                else if (estimatedTimeImpact < 0) {
                    recommendations.push("Estimated time savings: ".concat(Math.round(Math.abs(estimatedTimeImpact)), " minutes"));
                }
                return [2 /*return*/, {
                        reprioritized: true,
                        newOrder: newOrder,
                        estimatedTimeImpact: estimatedTimeImpact,
                        recommendations: recommendations
                    }];
            });
        });
    };
    /**
     * Get personalized recommendations
     */
    EnhancedTodaysTasksService.prototype.getPersonalizedRecommendations = function (userId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendations;
            return __generator(this, function (_a) {
                recommendations = [];
                if (options.focus === 'weakest' || options.focus === 'all') {
                    recommendations.push({
                        taskId: 'rec_1',
                        title: 'Review Basic Concepts',
                        priority: 'HIGH',
                        estimatedTime: 15,
                        reason: 'Based on your recent performance, focus on foundational concepts',
                        difficulty: 'EASY'
                    });
                }
                if (options.focus === 'strongest' || options.focus === 'all') {
                    recommendations.push({
                        taskId: 'rec_2',
                        title: 'Advanced Problem Solving',
                        priority: 'MEDIUM',
                        estimatedTime: 25,
                        reason: 'You\'re ready for more challenging material',
                        difficulty: 'HARD'
                    });
                }
                if (options.timeAvailable && options.timeAvailable < 30) {
                    recommendations.push({
                        taskId: 'rec_3',
                        title: 'Quick Review Session',
                        priority: 'MEDIUM',
                        estimatedTime: options.timeAvailable,
                        reason: 'Optimized for your available time',
                        difficulty: 'MEDIUM'
                    });
                }
                return [2 /*return*/, recommendations];
            });
        });
    };
    /**
     * Get task analytics
     */
    EnhancedTodaysTasksService.prototype.getTaskAnalytics = function (userId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var totalTasks, completedTasks, averageCompletionTime, successRate, productivityTrend, topPerformingAreas, areasForImprovement, result;
            return __generator(this, function (_a) {
                totalTasks = options.period === 'week' ? 35 : options.period === 'month' ? 140 : 7;
                completedTasks = Math.floor(totalTasks * 0.8);
                averageCompletionTime = 12;
                successRate = 85;
                productivityTrend = Math.random() > 0.6 ? 'increasing' : Math.random() > 0.3 ? 'decreasing' : 'stable';
                topPerformingAreas = ['Calculus', 'Algebra', 'Geometry'];
                areasForImprovement = ['Trigonometry', 'Statistics'];
                result = {
                    period: options.period,
                    totalTasks: totalTasks,
                    completedTasks: completedTasks,
                    averageCompletionTime: averageCompletionTime,
                    successRate: successRate,
                    productivityTrend: productivityTrend,
                    topPerformingAreas: topPerformingAreas,
                    areasForImprovement: areasForImprovement
                };
                if (options.includeDetails) {
                    result.details = {
                        dailyBreakdown: Array.from({ length: 7 }, function (_, i) { return ({
                            day: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
                            tasksAssigned: Math.floor(Math.random() * 10) + 5,
                            tasksCompleted: Math.floor(Math.random() * 8) + 3,
                            averageTime: Math.floor(Math.random() * 10) + 8
                        }); }),
                        performanceByDifficulty: {
                            EASY: { total: 20, completed: 18, successRate: 90 },
                            MEDIUM: { total: 30, completed: 25, successRate: 83 },
                            HARD: { total: 15, completed: 12, successRate: 80 }
                        }
                    };
                }
                return [2 /*return*/, result];
            });
        });
    };
    /**
     * Skip a task
     */
    EnhancedTodaysTasksService.prototype.skipTask = function (userId, taskId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var impact;
            return __generator(this, function (_a) {
                impact = options.reason === 'User choice' ? 'minimal' : 'moderate';
                return [2 /*return*/, {
                        skipped: true,
                        rescheduledFor: options.rescheduleFor,
                        impact: impact
                    }];
            });
        });
    };
    /**
     * Get upcoming tasks
     */
    EnhancedTodaysTasksService.prototype.getUpcomingTasks = function (userId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var tasks, priorities, i, dayTasks, j, dueDate, priority, estimatedTime, status_1, totalTasks, estimatedTotalTime, priorityDistribution;
            return __generator(this, function (_a) {
                tasks = [];
                priorities = ['critical', 'core', 'plus'];
                for (i = 0; i < options.days; i++) {
                    dayTasks = Math.floor(Math.random() * 8) + 3;
                    for (j = 0; j < dayTasks; j++) {
                        dueDate = new Date();
                        dueDate.setDate(dueDate.getDate() + i);
                        priority = priorities[Math.floor(Math.random() * priorities.length)];
                        estimatedTime = priority === 'critical' ? 8 : priority === 'core' ? 5 : 3;
                        status_1 = options.includeCompleted ?
                            (Math.random() > 0.7 ? 'completed' : Math.random() > 0.5 ? 'in_progress' : 'pending') :
                            'pending';
                        tasks.push({
                            id: "task_".concat(i, "_").concat(j),
                            title: "".concat(priority.charAt(0).toUpperCase() + priority.slice(1), " Task ").concat(j + 1),
                            dueDate: dueDate,
                            priority: priority,
                            estimatedTime: estimatedTime,
                            status: status_1
                        });
                    }
                }
                totalTasks = tasks.length;
                estimatedTotalTime = tasks.reduce(function (sum, task) { return sum + task.estimatedTime; }, 0);
                priorityDistribution = {
                    critical: tasks.filter(function (t) { return t.priority === 'critical'; }).length,
                    core: tasks.filter(function (t) { return t.priority === 'core'; }).length,
                    plus: tasks.filter(function (t) { return t.priority === 'plus'; }).length
                };
                return [2 /*return*/, {
                        tasks: tasks,
                        totalTasks: totalTasks,
                        estimatedTotalTime: estimatedTotalTime,
                        priorityDistribution: priorityDistribution
                    }];
            });
        });
    };
    /**
     * Complete multiple tasks in batch
     */
    EnhancedTodaysTasksService.prototype.batchCompleteTasks = function (userId, taskIds, completionData) {
        return __awaiter(this, void 0, void 0, function () {
            var completed, failed, totalTimeSpent, masteryGained, _i, taskIds_1, taskId, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        completed = [];
                        failed = [];
                        totalTimeSpent = 0;
                        masteryGained = 0;
                        _i = 0, taskIds_1 = taskIds;
                        _a.label = 1;
                    case 1:
                        if (!(_i < taskIds_1.length)) return [3 /*break*/, 6];
                        taskId = taskIds_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.completeTask(userId, taskId, {
                                completionTime: new Date(),
                                performance: 0.8,
                                notes: 'Batch completion'
                            })];
                    case 3:
                        result = _a.sent();
                        completed.push(taskId);
                        totalTimeSpent += 10; // Default time per task
                        masteryGained += result.masteryGain || 0.05;
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        failed.push(taskId);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, {
                            completed: completed,
                            failed: failed,
                            totalTimeSpent: totalTimeSpent,
                            masteryGained: masteryGained
                        }];
                }
            });
        });
    };
    /**
     * Get completion streak
     */
    EnhancedTodaysTasksService.prototype.getCompletionStreak = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var currentStreak, longestStreak, totalDays, streakType, nextMilestone, motivation;
            return __generator(this, function (_a) {
                currentStreak = Math.floor(Math.random() * 15) + 5;
                longestStreak = Math.max(currentStreak, Math.floor(Math.random() * 30) + 10);
                totalDays = Math.floor(Math.random() * 100) + 50;
                streakType = 'daily';
                nextMilestone = Math.ceil(currentStreak / 5) * 5;
                motivation = '';
                if (currentStreak >= longestStreak) {
                    motivation = "New record! Keep going to reach ".concat(nextMilestone, " days!");
                }
                else if (currentStreak >= 10) {
                    motivation = "Great consistency! You're ".concat(nextMilestone - currentStreak, " days away from your next milestone.");
                }
                else {
                    motivation = "Good start! Build momentum to reach ".concat(nextMilestone, " days.");
                }
                return [2 /*return*/, {
                        currentStreak: currentStreak,
                        longestStreak: longestStreak,
                        totalDays: totalDays,
                        streakType: streakType,
                        nextMilestone: nextMilestone,
                        motivation: motivation
                    }];
            });
        });
    };
    return EnhancedTodaysTasksService;
}());
exports.EnhancedTodaysTasksService = EnhancedTodaysTasksService;
exports.enhancedTodaysTasksService = new EnhancedTodaysTasksService();
