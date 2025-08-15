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
exports.enhancedTodaysTasksController = exports.EnhancedTodaysTasksController = void 0;
var enhancedTodaysTasks_service_1 = require("../../services/enhancedTodaysTasks.service");
var enhancedTodaysTasksService = new enhancedTodaysTasks_service_1.EnhancedTodaysTasksService();
// ============================================================================
// ENHANCED TODAY'S TASKS CONTROLLER
// ============================================================================
// 🆕 NEW ARCHITECTURE - Uses section-based logic instead of primitive-based
// ============================================================================
var EnhancedTodaysTasksController = /** @class */ (function () {
    function EnhancedTodaysTasksController() {
    }
    /**
     * GET /api/enhanced-todays-tasks
     * Generate today's tasks using section-based organization
     */
    EnhancedTodaysTasksController.prototype.getTodaysTasks = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, mockTodayQuery, mockTodayDate, parsedDate, todaysTasks, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!req.user || typeof req.user.userId !== 'number') {
                            res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
                            return [2 /*return*/];
                        }
                        userId = req.user.userId;
                        mockTodayQuery = req.query.mockToday;
                        mockTodayDate = undefined;
                        if (mockTodayQuery) {
                            parsedDate = new Date(mockTodayQuery);
                            if (!isNaN(parsedDate.getTime())) {
                                mockTodayDate = parsedDate;
                            }
                        }
                        return [4 /*yield*/, enhancedTodaysTasksService.generateTodaysTasksForUser(userId)];
                    case 1:
                        todaysTasks = _a.sent();
                        response = {
                            success: true,
                            data: {
                                tasks: __spreadArray(__spreadArray(__spreadArray([], todaysTasks.critical.tasks.map(function (task) { return (__assign(__assign({}, task), { bucket: 'critical' })); }), true), todaysTasks.core.tasks.map(function (task) { return (__assign(__assign({}, task), { bucket: 'core' })); }), true), todaysTasks.plus.tasks.map(function (task) { return (__assign(__assign({}, task), { bucket: 'plus' })); }), true),
                                totalTasks: todaysTasks.totalTasks,
                                bucketDistribution: {
                                    critical: todaysTasks.critical.count,
                                    core: todaysTasks.core.count,
                                    plus: todaysTasks.plus.count
                                },
                                capacityAnalysis: todaysTasks.capacityAnalysis,
                                recommendations: todaysTasks.recommendations,
                                estimatedTime: todaysTasks.estimatedTime,
                                generatedAt: new Date().toISOString()
                            }
                        };
                        res.status(200).json(response);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error in getTodaysTasks:', error_1);
                        res.status(500).json({ success: false, error: 'Failed to retrieve daily tasks', details: error_1 instanceof Error ? error_1.message : 'Unknown error' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/enhanced-todays-tasks/capacity-analysis
     * Get capacity analysis for today's tasks
     */
    EnhancedTodaysTasksController.prototype.getCapacityAnalysis = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, capacityAnalysis, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!req.user || typeof req.user.userId !== 'number') {
                            res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
                            return [2 /*return*/];
                        }
                        userId = req.user.userId;
                        return [4 /*yield*/, enhancedTodaysTasksService.getUserCapacityAnalysis(userId)];
                    case 1:
                        capacityAnalysis = _a.sent();
                        res.status(200).json({
                            success: true,
                            data: {
                                userId: userId,
                                capacityAnalysis: capacityAnalysis,
                                generatedAt: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error in getCapacityAnalysis:', error_2);
                        res.status(500).json({ success: false, error: 'Failed to retrieve capacity analysis', details: error_2 instanceof Error ? error_2.message : 'Unknown error' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/enhanced-todays-tasks/complete
     * Mark a task as completed
     */
    EnhancedTodaysTasksController.prototype.completeTask = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, taskId, _a, completionTime, performance_1, notes, completionResult, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        if (!req.user || typeof req.user.userId !== 'number') {
                            res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
                            return [2 /*return*/];
                        }
                        userId = req.user.userId;
                        taskId = req.params.taskId;
                        _a = req.body, completionTime = _a.completionTime, performance_1 = _a.performance, notes = _a.notes;
                        if (!taskId) {
                            res.status(400).json({ message: 'Task ID is required.' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, enhancedTodaysTasksService.completeTask(userId, taskId, {
                                completionTime: completionTime || new Date(),
                                performance: performance_1 || 1.0,
                                notes: notes || ''
                            })];
                    case 1:
                        completionResult = _b.sent();
                        res.status(200).json({
                            success: true,
                            data: {
                                taskId: taskId,
                                completionResult: completionResult,
                                completedAt: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _b.sent();
                        console.error('Error in completeTask:', error_3);
                        res.status(500).json({ success: false, error: 'Failed to complete task', details: error_3 instanceof Error ? error_3.message : 'Unknown error' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/enhanced-todays-tasks/progress
     * Get today's task progress
     */
    EnhancedTodaysTasksController.prototype.getTaskProgress = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, progress, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!req.user || typeof req.user.userId !== 'number') {
                            res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
                            return [2 /*return*/];
                        }
                        userId = req.user.userId;
                        return [4 /*yield*/, enhancedTodaysTasksService.getTodaysTaskProgress(userId)];
                    case 1:
                        progress = _a.sent();
                        res.status(200).json({
                            success: true,
                            data: {
                                userId: userId,
                                progress: progress,
                                generatedAt: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Error in getTaskProgress:', error_4);
                        res.status(500).json({ success: false, error: 'Failed to retrieve task progress', details: error_4 instanceof Error ? error_4.message : 'Unknown error' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/enhanced-todays-tasks/prioritize
     * Reprioritize today's tasks
     */
    EnhancedTodaysTasksController.prototype.prioritizeTasks = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, _a, priorityOrder, focusAreas, timeConstraints, reprioritizedTasks, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        if (!req.user || typeof req.user.userId !== 'number') {
                            res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
                            return [2 /*return*/];
                        }
                        userId = req.user.userId;
                        _a = req.body, priorityOrder = _a.priorityOrder, focusAreas = _a.focusAreas, timeConstraints = _a.timeConstraints;
                        if (!priorityOrder || !Array.isArray(priorityOrder)) {
                            res.status(400).json({ message: 'Priority order array is required.' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, enhancedTodaysTasksService.reprioritizeTasks(userId, {
                                priorityOrder: priorityOrder,
                                focusAreas: focusAreas || [],
                                timeConstraints: timeConstraints || {}
                            })];
                    case 1:
                        reprioritizedTasks = _b.sent();
                        res.status(200).json({
                            success: true,
                            data: {
                                userId: userId,
                                reprioritizedTasks: reprioritizedTasks,
                                prioritizedAt: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _b.sent();
                        console.error('Error in prioritizeTasks:', error_5);
                        res.status(500).json({ success: false, error: 'Failed to prioritize tasks', details: error_5 instanceof Error ? error_5.message : 'Unknown error' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/enhanced-todays-tasks/recommendations
     * Get personalized task recommendations
     */
    EnhancedTodaysTasksController.prototype.getTaskRecommendations = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, _a, _b, focus_1, _c, difficulty, timeAvailable, recommendations, error_6;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        if (!req.user || typeof req.user.userId !== 'number') {
                            res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
                            return [2 /*return*/];
                        }
                        userId = req.user.userId;
                        _a = req.query, _b = _a.focus, focus_1 = _b === void 0 ? 'all' : _b, _c = _a.difficulty, difficulty = _c === void 0 ? 'all' : _c, timeAvailable = _a.timeAvailable;
                        return [4 /*yield*/, enhancedTodaysTasksService.getPersonalizedRecommendations(userId, {
                                focus: focus_1,
                                difficulty: difficulty,
                                timeAvailable: timeAvailable ? parseInt(timeAvailable) : undefined
                            })];
                    case 1:
                        recommendations = _d.sent();
                        res.status(200).json({
                            success: true,
                            data: {
                                userId: userId,
                                recommendations: recommendations,
                                filters: {
                                    focus: focus_1,
                                    difficulty: difficulty,
                                    timeAvailable: timeAvailable ? parseInt(timeAvailable) : 'unlimited'
                                },
                                generatedAt: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _d.sent();
                        console.error('Error in getTaskRecommendations:', error_6);
                        res.status(500).json({ success: false, error: 'Failed to retrieve task recommendations', details: error_6 instanceof Error ? error_6.message : 'Unknown error' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/enhanced-todays-tasks/analytics
     * Get task completion analytics
     */
    EnhancedTodaysTasksController.prototype.getTaskAnalytics = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, _a, _b, period, _c, includeDetails, analytics, error_7;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        if (!req.user || typeof req.user.userId !== 'number') {
                            res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
                            return [2 /*return*/];
                        }
                        userId = req.user.userId;
                        _a = req.query, _b = _a.period, period = _b === void 0 ? 'week' : _b, _c = _a.includeDetails, includeDetails = _c === void 0 ? false : _c;
                        return [4 /*yield*/, enhancedTodaysTasksService.getTaskAnalytics(userId, {
                                period: period,
                                includeDetails: includeDetails === 'true'
                            })];
                    case 1:
                        analytics = _d.sent();
                        res.status(200).json({
                            success: true,
                            data: {
                                userId: userId,
                                analytics: analytics,
                                period: period,
                                generatedAt: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _d.sent();
                        console.error('Error in getTaskAnalytics:', error_7);
                        res.status(500).json({ success: false, error: 'Failed to retrieve task analytics', details: error_7 instanceof Error ? error_7.message : 'Unknown error' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/enhanced-todays-tasks/skip
     * Skip a task for today
     */
    EnhancedTodaysTasksController.prototype.skipTask = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, _a, taskId, reason, rescheduleFor, skipResult, error_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        if (!req.user || typeof req.user.userId !== 'number') {
                            res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
                            return [2 /*return*/];
                        }
                        userId = req.user.userId;
                        _a = req.body, taskId = _a.taskId, reason = _a.reason, rescheduleFor = _a.rescheduleFor;
                        if (!taskId) {
                            res.status(400).json({ message: 'Task ID is required.' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, enhancedTodaysTasksService.skipTask(userId, taskId, {
                                reason: reason || 'User choice',
                                rescheduleFor: rescheduleFor || new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to tomorrow
                            })];
                    case 1:
                        skipResult = _b.sent();
                        res.status(200).json({
                            success: true,
                            data: {
                                taskId: taskId,
                                skipResult: skipResult,
                                skippedAt: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _b.sent();
                        console.error('Error in skipTask:', error_8);
                        res.status(500).json({ success: false, error: 'Failed to skip task', details: error_8 instanceof Error ? error_8.message : 'Unknown error' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/enhanced-todays-tasks/upcoming
     * Get upcoming tasks for the next few days
     */
    EnhancedTodaysTasksController.prototype.getUpcomingTasks = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, _a, _b, days, _c, includeCompleted, upcomingTasks, error_9;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        if (!req.user || typeof req.user.userId !== 'number') {
                            res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
                            return [2 /*return*/];
                        }
                        userId = req.user.userId;
                        _a = req.query, _b = _a.days, days = _b === void 0 ? 7 : _b, _c = _a.includeCompleted, includeCompleted = _c === void 0 ? false : _c;
                        return [4 /*yield*/, enhancedTodaysTasksService.getUpcomingTasks(userId, {
                                days: parseInt(days),
                                includeCompleted: includeCompleted === 'true'
                            })];
                    case 1:
                        upcomingTasks = _d.sent();
                        res.status(200).json({
                            success: true,
                            data: {
                                userId: userId,
                                upcomingTasks: upcomingTasks,
                                days: parseInt(days),
                                generatedAt: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_9 = _d.sent();
                        console.error('Error in getUpcomingTasks:', error_9);
                        res.status(500).json({ success: false, error: 'Failed to retrieve upcoming tasks', details: error_9 instanceof Error ? error_9.message : 'Unknown error' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/enhanced-todays-tasks/batch-complete
     * Complete multiple tasks in batch
     */
    EnhancedTodaysTasksController.prototype.batchCompleteTasks = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, _a, taskIds, completionData, completionResults, error_10;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        if (!req.user || typeof req.user.userId !== 'number') {
                            res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
                            return [2 /*return*/];
                        }
                        userId = req.user.userId;
                        _a = req.body, taskIds = _a.taskIds, completionData = _a.completionData;
                        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
                            res.status(400).json({ message: 'Task IDs array is required and must not be empty.' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, enhancedTodaysTasksService.batchCompleteTasks(userId, taskIds, completionData || {})];
                    case 1:
                        completionResults = _b.sent();
                        res.status(200).json({
                            success: true,
                            data: {
                                userId: userId,
                                completionResults: completionResults,
                                completedAt: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_10 = _b.sent();
                        console.error('Error in batchCompleteTasks:', error_10);
                        res.status(500).json({ success: false, error: 'Failed to complete tasks in batch', details: error_10 instanceof Error ? error_10.message : 'Unknown error' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/enhanced-todays-tasks/streak
     * Get user's task completion streak
     */
    EnhancedTodaysTasksController.prototype.getCompletionStreak = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, streak, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!req.user || typeof req.user.userId !== 'number') {
                            res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
                            return [2 /*return*/];
                        }
                        userId = req.user.userId;
                        return [4 /*yield*/, enhancedTodaysTasksService.getCompletionStreak(userId)];
                    case 1:
                        streak = _a.sent();
                        res.status(200).json({
                            success: true,
                            data: {
                                userId: userId,
                                streak: streak,
                                generatedAt: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_11 = _a.sent();
                        console.error('Error in getCompletionStreak:', error_11);
                        res.status(500).json({ success: false, error: 'Failed to retrieve completion streak', details: error_11 instanceof Error ? error_11.message : 'Unknown error' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return EnhancedTodaysTasksController;
}());
exports.EnhancedTodaysTasksController = EnhancedTodaysTasksController;
// Export controller instance
exports.enhancedTodaysTasksController = new EnhancedTodaysTasksController();
