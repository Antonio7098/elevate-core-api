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
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionInstanceController = exports.QuestionInstanceController = void 0;
var questionInstance_service_1 = require("../../services/questionInstance.service");
// ============================================================================
// QUESTION INSTANCE CONTROLLER
// ============================================================================
// 🆕 NEW ARCHITECTURE - Uses criterion-based logic instead of QuestionSet-based
// ============================================================================
var QuestionInstanceController = /** @class */ (function () {
    function QuestionInstanceController() {
    }
    /**
     * POST /api/question-instance
     * Create a new question instance
     */
    QuestionInstanceController.prototype.createQuestionInstance = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, _a, questionText, answer, explanation, masteryCriterionId, difficulty, context, validDifficulties, questionInstance, error_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        _a = req.body, questionText = _a.questionText, answer = _a.answer, explanation = _a.explanation, masteryCriterionId = _a.masteryCriterionId, difficulty = _a.difficulty, context = _a.context;
                        if (!questionText || !answer || !masteryCriterionId) {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'Missing required fields: questionText, answer, masteryCriterionId'
                                })];
                        }
                        validDifficulties = ['EASY', 'MEDIUM', 'HARD'];
                        if (difficulty && !validDifficulties.includes(difficulty)) {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'Invalid difficulty. Must be one of: EASY, MEDIUM, HARD'
                                })];
                        }
                        return [4 /*yield*/, questionInstance_service_1.questionInstanceService.createQuestionInstance({
                                questionText: questionText,
                                answer: answer,
                                explanation: explanation,
                                context: context,
                                difficulty: difficulty,
                                masteryCriterionId: parseInt(masteryCriterionId),
                                userId: userId
                            })];
                    case 1:
                        questionInstance = _c.sent();
                        res.status(201).json({
                            success: true,
                            data: questionInstance
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _c.sent();
                        console.error('Error creating question instance:', error_1);
                        res.status(500).json({ error: 'Failed to create question instance' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/question-instance/:id
     * Get a question instance by ID
     */
    QuestionInstanceController.prototype.getQuestionInstance = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, questionInstance, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        if (!id) {
                            return [2 /*return*/, res.status(400).json({ error: 'Missing question ID' })];
                        }
                        return [4 /*yield*/, questionInstance_service_1.questionInstanceService.getQuestionInstance(parseInt(id))];
                    case 1:
                        questionInstance = _a.sent();
                        if (!questionInstance) {
                            return [2 /*return*/, res.status(404).json({ error: 'Question instance not found' })];
                        }
                        res.json({
                            success: true,
                            data: questionInstance
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error fetching question instance:', error_2);
                        res.status(500).json({ error: 'Failed to fetch question instance' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * PUT /api/question-instance/:id
     * Update a question instance
     */
    QuestionInstanceController.prototype.updateQuestionInstance = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, id, updateData, validQuestionTypes, validDifficulties, updatedQuestion;
            var _a;
            return __generator(this, function (_b) {
                try {
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                    }
                    id = req.params.id;
                    updateData = req.body;
                    if (!id) {
                        return [2 /*return*/, res.status(400).json({ error: 'Missing question instance ID' })];
                    }
                    // Validate question type if provided
                    if (updateData.questionType) {
                        validQuestionTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'SHORT_ANSWER', 'LONG_ANSWER'];
                        if (!validQuestionTypes.includes(updateData.questionType)) {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'Invalid question type. Must be one of: MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK, SHORT_ANSWER, LONG_ANSWER'
                                })];
                        }
                    }
                    // Validate difficulty if provided
                    if (updateData.difficulty) {
                        validDifficulties = ['EASY', 'MEDIUM', 'HARD'];
                        if (!validDifficulties.includes(updateData.difficulty)) {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'Invalid difficulty. Must be one of: EASY, MEDIUM, HARD'
                                })];
                        }
                    }
                    updatedQuestion = __assign(__assign({ id: id }, updateData), { updatedAt: new Date() });
                    res.json({
                        success: true,
                        data: updatedQuestion
                    });
                }
                catch (error) {
                    console.error('Error updating question instance:', error);
                    res.status(500).json({ error: 'Failed to update question instance' });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * DELETE /api/question-instance/:id
     * Delete a question instance
     */
    QuestionInstanceController.prototype.deleteQuestionInstance = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, id;
            var _a;
            return __generator(this, function (_b) {
                try {
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                    }
                    id = req.params.id;
                    if (!id) {
                        return [2 /*return*/, res.status(400).json({ error: 'Missing question instance ID' })];
                    }
                    // This would need to be implemented in the service
                    // await questionInstanceService.deleteQuestionInstance(id);
                    res.json({
                        success: true,
                        message: 'Question instance deleted successfully'
                    });
                }
                catch (error) {
                    console.error('Error deleting question instance:', error);
                    res.status(500).json({ error: 'Failed to delete question instance' });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * POST /api/question-instance/:id/attempt
     * Record a question attempt
     */
    QuestionInstanceController.prototype.recordQuestionAttempt = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, id, _a, userAnswer, timeSpent, confidence, isCorrect, score, feedback, attempt, error_3;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        id = req.params.id;
                        _a = req.body, userAnswer = _a.userAnswer, timeSpent = _a.timeSpent, confidence = _a.confidence, isCorrect = _a.isCorrect, score = _a.score, feedback = _a.feedback;
                        if (!id || !userAnswer || typeof isCorrect !== 'boolean') {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'Missing required fields: question ID, userAnswer, isCorrect'
                                })];
                        }
                        return [4 /*yield*/, questionInstance_service_1.questionInstanceService.recordQuestionAttempt({
                                questionInstanceId: parseInt(id),
                                userId: userId,
                                userAnswer: userAnswer,
                                timeSpent: timeSpent,
                                confidence: confidence,
                                isCorrect: isCorrect,
                                score: score,
                                feedback: feedback
                            })];
                    case 1:
                        attempt = _c.sent();
                        res.json({
                            success: true,
                            data: {
                                attemptId: attempt.id,
                                questionId: id,
                                isCorrect: attempt.isCorrect,
                                timeSpent: attempt.timeSpentSeconds,
                                recordedAt: attempt.createdAt
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _c.sent();
                        console.error('Error recording question attempt:', error_3);
                        res.status(500).json({ error: 'Failed to record question attempt' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/question-instance/criterion/:criterionId
     * Get questions by mastery criterion
     */
    QuestionInstanceController.prototype.getQuestionsByCriterion = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var criterionId, _a, difficulty, limit, offset, questions, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        criterionId = req.params.criterionId;
                        _a = req.query, difficulty = _a.difficulty, limit = _a.limit, offset = _a.offset;
                        if (!criterionId) {
                            return [2 /*return*/, res.status(400).json({ error: 'Missing criterion ID' })];
                        }
                        return [4 /*yield*/, questionInstance_service_1.questionInstanceService.getQuestionsByCriterion(parseInt(criterionId), {
                                difficulty: difficulty,
                                limit: limit ? parseInt(limit) : undefined,
                                offset: offset ? parseInt(offset) : undefined
                            })];
                    case 1:
                        questions = _b.sent();
                        res.json({
                            success: true,
                            data: {
                                criterionId: parseInt(criterionId),
                                questions: questions,
                                totalQuestions: questions.length,
                                filters: { difficulty: difficulty, limit: limit, offset: offset }
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _b.sent();
                        console.error('Error fetching questions by criterion:', error_4);
                        res.status(500).json({ error: 'Failed to fetch questions by criterion' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/question-instance/search
     * Search question instances
     */
    QuestionInstanceController.prototype.searchQuestionInstances = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, query, difficulty, masteryCriterionId, userId, limit, offset, questions, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = req.query, query = _a.q, difficulty = _a.difficulty, masteryCriterionId = _a.masteryCriterionId, userId = _a.userId, limit = _a.limit, offset = _a.offset;
                        if (!query) {
                            return [2 /*return*/, res.status(400).json({ error: 'Missing search query' })];
                        }
                        return [4 /*yield*/, questionInstance_service_1.questionInstanceService.searchQuestionInstances(query, {
                                difficulty: difficulty,
                                masteryCriterionId: masteryCriterionId ? parseInt(masteryCriterionId) : undefined,
                                userId: userId ? parseInt(userId) : undefined,
                                limit: limit ? parseInt(limit) : undefined,
                                offset: offset ? parseInt(offset) : undefined
                            })];
                    case 1:
                        questions = _b.sent();
                        res.json({
                            success: true,
                            data: {
                                query: query,
                                questions: questions,
                                totalResults: questions.length,
                                filters: { difficulty: difficulty, masteryCriterionId: masteryCriterionId, userId: userId, limit: limit, offset: offset }
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _b.sent();
                        console.error('Error searching question instances:', error_5);
                        res.status(500).json({ error: 'Failed to search question instances' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/question-instance/recommendations
     * Get question recommendations for a user
     */
    QuestionInstanceController.prototype.getQuestionRecommendations = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, _a, difficulty, masteryCriterionId, excludeAnswered, limit, recommendations, error_6;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        _a = req.query, difficulty = _a.difficulty, masteryCriterionId = _a.masteryCriterionId, excludeAnswered = _a.excludeAnswered, limit = _a.limit;
                        return [4 /*yield*/, questionInstance_service_1.questionInstanceService.getQuestionRecommendations(userId, {
                                difficulty: difficulty,
                                masteryCriterionId: masteryCriterionId ? parseInt(masteryCriterionId) : undefined,
                                excludeAnswered: excludeAnswered === 'true',
                                limit: limit ? parseInt(limit) : undefined
                            })];
                    case 1:
                        recommendations = _c.sent();
                        res.json({
                            success: true,
                            data: {
                                userId: userId,
                                recommendations: recommendations,
                                totalRecommendations: recommendations.length,
                                filters: { difficulty: difficulty, masteryCriterionId: masteryCriterionId, excludeAnswered: excludeAnswered, limit: limit }
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _c.sent();
                        console.error('Error getting question recommendations:', error_6);
                        res.status(500).json({ error: 'Failed to get question recommendations' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/question-instance/user/:userId/stats
     * Get user question statistics
     */
    QuestionInstanceController.prototype.getUserQuestionStats = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, stats, error_7;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, questionInstance_service_1.questionInstanceService.getUserQuestionStats(userId)];
                    case 1:
                        stats = _b.sent();
                        res.json({
                            success: true,
                            data: {
                                userId: userId,
                                stats: stats,
                                generatedAt: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _b.sent();
                        console.error('Error getting user question stats:', error_7);
                        res.status(500).json({ error: 'Failed to get user question stats' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/question-instance/batch-attempt
     * Record multiple question attempts in batch
     */
    QuestionInstanceController.prototype.recordBatchAttempts = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, attempts, result, error_8;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        attempts = req.body.attempts;
                        if (!Array.isArray(attempts) || attempts.length === 0) {
                            return [2 /*return*/, res.status(400).json({ error: 'Attempts array is required and must not be empty' })];
                        }
                        return [4 /*yield*/, questionInstance_service_1.questionInstanceService.recordBatchAttempts(userId, attempts)];
                    case 1:
                        result = _b.sent();
                        res.json({
                            success: true,
                            data: __assign(__assign({ userId: userId }, result), { timestamp: new Date().toISOString() })
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _b.sent();
                        console.error('Error recording batch attempts:', error_8);
                        res.status(500).json({ error: 'Failed to record batch attempts' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================================================
    // HELPER METHODS
    // ============================================================================
    /**
     * Calculate next review date based on attempt performance
     */
    QuestionInstanceController.prototype.calculateNextReviewDate = function (isCorrect, confidence) {
        var now = new Date();
        // Spaced repetition algorithm
        var daysToAdd = 1;
        if (isCorrect && confidence >= 4) {
            daysToAdd = 7; // High confidence correct answer
        }
        else if (isCorrect && confidence >= 2) {
            daysToAdd = 3; // Medium confidence correct answer
        }
        else if (isCorrect) {
            daysToAdd = 2; // Low confidence correct answer
        }
        else {
            daysToAdd = 1; // Incorrect answer - review soon
        }
        var nextReview = new Date(now);
        nextReview.setDate(nextReview.getDate() + daysToAdd);
        return nextReview;
    };
    return QuestionInstanceController;
}());
exports.QuestionInstanceController = QuestionInstanceController;
// Export controller instance
exports.questionInstanceController = new QuestionInstanceController();
