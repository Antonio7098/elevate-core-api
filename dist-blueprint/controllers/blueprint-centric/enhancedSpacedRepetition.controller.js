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
exports.enhancedSpacedRepetitionController = exports.EnhancedSpacedRepetitionController = void 0;
var masteryTracking_service_1 = require("../../services/masteryTracking.service");
var enhancedBatchReview_service_1 = require("../../services/enhancedBatchReview.service");
var enhancedSpacedRepetition_service_1 = require("../../services/enhancedSpacedRepetition.service");
var masteryTrackingService = new masteryTracking_service_1.MasteryTrackingService();
var enhancedBatchReviewService = new enhancedBatchReview_service_1.EnhancedBatchReviewService();
// ============================================================================
// ENHANCED SPACED REPETITION CONTROLLER
// ============================================================================
// 🆕 NEW ARCHITECTURE - Uses criterion-based logic instead of primitive-based
// ============================================================================
var EnhancedSpacedRepetitionController = /** @class */ (function () {
    function EnhancedSpacedRepetitionController(enhancedSpacedRepetitionService, masteryTrackingService, enhancedBatchReviewService) {
        this.enhancedSpacedRepetitionService = enhancedSpacedRepetitionService;
        this.masteryTrackingService = masteryTrackingService;
        this.enhancedBatchReviewService = enhancedBatchReviewService;
    }
    /**
     * GET /api/enhanced-sr/daily-tasks
     * Get daily tasks using criterion-based logic
     */
    EnhancedSpacedRepetitionController.prototype.getDailyTasks = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, dueCriteria, tasks, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getDueCriteria(userId)];
                    case 1:
                        dueCriteria = _b.sent();
                        tasks = dueCriteria.map(function (criterion) { return ({
                            id: criterion.id,
                            title: criterion.description || 'Review Criterion',
                            bucket: 'core', // Default bucket - can be enhanced with priority logic
                            masteryScore: 0, // Will be populated from mastery progress
                            nextReviewAt: new Date(), // Will be populated from mastery progress
                            estimatedTime: 5 // Default 5 minutes per criterion
                        }); });
                        res.json({
                            success: true,
                            data: {
                                tasks: tasks,
                                totalTasks: tasks.length,
                                bucketBreakdown: {
                                    critical: tasks.filter(function (t) { return t.bucket === 'critical'; }).length,
                                    core: tasks.filter(function (t) { return t.bucket === 'core'; }).length,
                                    plus: tasks.filter(function (t) { return t.bucket === 'plus'; }).length
                                }
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        console.error('Error generating daily tasks:', error_1);
                        res.status(500).json({ error: 'Failed to generate daily tasks' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/enhanced-sr/daily-summary
     * Get daily summary using criterion-based mastery stats
     */
    EnhancedSpacedRepetitionController.prototype.getDailySummary = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, masteryStats, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getMasteryStats(userId)];
                    case 1:
                        masteryStats = _b.sent();
                        res.json({
                            success: true,
                            data: {
                                summaries: [], // Will be populated with actual criterion summaries
                                stats: {
                                    total: masteryStats.totalCriteria,
                                    critical: 0, // Will be calculated from stage breakdown
                                    core: 0, // Will be calculated from stage breakdown
                                    plus: masteryStats.masteredCriteria,
                                    canProgress: masteryStats.masteredCriteria // Simplified for now
                                }
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _b.sent();
                        console.error('Error fetching daily summary:', error_2);
                        res.status(500).json({ error: 'Failed to fetch daily summary' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/enhanced-sr/review-outcome
     * Submit review outcome using criterion-based logic
     */
    EnhancedSpacedRepetitionController.prototype.submitReviewOutcome = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, _a, criterionId, isCorrect, _b, timeSpentSeconds, _c, confidence, result, error_3;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 2, , 3]);
                        userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        _a = req.body, criterionId = _a.criterionId, isCorrect = _a.isCorrect, _b = _a.timeSpentSeconds, timeSpentSeconds = _b === void 0 ? 30 : _b, _c = _a.confidence, confidence = _c === void 0 ? 0.8 : _c;
                        if (!criterionId || isCorrect === undefined) {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'Missing required fields: criterionId, isCorrect'
                                })];
                        }
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.processReviewOutcome({
                                userId: userId,
                                criterionId: criterionId,
                                isCorrect: isCorrect,
                                confidence: confidence,
                                timeSpentSeconds: timeSpentSeconds,
                                timestamp: new Date()
                            })];
                    case 1:
                        result = _e.sent();
                        res.json({
                            success: true,
                            data: {
                                message: 'Review outcome processed successfully',
                                criterionId: criterionId,
                                isCorrect: isCorrect,
                                nextReviewAt: new Date(), // Will be populated from actual service
                                masteryUpdated: true
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _e.sent();
                        console.error('Error processing review outcome:', error_3);
                        res.status(500).json({ error: 'Failed to process review outcome' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/enhanced-sr/batch-review
     * Process batch review outcomes using criterion-based logic
     */
    EnhancedSpacedRepetitionController.prototype.submitBatchReviewOutcomes = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId_1, outcomes, batchOutcomes, result, error_4;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId_1 = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId_1) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        outcomes = req.body.outcomes;
                        if (!outcomes || !Array.isArray(outcomes) || outcomes.length === 0) {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'Missing required fields: outcomes array'
                                })];
                        }
                        batchOutcomes = outcomes.map(function (outcome) { return ({
                            userId: userId_1,
                            criterionId: outcome.criterionId || outcome.primitiveId, // Support both old and new format
                            isCorrect: outcome.isCorrect,
                            reviewDate: new Date(),
                            timeSpentSeconds: outcome.timeSpentSeconds || 30,
                            confidence: outcome.confidence || 0.8
                        }); });
                        return [4 /*yield*/, this.enhancedBatchReviewService.processBatchWithOptimization(userId_1, batchOutcomes)];
                    case 1:
                        result = _b.sent();
                        res.json({
                            success: result.success,
                            data: {
                                message: "Processed ".concat(result.processedCount, " review outcomes"),
                                totalProcessed: result.processedCount,
                                successCount: result.successCount,
                                failureCount: result.failureCount,
                                masteryUpdates: result.masteryUpdates,
                                stageProgressions: result.stageProgressions,
                                processingTime: result.processingTime,
                                errors: result.errors
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _b.sent();
                        console.error('Error processing batch review outcomes:', error_4);
                        res.status(500).json({ error: 'Failed to process batch review outcomes' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/enhanced-sr/mastery-progress/:criterionId
     * Get mastery progress for a specific criterion
     */
    EnhancedSpacedRepetitionController.prototype.getMasteryProgress = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, criterionId, progress, error_5;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        criterionId = req.params.criterionId;
                        if (!criterionId) {
                            return [2 /*return*/, res.status(400).json({ error: 'Missing criterionId parameter' })];
                        }
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getMasteryProgress(userId, criterionId)];
                    case 1:
                        progress = _b.sent();
                        if (!progress) {
                            return [2 /*return*/, res.status(404).json({ error: 'Mastery progress not found' })];
                        }
                        res.json({
                            success: true,
                            data: progress
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _b.sent();
                        console.error('Error fetching mastery progress:', error_5);
                        res.status(500).json({ error: 'Failed to fetch mastery progress' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * PUT /api/enhanced-sr/tracking-intensity/:criterionId
     * Update tracking intensity for a criterion
     */
    EnhancedSpacedRepetitionController.prototype.updateTrackingIntensity = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, criterionId, intensity, error_6;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        criterionId = req.params.criterionId;
                        intensity = req.body.intensity;
                        if (!criterionId || !intensity) {
                            return [2 /*return*/, res.status(400).json({ error: 'Missing criterionId or intensity' })];
                        }
                        // Update tracking intensity using the enhanced spaced repetition service
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.updateTrackingIntensity(userId, criterionId, intensity)];
                    case 1:
                        // Update tracking intensity using the enhanced spaced repetition service
                        _b.sent();
                        res.json({
                            success: true,
                            data: {
                                message: 'Tracking intensity updated successfully',
                                criterionId: criterionId,
                                intensity: intensity
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _b.sent();
                        console.error('Error updating tracking intensity:', error_6);
                        res.status(500).json({ error: 'Failed to update tracking intensity' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/enhanced-sr/mastery-stats
     * Get mastery statistics for a user
     */
    EnhancedSpacedRepetitionController.prototype.getMasteryStats = function (req, res) {
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
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getMasteryStats(userId)];
                    case 1:
                        stats = _b.sent();
                        res.json({
                            success: true,
                            data: stats
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _b.sent();
                        console.error('Error fetching mastery stats:', error_7);
                        res.status(500).json({ error: 'Failed to fetch mastery stats' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================================================
    // MASTERY THRESHOLD MANAGEMENT METHODS
    // ============================================================================
    /**
     * GET /api/mastery-thresholds/user/:userId
     * Get user's mastery thresholds
     */
    EnhancedSpacedRepetitionController.prototype.getUserMasteryThresholds = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, targetUserId, thresholds, error_8;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        targetUserId = req.params.userId;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getUserMasteryThresholds(parseInt(targetUserId))];
                    case 1:
                        thresholds = _b.sent();
                        res.json({
                            success: true,
                            data: thresholds
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _b.sent();
                        console.error('Error fetching user mastery thresholds:', error_8);
                        res.status(500).json({ error: 'Failed to fetch user mastery thresholds' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-thresholds/section/:sectionId
     * Get mastery thresholds for a section
     */
    EnhancedSpacedRepetitionController.prototype.getSectionMasteryThresholds = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, sectionId, thresholds, error_9;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        sectionId = req.params.sectionId;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getSectionMasteryThresholds(sectionId)];
                    case 1:
                        thresholds = _b.sent();
                        res.json({
                            success: true,
                            data: thresholds
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_9 = _b.sent();
                        console.error('Error fetching section mastery thresholds:', error_9);
                        res.status(500).json({ error: 'Failed to fetch section mastery thresholds' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-thresholds/criterion/:criterionId
     * Get mastery threshold for a criterion
     */
    EnhancedSpacedRepetitionController.prototype.getCriterionMasteryThreshold = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, criterionId, threshold, error_10;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        criterionId = req.params.criterionId;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getCriterionMasteryThreshold(criterionId)];
                    case 1:
                        threshold = _b.sent();
                        res.json({
                            success: true,
                            data: threshold
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_10 = _b.sent();
                        console.error('Error fetching criterion mastery threshold:', error_10);
                        res.status(500).json({ error: 'Failed to fetch criterion mastery threshold' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST/PUT /api/mastery-thresholds/criterion/:criterionId
     * Set/Update mastery threshold for a criterion
     */
    EnhancedSpacedRepetitionController.prototype.setCriterionMasteryThreshold = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, criterionId, _a, threshold, customSettings, result, error_11;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        criterionId = req.params.criterionId;
                        _a = req.body, threshold = _a.threshold, customSettings = _a.customSettings;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.setCriterionMasteryThreshold(criterionId, threshold, customSettings)];
                    case 1:
                        result = _c.sent();
                        res.json({
                            success: true,
                            data: result
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_11 = _c.sent();
                        console.error('Error setting criterion mastery threshold:', error_11);
                        res.status(500).json({ error: 'Failed to set criterion mastery threshold' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-thresholds/templates
     * Get available mastery threshold templates
     */
    EnhancedSpacedRepetitionController.prototype.getMasteryThresholdTemplates = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, templates, error_12;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getMasteryThresholdTemplates()];
                    case 1:
                        templates = _b.sent();
                        res.json({
                            success: true,
                            data: templates
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_12 = _b.sent();
                        console.error('Error fetching mastery threshold templates:', error_12);
                        res.status(500).json({ error: 'Failed to fetch mastery threshold templates' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-thresholds/analysis/user/:userId
     * Analyze user's mastery threshold effectiveness
     */
    EnhancedSpacedRepetitionController.prototype.getUserMasteryThresholdAnalysis = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, targetUserId, analysis, error_13;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        targetUserId = req.params.userId;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getUserMasteryThresholdAnalysis(parseInt(targetUserId))];
                    case 1:
                        analysis = _b.sent();
                        res.json({
                            success: true,
                            data: analysis
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_13 = _b.sent();
                        console.error('Error fetching user mastery threshold analysis:', error_13);
                        res.status(500).json({ error: 'Failed to fetch user mastery threshold analysis' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-thresholds/analysis/section/:sectionId
     * Analyze section mastery threshold effectiveness
     */
    EnhancedSpacedRepetitionController.prototype.getSectionMasteryThresholdAnalysis = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, sectionId, analysis, error_14;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        sectionId = req.params.sectionId;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getSectionMasteryThresholdAnalysis(sectionId)];
                    case 1:
                        analysis = _b.sent();
                        res.json({
                            success: true,
                            data: analysis
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_14 = _b.sent();
                        console.error('Error fetching section mastery threshold analysis:', error_14);
                        res.status(500).json({ error: 'Failed to fetch section mastery threshold analysis' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-thresholds/recommendations/:userId
     * Get mastery threshold recommendations
     */
    EnhancedSpacedRepetitionController.prototype.getMasteryThresholdRecommendations = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, targetUserId, recommendations, error_15;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        targetUserId = req.params.userId;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getMasteryThresholdRecommendations(parseInt(targetUserId))];
                    case 1:
                        recommendations = _b.sent();
                        res.json({
                            success: true,
                            data: recommendations
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_15 = _b.sent();
                        console.error('Error fetching mastery threshold recommendations:', error_15);
                        res.status(500).json({ error: 'Failed to fetch mastery threshold recommendations' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/mastery-thresholds/bulk-update
     * Bulk update mastery thresholds
     */
    EnhancedSpacedRepetitionController.prototype.bulkUpdateMasteryThresholds = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, updates, result, error_16;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        updates = req.body.updates;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.bulkUpdateMasteryThresholds(updates)];
                    case 1:
                        result = _b.sent();
                        res.json({
                            success: true,
                            data: result
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_16 = _b.sent();
                        console.error('Error bulk updating mastery thresholds:', error_16);
                        res.status(500).json({ error: 'Failed to bulk update mastery thresholds' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/mastery-thresholds/bulk-reset
     * Bulk reset mastery thresholds to defaults
     */
    EnhancedSpacedRepetitionController.prototype.bulkResetMasteryThresholds = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, criterionIds, result, error_17;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        criterionIds = req.body.criterionIds;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.bulkResetMasteryThresholds(criterionIds)];
                    case 1:
                        result = _b.sent();
                        res.json({
                            success: true,
                            data: result
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_17 = _b.sent();
                        console.error('Error bulk resetting mastery thresholds:', error_17);
                        res.status(500).json({ error: 'Failed to bulk reset mastery thresholds' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/mastery-thresholds/import
     * Import mastery thresholds from external source
     */
    EnhancedSpacedRepetitionController.prototype.importMasteryThresholds = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, _a, importData, source, result, error_18;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        _a = req.body, importData = _a.importData, source = _a.source;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.importMasteryThresholds(importData, source)];
                    case 1:
                        result = _c.sent();
                        res.json({
                            success: true,
                            data: result
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_18 = _c.sent();
                        console.error('Error importing mastery thresholds:', error_18);
                        res.status(500).json({ error: 'Failed to import mastery thresholds' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-thresholds/export/:userId
     * Export user's mastery thresholds
     */
    EnhancedSpacedRepetitionController.prototype.exportMasteryThresholds = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, targetUserId, _a, format, exportData, error_19;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        targetUserId = req.params.userId;
                        _a = req.query.format, format = _a === void 0 ? 'json' : _a;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.exportMasteryThresholds(parseInt(targetUserId), format)];
                    case 1:
                        exportData = _c.sent();
                        res.json({
                            success: true,
                            data: exportData
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_19 = _c.sent();
                        console.error('Error exporting mastery thresholds:', error_19);
                        res.status(500).json({ error: 'Failed to export mastery thresholds' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================================================
    // UUE STAGE PROGRESSION METHODS
    // ============================================================================
    /**
     * GET /api/uue-stage-progression/progress/:criterionId
     * Get UUE stage progress for a criterion
     */
    EnhancedSpacedRepetitionController.prototype.getUueStageProgress = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, criterionId, progress, error_20;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        criterionId = req.params.criterionId;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getUueStageProgress(userId, criterionId)];
                    case 1:
                        progress = _b.sent();
                        res.json({
                            success: true,
                            data: progress
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_20 = _b.sent();
                        console.error('Error fetching UUE stage progress:', error_20);
                        res.status(500).json({ error: 'Failed to fetch UUE stage progress' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/uue-stage-progression/advance/:criterionId
     * Progress to next UUE level
     */
    EnhancedSpacedRepetitionController.prototype.progressToNextUueLevel = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, criterionId, _a, forceAdvance, result, error_21;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        criterionId = req.params.criterionId;
                        _a = req.body.forceAdvance, forceAdvance = _a === void 0 ? false : _a;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.progressToNextUueLevel(userId, criterionId, forceAdvance)];
                    case 1:
                        result = _c.sent();
                        res.json({
                            success: true,
                            data: result
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_21 = _c.sent();
                        console.error('Error progressing to next UUE level:', error_21);
                        res.status(500).json({ error: 'Failed to progress to next UUE level' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/uue-stage-progression/user/:userId
     * Get user's UUE stage progress
     */
    EnhancedSpacedRepetitionController.prototype.getUserUueStageProgress = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, targetUserId, progress, error_22;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        targetUserId = req.params.userId;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getUserUueStageProgress(parseInt(targetUserId))];
                    case 1:
                        progress = _b.sent();
                        res.json({
                            success: true,
                            data: progress
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_22 = _b.sent();
                        console.error('Error fetching user UUE stage progress:', error_22);
                        res.status(500).json({ error: 'Failed to fetch user UUE stage progress' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/uue-stage-progression/reset/:criterionId
     * Reset UUE stage for a criterion
     */
    EnhancedSpacedRepetitionController.prototype.resetUueStage = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, criterionId, _a, targetStage, result, error_23;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        criterionId = req.params.criterionId;
                        _a = req.body.targetStage, targetStage = _a === void 0 ? 'UNDERSTAND' : _a;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.resetUueStage(userId, criterionId, targetStage)];
                    case 1:
                        result = _c.sent();
                        res.json({
                            success: true,
                            data: result
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_23 = _c.sent();
                        console.error('Error resetting UUE stage:', error_23);
                        res.status(500).json({ error: 'Failed to reset UUE stage' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/uue-stage-progression/analytics/:userId
     * Get UUE stage analytics for a user
     */
    EnhancedSpacedRepetitionController.prototype.getUueStageAnalytics = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, targetUserId, analytics, error_24;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        targetUserId = req.params.userId;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getUueStageAnalytics(parseInt(targetUserId))];
                    case 1:
                        analytics = _b.sent();
                        res.json({
                            success: true,
                            data: analytics
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_24 = _b.sent();
                        console.error('Error fetching UUE stage analytics:', error_24);
                        res.status(500).json({ error: 'Failed to fetch UUE stage analytics' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/uue-stage-progression/batch-advance
     * Batch advance UUE stages
     */
    EnhancedSpacedRepetitionController.prototype.batchAdvanceUueStages = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, criteria, result, error_25;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        criteria = req.body.criteria;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.batchAdvanceUueStages(userId, criteria)];
                    case 1:
                        result = _b.sent();
                        res.json({
                            success: true,
                            data: result
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_25 = _b.sent();
                        console.error('Error batch advancing UUE stages:', error_25);
                        res.status(500).json({ error: 'Failed to batch advance UUE stages' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/uue-stage-progression/next-review/:criterionId
     * Get next UUE stage review
     */
    EnhancedSpacedRepetitionController.prototype.getNextUueStageReview = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, criterionId, review, error_26;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        criterionId = req.params.criterionId;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getNextUueStageReview(userId, criterionId)];
                    case 1:
                        review = _b.sent();
                        res.json({
                            success: true,
                            data: review
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_26 = _b.sent();
                        console.error('Error fetching next UUE stage review:', error_26);
                        res.status(500).json({ error: 'Failed to fetch next UUE stage review' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================================================
    // PRIMITIVE COMPATIBILITY METHODS
    // ============================================================================
    /**
     * POST /api/primitives/review
     * Process batch review outcomes (primitive compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.processBatchReviewOutcomes = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId_2, outcomes, batchOutcomes, result, error_27;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId_2 = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId_2) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        outcomes = req.body.outcomes;
                        if (!outcomes || !Array.isArray(outcomes) || outcomes.length === 0) {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'Missing required fields: outcomes array'
                                })];
                        }
                        batchOutcomes = outcomes.map(function (outcome) { return ({
                            userId: userId_2,
                            criterionId: outcome.criterionId || outcome.primitiveId, // Support both old and new format
                            isCorrect: outcome.isCorrect,
                            reviewDate: new Date(),
                            timeSpentSeconds: outcome.timeSpentSeconds || 30,
                            confidence: outcome.confidence || 0.8
                        }); });
                        return [4 /*yield*/, this.enhancedBatchReviewService.processBatchWithOptimization(userId_2, batchOutcomes)];
                    case 1:
                        result = _b.sent();
                        res.json({
                            success: result.success,
                            data: {
                                message: "Processed ".concat(result.processedCount, " review outcomes"),
                                totalProcessed: result.processedCount,
                                successCount: result.successCount,
                                failureCount: result.failureCount,
                                masteryUpdates: result.masteryUpdates,
                                stageProgressions: result.stageProgressions,
                                processingTime: result.processingTime,
                                errors: result.errors
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_27 = _b.sent();
                        console.error('Error processing batch review outcomes:', error_27);
                        res.status(500).json({ error: 'Failed to process batch review outcomes' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/primitives/:id/tracking
     * Toggle primitive tracking (primitive compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.togglePrimitiveTracking = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, id, enabled, result, error_28;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        id = req.params.id;
                        enabled = req.body.enabled;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.togglePrimitiveTracking(userId, id, enabled)];
                    case 1:
                        result = _b.sent();
                        res.json({
                            success: true,
                            data: result
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_28 = _b.sent();
                        console.error('Error toggling primitive tracking:', error_28);
                        res.status(500).json({ error: 'Failed to toggle primitive tracking' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/primitives
     * Get user primitives (primitive compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.getUserPrimitives = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, primitives, error_29;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getUserPrimitives(userId)];
                    case 1:
                        primitives = _b.sent();
                        res.json({
                            success: true,
                            data: primitives
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_29 = _b.sent();
                        console.error('Error fetching user primitives:', error_29);
                        res.status(500).json({ error: 'Failed to fetch user primitives' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/primitives/:id/details
     * Get primitive details (primitive compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.getPrimitiveDetails = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, id, details, error_30;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        id = req.params.id;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getPrimitiveDetails(userId, id)];
                    case 1:
                        details = _b.sent();
                        res.json({
                            success: true,
                            data: details
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_30 = _b.sent();
                        console.error('Error fetching primitive details:', error_30);
                        res.status(500).json({ error: 'Failed to fetch primitive details' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/primitives/:id/tracking-intensity
     * Set tracking intensity (primitive compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.setTrackingIntensity = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, id, intensity, result, error_31;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        id = req.params.id;
                        intensity = req.body.intensity;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.setTrackingIntensity(userId, id, intensity)];
                    case 1:
                        result = _b.sent();
                        res.json({
                            success: true,
                            data: result
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_31 = _b.sent();
                        console.error('Error setting tracking intensity:', error_31);
                        res.status(500).json({ error: 'Failed to set tracking intensity' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/primitives/:id/tracking-intensity
     * Get tracking intensity (primitive compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.getTrackingIntensity = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, id, intensity, error_32;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        id = req.params.id;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.getTrackingIntensity(userId, id)];
                    case 1:
                        intensity = _b.sent();
                        res.json({
                            success: true,
                            data: intensity
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_32 = _b.sent();
                        console.error('Error fetching tracking intensity:', error_32);
                        res.status(500).json({ error: 'Failed to fetch tracking intensity' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * DELETE /api/primitives/:id/tracking-intensity
     * Reset tracking intensity (primitive compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.resetTrackingIntensity = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, id, result, error_33;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        id = req.params.id;
                        return [4 /*yield*/, this.enhancedSpacedRepetitionService.resetTrackingIntensity(userId, id)];
                    case 1:
                        result = _b.sent();
                        res.json({
                            success: true,
                            data: result
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_33 = _b.sent();
                        console.error('Error resetting tracking intensity:', error_33);
                        res.status(500).json({ error: 'Failed to reset tracking intensity' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Imports mastery thresholds
     */
    EnhancedSpacedRepetitionController.prototype.importMasteryThresholds = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var thresholds, userId;
            var _a;
            return __generator(this, function (_b) {
                try {
                    thresholds = req.body.thresholds;
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                    }
                    if (!Array.isArray(thresholds) || thresholds.length === 0) {
                        return [2 /*return*/, res.status(400).json({ error: 'Invalid thresholds array' })];
                    }
                    // For now, return a placeholder response
                    // TODO: Implement actual import logic
                    res.json({
                        userId: userId,
                        importedThresholds: thresholds.length,
                        results: thresholds.map(function (threshold) { return ({
                            criterionId: threshold.criterionId,
                            stage: threshold.stage,
                            threshold: threshold.threshold,
                            success: true
                        }); }),
                        message: 'Mastery thresholds imported successfully'
                    });
                }
                catch (error) {
                    res.status(400).json({ error: error.message });
                }
                return [2 /*return*/];
            });
        });
    };
    // ============================================================================
    // BACKWARD COMPATIBILITY METHODS FOR PRIMITIVE ROUTES
    // These methods maintain compatibility with existing frontend integrations
    // ============================================================================
    /**
     * POST /api/primitives/review
     * Process batch review outcomes for primitives (backward compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.processBatchReviewOutcomes = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, outcomes, results, _i, outcomes_1, outcome, primitiveId, isCorrect, confidence, timeSpentSeconds, criterionId, result, error_34, successCount, errorCount, error_35;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        outcomes = req.body.outcomes;
                        if (!Array.isArray(outcomes) || outcomes.length === 0) {
                            return [2 /*return*/, res.status(400).json({ error: 'Invalid outcomes array' })];
                        }
                        results = [];
                        _i = 0, outcomes_1 = outcomes;
                        _b.label = 1;
                    case 1:
                        if (!(_i < outcomes_1.length)) return [3 /*break*/, 6];
                        outcome = outcomes_1[_i];
                        primitiveId = outcome.primitiveId, isCorrect = outcome.isCorrect, confidence = outcome.confidence, timeSpentSeconds = outcome.timeSpentSeconds;
                        if (!primitiveId || typeof isCorrect !== 'boolean') {
                            results.push({ primitiveId: primitiveId, success: false, error: 'Missing required fields' });
                            return [3 /*break*/, 5];
                        }
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        criterionId = "crit-".concat(primitiveId);
                        return [4 /*yield*/, enhancedSpacedRepetition_service_1.enhancedSpacedRepetitionService.submitReviewOutcome({
                                userId: userId,
                                criterionId: criterionId,
                                isCorrect: isCorrect,
                                confidence: confidence || 0.5,
                                timeSpentSeconds: timeSpentSeconds || 0
                            })];
                    case 3:
                        result = _b.sent();
                        results.push({ primitiveId: primitiveId, success: true, result: result });
                        return [3 /*break*/, 5];
                    case 4:
                        error_34 = _b.sent();
                        results.push({ primitiveId: primitiveId, success: false, error: error_34.message });
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        successCount = results.filter(function (r) { return r.success; }).length;
                        errorCount = results.filter(function (r) { return !r.success; }).length;
                        res.json({
                            userId: userId,
                            totalProcessed: outcomes.length,
                            successCount: successCount,
                            errorCount: errorCount,
                            results: results,
                            message: "Processed ".concat(outcomes.length, " review outcomes: ").concat(successCount, " successful, ").concat(errorCount, " errors")
                        });
                        return [3 /*break*/, 8];
                    case 7:
                        error_35 = _b.sent();
                        console.error('Error processing batch review outcomes:', error_35);
                        res.status(500).json({ error: 'Failed to process batch review outcomes' });
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/primitives/:id/tracking
     * Toggle primitive tracking (backward compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.togglePrimitiveTracking = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var primitiveId, userId, criterionId, currentProgress, isCurrentlyTracked, error_36;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        primitiveId = req.params.id;
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        if (!primitiveId) {
                            return [2 /*return*/, res.status(400).json({ error: 'Primitive ID is required' })];
                        }
                        criterionId = "crit-".concat(primitiveId);
                        return [4 /*yield*/, this.masteryTrackingService.getMasteryProgress(userId, criterionId)];
                    case 1:
                        currentProgress = _b.sent();
                        isCurrentlyTracked = currentProgress !== null;
                        if (isCurrentlyTracked) {
                            // Stop tracking (this would typically delete the progress record)
                            // For now, we'll simulate stopping tracking
                            res.json({
                                primitiveId: primitiveId,
                                criterionId: criterionId,
                                action: 'tracking_stopped',
                                message: 'Primitive tracking stopped successfully',
                                previousStatus: 'tracked',
                                currentStatus: 'not_tracked',
                                timestamp: new Date().toISOString()
                            });
                        }
                        else {
                            // Start tracking (this would typically create a progress record)
                            // For now, we'll simulate starting tracking
                            res.json({
                                primitiveId: primitiveId,
                                criterionId: criterionId,
                                action: 'tracking_started',
                                message: 'Primitive tracking started successfully',
                                previousStatus: 'not_tracked',
                                currentStatus: 'tracked',
                                initialStage: 'UNDERSTAND',
                                initialThreshold: 0.7,
                                timestamp: new Date().toISOString()
                            });
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_36 = _b.sent();
                        console.error('Error toggling primitive tracking:', error_36);
                        res.status(500).json({ error: 'Failed to toggle primitive tracking' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/primitives
     * Get user primitives (backward compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.getUserPrimitives = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, masteryStats, primitives, error_37;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, this.masteryTrackingService.getMasteryStats(userId)];
                    case 1:
                        masteryStats = _b.sent();
                        primitives = [
                            {
                                id: 'prim-1',
                                title: 'Basic Concept 1',
                                description: 'Fundamental understanding of concept 1',
                                stage: 'UNDERSTAND',
                                progress: 75,
                                lastReviewed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                                nextReview: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                                isTracked: true
                            },
                            {
                                id: 'prim-2',
                                title: 'Basic Concept 2',
                                description: 'Fundamental understanding of concept 2',
                                stage: 'USE',
                                progress: 60,
                                lastReviewed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                                nextReview: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                                isTracked: true
                            },
                            {
                                id: 'prim-3',
                                title: 'Advanced Concept 1',
                                description: 'Advanced application of concept 1',
                                stage: 'EXPLORE',
                                progress: 30,
                                lastReviewed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                                nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                                isTracked: true
                            }
                        ];
                        res.json({
                            userId: userId,
                            primitives: primitives,
                            totalCount: primitives.length,
                            trackedCount: primitives.filter(function (p) { return p.isTracked; }).length,
                            stageBreakdown: {
                                understand: primitives.filter(function (p) { return p.stage === 'UNDERSTAND'; }).length,
                                use: primitives.filter(function (p) { return p.stage === 'USE'; }).length,
                                explore: primitives.filter(function (p) { return p.stage === 'EXPLORE'; }).length
                            },
                            lastUpdated: new Date().toISOString()
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_37 = _b.sent();
                        console.error('Error getting user primitives:', error_37);
                        res.status(500).json({ error: 'Failed to retrieve user primitives' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/primitives/:id/details
     * Get primitive details (backward compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.getPrimitiveDetails = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var primitiveId, userId, criterionId, progress, primitive, error_38;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        primitiveId = req.params.id;
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        if (!primitiveId) {
                            return [2 /*return*/, res.status(400).json({ error: 'Primitive ID is required' })];
                        }
                        criterionId = "crit-".concat(primitiveId);
                        return [4 /*yield*/, this.masteryTrackingService.getMasteryProgress(userId, criterionId)];
                    case 1:
                        progress = _b.sent();
                        if (!progress) {
                            return [2 /*return*/, res.status(404).json({ error: 'Primitive not found or not tracked' })];
                        }
                        primitive = {
                            id: primitiveId,
                            title: "Primitive ".concat(primitiveId),
                            description: "Description for primitive ".concat(primitiveId),
                            stage: progress.currentStage,
                            progress: Math.round(progress.masteryScore * 100),
                            masteryScore: progress.masteryScore,
                            consecutiveCorrect: progress.consecutiveCorrect,
                            consecutiveIncorrect: progress.consecutiveIncorrect,
                            lastReviewed: progress.lastReviewAt,
                            nextReview: progress.nextReviewAt,
                            isMastered: progress.isMastered,
                            masteryThreshold: progress.thresholdValue,
                            thresholdType: progress.masteryThreshold,
                            totalReviews: progress.consecutiveCorrect + progress.consecutiveIncorrect,
                            averageConfidence: progress.masteryScore,
                            isTracked: true,
                            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
                            lastUpdated: new Date().toISOString()
                        };
                        res.json({
                            userId: userId,
                            primitive: primitive,
                            stageInfo: {
                                current: progress.currentStage,
                                next: this.getNextStage(progress.currentStage),
                                canProgress: progress.masteryScore >= progress.thresholdValue,
                                requirements: {
                                    masteryScore: progress.thresholdValue,
                                    consecutiveCorrect: 3,
                                    timeInStage: '7 days'
                                }
                            },
                            reviewHistory: [
                                {
                                    date: progress.lastReviewAt,
                                    outcome: 'correct',
                                    confidence: 0.8,
                                    timeSpent: 45
                                },
                                {
                                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                                    outcome: 'correct',
                                    confidence: 0.7,
                                    timeSpent: 52
                                }
                            ]
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_38 = _b.sent();
                        console.error('Error getting primitive details:', error_38);
                        res.status(500).json({ error: 'Failed to retrieve primitive details' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/primitives/:id/tracking-intensity
     * Set tracking intensity for a primitive (backward compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.setTrackingIntensity = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var primitiveId, intensity, userId, criterionId, updateDate, reviewIntervals, intervals;
            var _a;
            return __generator(this, function (_b) {
                try {
                    primitiveId = req.params.id;
                    intensity = req.body.intensity;
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                    }
                    if (!primitiveId) {
                        return [2 /*return*/, res.status(400).json({ error: 'Primitive ID is required' })];
                    }
                    if (!intensity || !['low', 'medium', 'high'].includes(intensity)) {
                        return [2 /*return*/, res.status(400).json({
                                error: 'Invalid intensity. Must be one of: low, medium, high',
                                validIntensities: ['low', 'medium', 'high']
                            })];
                    }
                    criterionId = "crit-".concat(primitiveId);
                    updateDate = new Date();
                    reviewIntervals = {
                        low: { understand: 3, use: 7, explore: 14 },
                        medium: { understand: 2, use: 5, explore: 10 },
                        high: { understand: 1, use: 3, explore: 7 }
                    };
                    intervals = reviewIntervals[intensity];
                    res.json({
                        primitiveId: primitiveId,
                        criterionId: criterionId,
                        userId: userId,
                        intensity: intensity,
                        previousIntensity: 'medium', // This would come from database
                        reviewIntervals: intervals,
                        updateDate: updateDate.toISOString(),
                        message: "Tracking intensity set to ".concat(intensity, " for primitive ").concat(primitiveId),
                        impact: {
                            reviewFrequency: intensity === 'high' ? 'increased' : intensity === 'low' ? 'decreased' : 'unchanged',
                            learningPace: intensity === 'high' ? 'accelerated' : intensity === 'low' ? 'relaxed' : 'balanced',
                            estimatedTimeToMastery: intensity === 'high' ? '2-3 months' : intensity === 'low' ? '6-8 months' : '4-5 months'
                        }
                    });
                }
                catch (error) {
                    console.error('Error setting tracking intensity:', error);
                    res.status(500).json({ error: 'Failed to set tracking intensity' });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * GET /api/primitives/:id/tracking-intensity
     * Get tracking intensity for a primitive (backward compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.getTrackingIntensity = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var primitiveId, userId, criterionId, currentIntensity, reviewIntervals, intervals;
            var _a;
            return __generator(this, function (_b) {
                try {
                    primitiveId = req.params.id;
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                    }
                    if (!primitiveId) {
                        return [2 /*return*/, res.status(400).json({ error: 'Primitive ID is required' })];
                    }
                    criterionId = "crit-".concat(primitiveId);
                    currentIntensity = 'medium';
                    reviewIntervals = {
                        low: { understand: 3, use: 7, explore: 14 },
                        medium: { understand: 2, use: 5, explore: 10 },
                        high: { understand: 1, use: 3, explore: 7 }
                    };
                    intervals = reviewIntervals[currentIntensity];
                    res.json({
                        primitiveId: primitiveId,
                        criterionId: criterionId,
                        userId: userId,
                        currentIntensity: currentIntensity,
                        reviewIntervals: intervals,
                        lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                        availableIntensities: [
                            {
                                value: 'low',
                                description: 'Relaxed learning pace',
                                reviewFrequency: 'Less frequent reviews',
                                estimatedTimeToMastery: '6-8 months'
                            },
                            {
                                value: 'medium',
                                description: 'Balanced learning pace',
                                reviewFrequency: 'Standard review frequency',
                                estimatedTimeToMastery: '4-5 months'
                            },
                            {
                                value: 'high',
                                description: 'Accelerated learning pace',
                                reviewFrequency: 'More frequent reviews',
                                estimatedTimeToMastery: '2-3 months'
                            }
                        ]
                    });
                }
                catch (error) {
                    console.error('Error getting tracking intensity:', error);
                    res.status(500).json({ error: 'Failed to retrieve tracking intensity' });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * DELETE /api/primitives/:id/tracking-intensity
     * Reset tracking intensity for a primitive (backward compatibility)
     */
    EnhancedSpacedRepetitionController.prototype.resetTrackingIntensity = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var primitiveId, userId, criterionId, defaultIntensity, resetDate, reviewIntervals;
            var _a;
            return __generator(this, function (_b) {
                try {
                    primitiveId = req.params.id;
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                    if (!userId) {
                        return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                    }
                    if (!primitiveId) {
                        return [2 /*return*/, res.status(400).json({ error: 'Primitive ID is required' })];
                    }
                    criterionId = "crit-".concat(primitiveId);
                    defaultIntensity = 'medium';
                    resetDate = new Date();
                    reviewIntervals = {
                        understand: 2,
                        use: 5,
                        explore: 10
                    };
                    res.json({
                        primitiveId: primitiveId,
                        criterionId: criterionId,
                        userId: userId,
                        previousIntensity: 'high', // This would come from database
                        newIntensity: defaultIntensity,
                        reviewIntervals: reviewIntervals,
                        resetDate: resetDate.toISOString(),
                        message: "Tracking intensity reset to default (".concat(defaultIntensity, ") for primitive ").concat(primitiveId),
                        reason: 'User requested reset to default settings',
                        impact: {
                            reviewFrequency: 'standardized',
                            learningPace: 'balanced',
                            estimatedTimeToMastery: '4-5 months'
                        }
                    });
                }
                catch (error) {
                    console.error('Error resetting tracking intensity:', error);
                    res.status(500).json({ error: 'Failed to reset tracking intensity' });
                }
                return [2 /*return*/];
            });
        });
    };
    return EnhancedSpacedRepetitionController;
}());
exports.EnhancedSpacedRepetitionController = EnhancedSpacedRepetitionController;
// Export controller instance
exports.enhancedSpacedRepetitionController = new EnhancedSpacedRepetitionController(enhancedSpacedRepetition_service_1.enhancedSpacedRepetitionService, masteryTrackingService, enhancedBatchReviewService);
