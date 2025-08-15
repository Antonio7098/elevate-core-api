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
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionInstanceService = exports.QuestionInstanceService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var QuestionInstanceService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var QuestionInstanceService = _classThis = /** @class */ (function () {
        function QuestionInstanceService_1() {
            this.logger = new common_1.Logger(QuestionInstanceService.name);
        }
        /**
         * Create a new question instance
         */
        QuestionInstanceService_1.prototype.createQuestionInstance = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var questionInstance, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.logger.log("Creating question instance for user ".concat(data.userId));
                            return [4 /*yield*/, prisma.questionInstance.create({
                                    data: {
                                        questionText: data.questionText,
                                        answer: data.answer,
                                        explanation: data.explanation,
                                        context: data.context,
                                        difficulty: data.difficulty || 'MEDIUM',
                                        masteryCriterionId: data.masteryCriterionId,
                                        userId: data.userId
                                    }
                                })];
                        case 1:
                            questionInstance = _a.sent();
                            this.logger.log("Question instance created with ID: ".concat(questionInstance.id));
                            return [2 /*return*/, questionInstance];
                        case 2:
                            error_1 = _a.sent();
                            this.logger.error("Error creating question instance: ".concat(error_1.message), error_1.stack);
                            throw new Error('Failed to create question instance');
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get a question instance by ID
         */
        QuestionInstanceService_1.prototype.getQuestionInstance = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var questionInstance, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.logger.log("Fetching question instance with ID: ".concat(id));
                            return [4 /*yield*/, prisma.questionInstance.findUnique({
                                    where: { id: id },
                                    include: {
                                        masteryCriterion: true,
                                        user: {
                                            select: {
                                                id: true,
                                                email: true
                                            }
                                        }
                                    }
                                })];
                        case 1:
                            questionInstance = _a.sent();
                            return [2 /*return*/, questionInstance];
                        case 2:
                            error_2 = _a.sent();
                            this.logger.error("Error fetching question instance: ".concat(error_2.message), error_2.stack);
                            throw new Error('Failed to fetch question instance');
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Update a question instance
         */
        QuestionInstanceService_1.prototype.updateQuestionInstance = function (id, data) {
            return __awaiter(this, void 0, void 0, function () {
                var questionInstance, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.logger.log("Updating question instance with ID: ".concat(id));
                            return [4 /*yield*/, prisma.questionInstance.update({
                                    where: { id: id },
                                    data: {
                                        questionText: data.questionText,
                                        answer: data.answer,
                                        explanation: data.explanation,
                                        context: data.context,
                                        difficulty: data.difficulty,
                                        updatedAt: new Date()
                                    }
                                })];
                        case 1:
                            questionInstance = _a.sent();
                            this.logger.log("Question instance updated successfully");
                            return [2 /*return*/, questionInstance];
                        case 2:
                            error_3 = _a.sent();
                            this.logger.error("Error updating question instance: ".concat(error_3.message), error_3.stack);
                            throw new Error('Failed to update question instance');
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Delete a question instance
         */
        QuestionInstanceService_1.prototype.deleteQuestionInstance = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.logger.log("Deleting question instance with ID: ".concat(id));
                            return [4 /*yield*/, prisma.questionInstance.delete({
                                    where: { id: id }
                                })];
                        case 1:
                            _a.sent();
                            this.logger.log("Question instance deleted successfully");
                            return [3 /*break*/, 3];
                        case 2:
                            error_4 = _a.sent();
                            this.logger.error("Error deleting question instance: ".concat(error_4.message), error_4.stack);
                            throw new Error('Failed to delete question instance');
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get questions by mastery criterion
         */
        QuestionInstanceService_1.prototype.getQuestionsByCriterion = function (masteryCriterionId, filters) {
            return __awaiter(this, void 0, void 0, function () {
                var questions, error_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.logger.log("Fetching questions for criterion: ".concat(masteryCriterionId));
                            return [4 /*yield*/, prisma.questionInstance.findMany({
                                    where: {
                                        masteryCriterionId: masteryCriterionId,
                                        difficulty: filters === null || filters === void 0 ? void 0 : filters.difficulty
                                    },
                                    take: (filters === null || filters === void 0 ? void 0 : filters.limit) || 50,
                                    skip: (filters === null || filters === void 0 ? void 0 : filters.offset) || 0,
                                    orderBy: {
                                        createdAt: 'desc'
                                    }
                                })];
                        case 1:
                            questions = _a.sent();
                            return [2 /*return*/, questions];
                        case 2:
                            error_5 = _a.sent();
                            this.logger.error("Error fetching questions by criterion: ".concat(error_5.message), error_5.stack);
                            throw new Error('Failed to fetch questions by criterion');
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Search question instances
         */
        QuestionInstanceService_1.prototype.searchQuestionInstances = function (query, filters) {
            return __awaiter(this, void 0, void 0, function () {
                var questions, error_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.logger.log("Searching questions with query: ".concat(query));
                            return [4 /*yield*/, prisma.questionInstance.findMany({
                                    where: {
                                        OR: [
                                            { questionText: { contains: query, mode: 'insensitive' } },
                                            { answer: { contains: query, mode: 'insensitive' } },
                                            { explanation: { contains: query, mode: 'insensitive' } }
                                        ],
                                        difficulty: filters === null || filters === void 0 ? void 0 : filters.difficulty,
                                        masteryCriterionId: filters === null || filters === void 0 ? void 0 : filters.masteryCriterionId,
                                        userId: filters === null || filters === void 0 ? void 0 : filters.userId
                                    },
                                    take: (filters === null || filters === void 0 ? void 0 : filters.limit) || 50,
                                    skip: (filters === null || filters === void 0 ? void 0 : filters.offset) || 0,
                                    orderBy: {
                                        createdAt: 'desc'
                                    }
                                })];
                        case 1:
                            questions = _a.sent();
                            return [2 /*return*/, questions];
                        case 2:
                            error_6 = _a.sent();
                            this.logger.error("Error searching questions: ".concat(error_6.message), error_6.stack);
                            throw new Error('Failed to search questions');
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Record a question attempt
         */
        QuestionInstanceService_1.prototype.recordQuestionAttempt = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var attempt, error_7;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            this.logger.log("Recording attempt for question: ".concat(data.questionInstanceId));
                            return [4 /*yield*/, prisma.userQuestionAnswer.create({
                                    data: {
                                        userId: data.userId,
                                        questionId: data.questionInstanceId,
                                        isCorrect: data.isCorrect,
                                        answerText: data.userAnswer,
                                        timeSpentSeconds: data.timeSpent || 0
                                    }
                                })];
                        case 1:
                            attempt = _a.sent();
                            // Update question instance statistics
                            return [4 /*yield*/, this.updateQuestionStatistics(data.questionInstanceId, data.isCorrect, data.timeSpent || 0)];
                        case 2:
                            // Update question instance statistics
                            _a.sent();
                            this.logger.log("Question attempt recorded successfully");
                            return [2 /*return*/, attempt];
                        case 3:
                            error_7 = _a.sent();
                            this.logger.error("Error recording question attempt: ".concat(error_7.message), error_7.stack);
                            throw new Error('Failed to record question attempt');
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get question recommendations for a user
         */
        QuestionInstanceService_1.prototype.getQuestionRecommendations = function (userId, filters) {
            return __awaiter(this, void 0, void 0, function () {
                var answeredQuestionIds, _a, questions, error_8;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 5, , 6]);
                            this.logger.log("Getting question recommendations for user: ".concat(userId));
                            if (!(filters === null || filters === void 0 ? void 0 : filters.excludeAnswered)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.getUserAnsweredQuestionIds(userId)];
                        case 1:
                            _a = (_b.sent());
                            return [3 /*break*/, 3];
                        case 2:
                            _a = [];
                            _b.label = 3;
                        case 3:
                            answeredQuestionIds = _a;
                            return [4 /*yield*/, prisma.questionInstance.findMany({
                                    where: {
                                        id: { notIn: answeredQuestionIds },
                                        difficulty: filters === null || filters === void 0 ? void 0 : filters.difficulty,
                                        masteryCriterionId: filters === null || filters === void 0 ? void 0 : filters.masteryCriterionId
                                    },
                                    take: (filters === null || filters === void 0 ? void 0 : filters.limit) || 10,
                                    orderBy: [
                                        { createdAt: 'desc' },
                                        { difficulty: 'asc' }
                                    ]
                                })];
                        case 4:
                            questions = _b.sent();
                            return [2 /*return*/, questions];
                        case 5:
                            error_8 = _b.sent();
                            this.logger.error("Error getting question recommendations: ".concat(error_8.message), error_8.stack);
                            throw new Error('Failed to get question recommendations');
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get user question statistics
         */
        QuestionInstanceService_1.prototype.getUserQuestionStats = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var totalAnswered, correctAnswers, timeStats, now, lastWeek, lastMonth, lastQuarter, lastWeekStats, lastMonthStats, lastQuarterStats, error_9;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 7, , 8]);
                            this.logger.log("Getting question stats for user: ".concat(userId));
                            return [4 /*yield*/, prisma.userQuestionAnswer.count({
                                    where: { userId: userId }
                                })];
                        case 1:
                            totalAnswered = _a.sent();
                            return [4 /*yield*/, prisma.userQuestionAnswer.count({
                                    where: {
                                        userId: userId,
                                        isCorrect: true
                                    }
                                })];
                        case 2:
                            correctAnswers = _a.sent();
                            return [4 /*yield*/, prisma.userQuestionAnswer.aggregate({
                                    where: { userId: userId },
                                    _avg: {
                                        timeSpentSeconds: true
                                    }
                                })];
                        case 3:
                            timeStats = _a.sent();
                            now = new Date();
                            lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                            lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                            return [4 /*yield*/, this.getPerformanceInPeriod(userId, lastWeek, now)];
                        case 4:
                            lastWeekStats = _a.sent();
                            return [4 /*yield*/, this.getPerformanceInPeriod(userId, lastMonth, now)];
                        case 5:
                            lastMonthStats = _a.sent();
                            return [4 /*yield*/, this.getPerformanceInPeriod(userId, lastQuarter, now)];
                        case 6:
                            lastQuarterStats = _a.sent();
                            return [2 /*return*/, {
                                    totalQuestions: totalAnswered,
                                    answeredQuestions: totalAnswered,
                                    correctAnswers: correctAnswers,
                                    averageTimeSpent: timeStats._avg.timeSpentSeconds || 0,
                                    successRate: totalAnswered > 0 ? (correctAnswers / totalAnswered) * 100 : 0,
                                    difficultyBreakdown: this.calculateDifficultyBreakdown([]),
                                    masteryCriterionBreakdown: {},
                                    recentPerformance: {
                                        lastWeek: lastWeekStats.successRate,
                                        lastMonth: lastMonthStats.successRate,
                                        lastQuarter: lastQuarterStats.successRate
                                    }
                                }];
                        case 7:
                            error_9 = _a.sent();
                            this.logger.error("Error getting user question stats: ".concat(error_9.message), error_9.stack);
                            throw new Error('Failed to get user question stats');
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Record multiple question attempts in batch
         */
        QuestionInstanceService_1.prototype.recordBatchAttempts = function (userId, attempts) {
            return __awaiter(this, void 0, void 0, function () {
                var results, errorDetails, _i, attempts_1, attempt, result, error_10, error_11;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 7, , 8]);
                            this.logger.log("Recording ".concat(attempts.length, " batch attempts for user: ").concat(userId));
                            results = [];
                            errorDetails = [];
                            _i = 0, attempts_1 = attempts;
                            _a.label = 1;
                        case 1:
                            if (!(_i < attempts_1.length)) return [3 /*break*/, 6];
                            attempt = attempts_1[_i];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.recordQuestionAttempt(__assign(__assign({}, attempt), { userId: userId }))];
                        case 3:
                            result = _a.sent();
                            results.push(result);
                            return [3 /*break*/, 5];
                        case 4:
                            error_10 = _a.sent();
                            errorDetails.push({
                                questionInstanceId: attempt.questionInstanceId,
                                error: error_10.message
                            });
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, {
                                processed: results.length,
                                errors: errorDetails.length,
                                results: results,
                                errorDetails: errorDetails
                            }];
                        case 7:
                            error_11 = _a.sent();
                            this.logger.error("Error recording batch attempts: ".concat(error_11.message), error_11.stack);
                            throw new Error('Failed to record batch attempts');
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        // ============================================================================
        // PRIVATE HELPER METHODS
        // ============================================================================
        /**
         * Update question instance statistics
         */
        QuestionInstanceService_1.prototype.updateQuestionStatistics = function (questionId, isCorrect, timeSpent) {
            return __awaiter(this, void 0, void 0, function () {
                var question, error_12;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            return [4 /*yield*/, prisma.questionInstance.findUnique({
                                    where: { id: questionId }
                                })];
                        case 1:
                            question = _a.sent();
                            if (!question) return [3 /*break*/, 3];
                            // Update basic stats (this could be enhanced with more sophisticated tracking)
                            return [4 /*yield*/, prisma.questionInstance.update({
                                    where: { id: questionId },
                                    data: {
                                        updatedAt: new Date()
                                    }
                                })];
                        case 2:
                            // Update basic stats (this could be enhanced with more sophisticated tracking)
                            _a.sent();
                            _a.label = 3;
                        case 3: return [3 /*break*/, 5];
                        case 4:
                            error_12 = _a.sent();
                            this.logger.warn("Could not update question statistics: ".concat(error_12.message));
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get user's answered question IDs
         */
        QuestionInstanceService_1.prototype.getUserAnsweredQuestionIds = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var answers, error_13;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, prisma.userQuestionAnswer.findMany({
                                    where: { userId: userId },
                                    select: { questionId: true }
                                })];
                        case 1:
                            answers = _a.sent();
                            return [2 /*return*/, answers.map(function (a) { return a.questionId; })];
                        case 2:
                            error_13 = _a.sent();
                            this.logger.warn("Could not get user answered question IDs: ".concat(error_13.message));
                            return [2 /*return*/, []];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get performance statistics for a specific time period
         */
        QuestionInstanceService_1.prototype.getPerformanceInPeriod = function (userId, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function () {
                var total, correct, error_14;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, prisma.userQuestionAnswer.count({
                                    where: {
                                        userId: userId,
                                        createdAt: {
                                            gte: startDate,
                                            lte: endDate
                                        }
                                    }
                                })];
                        case 1:
                            total = _a.sent();
                            if (total === 0) {
                                return [2 /*return*/, { successRate: 0 }];
                            }
                            return [4 /*yield*/, prisma.userQuestionAnswer.count({
                                    where: {
                                        userId: userId,
                                        isCorrect: true,
                                        createdAt: {
                                            gte: startDate,
                                            lte: endDate
                                        }
                                    }
                                })];
                        case 2:
                            correct = _a.sent();
                            return [2 /*return*/, {
                                    successRate: (correct / total) * 100
                                }];
                        case 3:
                            error_14 = _a.sent();
                            this.logger.warn("Could not get performance in period: ".concat(error_14.message));
                            return [2 /*return*/, { successRate: 0 }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Calculate difficulty breakdown from question statistics
         */
        QuestionInstanceService_1.prototype.calculateDifficultyBreakdown = function (stats) {
            var breakdown = {
                EASY: 0,
                MEDIUM: 0,
                HARD: 0
            };
            // This is a simplified calculation - in a real implementation,
            // you'd want to aggregate by difficulty level
            return breakdown;
        };
        return QuestionInstanceService_1;
    }());
    __setFunctionName(_classThis, "QuestionInstanceService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        QuestionInstanceService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return QuestionInstanceService = _classThis;
}();
exports.QuestionInstanceService = QuestionInstanceService;
// Export service instance
exports.questionInstanceService = new QuestionInstanceService();
