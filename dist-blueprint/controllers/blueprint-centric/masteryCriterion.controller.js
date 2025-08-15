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
exports.masteryCriterionController = exports.MasteryCriterionController = void 0;
var masteryCriterion_service_1 = require("../../services/blueprint-centric/masteryCriterion.service");
var masteryCalculation_service_1 = require("../../services/masteryCalculation.service");
var masteryTracking_service_1 = require("../../services/masteryTracking.service");
var masteryCalculationService = new masteryCalculation_service_1.MasteryCalculationService();
var masteryTrackingService = new masteryTracking_service_1.MasteryTrackingService();
// ============================================================================
// MASTERY CRITERION CONTROLLER
// ============================================================================
// 🆕 NEW ARCHITECTURE - Uses criterion-based logic instead of primitive-based
// ============================================================================
var MasteryCriterionController = /** @class */ (function () {
    function MasteryCriterionController() {
    }
    /**
     * POST /api/mastery-criterion
     * Create a new mastery criterion
     */
    MasteryCriterionController.prototype.createCriterion = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, blueprintSectionId, uueStage, weight, masteryThreshold, description, questionTypes, complexityScore, assessmentType, timeLimit, attemptsAllowed, validStages, criterion, error_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        _a = req.body, blueprintSectionId = _a.blueprintSectionId, uueStage = _a.uueStage, weight = _a.weight, masteryThreshold = _a.masteryThreshold, description = _a.description, questionTypes = _a.questionTypes, complexityScore = _a.complexityScore, assessmentType = _a.assessmentType, timeLimit = _a.timeLimit, attemptsAllowed = _a.attemptsAllowed;
                        if (!blueprintSectionId || !uueStage || !description) {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'Missing required fields: blueprintSectionId, uueStage, description'
                                })];
                        }
                        validStages = ['UNDERSTAND', 'USE', 'EXPLORE'];
                        if (!validStages.includes(uueStage)) {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'Invalid UUE stage. Must be one of: UNDERSTAND, USE, EXPLORE'
                                })];
                        }
                        return [4 /*yield*/, masteryCriterion_service_1.masteryCriterionService.createCriterion({
                                title: description, // Use description as title since interface requires it
                                description: description,
                                weight: weight || 1.0,
                                uueStage: uueStage,
                                assessmentType: assessmentType || 'QUESTION_BASED',
                                masteryThreshold: masteryThreshold || 0.8,
                                knowledgePrimitiveId: "primitive_".concat(Date.now()), // Generate placeholder ID
                                blueprintSectionId: blueprintSectionId.toString(), // Convert to string
                                userId: ((_b = req.user) === null || _b === void 0 ? void 0 : _b.userId) || 1,
                                complexityScore: complexityScore || 5.0
                            })];
                    case 1:
                        criterion = _c.sent();
                        res.status(201).json({
                            success: true,
                            data: criterion
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _c.sent();
                        console.error('Error creating mastery criterion:', error_1);
                        res.status(500).json({ error: 'Failed to create mastery criterion' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-criterion/:id
     * Get a mastery criterion by ID
     */
    MasteryCriterionController.prototype.getCriterion = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, criterion, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        if (!id) {
                            return [2 /*return*/, res.status(400).json({ error: 'Missing criterion ID' })];
                        }
                        return [4 /*yield*/, masteryCriterion_service_1.masteryCriterionService.getCriterion(id)];
                    case 1:
                        criterion = _a.sent();
                        if (!criterion) {
                            return [2 /*return*/, res.status(404).json({ error: 'Mastery criterion not found' })];
                        }
                        res.json({
                            success: true,
                            data: criterion
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error fetching mastery criterion:', error_2);
                        res.status(500).json({ error: 'Failed to fetch mastery criterion' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * PUT /api/mastery-criterion/:id
     * Update a mastery criterion
     */
    MasteryCriterionController.prototype.updateCriterion = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, updateData, validStages, criterion, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        updateData = req.body;
                        if (!id) {
                            return [2 /*return*/, res.status(400).json({ error: 'Missing criterion ID' })];
                        }
                        // Validate UUE stage if provided
                        if (updateData.uueStage) {
                            validStages = ['UNDERSTAND', 'USE', 'EXPLORE'];
                            if (!validStages.includes(updateData.uueStage)) {
                                return [2 /*return*/, res.status(400).json({
                                        error: 'Invalid UUE stage. Must be one of: UNDERSTAND, USE, EXPLORE'
                                    })];
                            }
                        }
                        return [4 /*yield*/, masteryCriterion_service_1.masteryCriterionService.updateCriterion(id, updateData)];
                    case 1:
                        criterion = _a.sent();
                        res.json({
                            success: true,
                            data: criterion
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error updating mastery criterion:', error_3);
                        res.status(500).json({ error: 'Failed to update mastery criterion' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * DELETE /api/mastery-criterion/:id
     * Delete a mastery criterion
     */
    MasteryCriterionController.prototype.deleteCriterion = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        if (!id) {
                            return [2 /*return*/, res.status(400).json({ error: 'Missing criterion ID' })];
                        }
                        return [4 /*yield*/, masteryCriterion_service_1.masteryCriterionService.deleteCriterion(id)];
                    case 1:
                        _a.sent();
                        res.json({
                            success: true,
                            message: 'Mastery criterion deleted successfully'
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Error deleting mastery criterion:', error_4);
                        res.status(500).json({ error: 'Failed to delete mastery criterion' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-criterion/section/:sectionId
     * Get all criteria for a blueprint section
     */
    MasteryCriterionController.prototype.getCriteriaBySection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var sectionId, criteria, sectionStats, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        sectionId = req.params.sectionId;
                        if (!sectionId) {
                            return [2 /*return*/, res.status(400).json({ error: 'Missing section ID' })];
                        }
                        return [4 /*yield*/, masteryCriterion_service_1.masteryCriterionService.getCriteriaBySection(sectionId)];
                    case 1:
                        criteria = _a.sent();
                        // Ensure criteria is an array and handle undefined returns
                        if (!criteria || !Array.isArray(criteria)) {
                            return [2 /*return*/, res.json({
                                    success: true,
                                    data: {
                                        sectionId: sectionId,
                                        criteria: [],
                                        totalCriteria: 0,
                                        sectionStats: {},
                                        uueStageDistribution: { UNDERSTAND: 0, USE: 0, EXPLORE: 0 },
                                        complexityDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0 }
                                    }
                                })];
                        }
                        sectionStats = this.calculateSectionMasteryStats(criteria);
                        res.json({
                            success: true,
                            data: {
                                sectionId: sectionId,
                                criteria: criteria,
                                totalCriteria: criteria.length,
                                sectionStats: sectionStats,
                                uueStageDistribution: this.getUueStageDistribution(criteria),
                                complexityDistribution: this.getComplexityDistribution(criteria)
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Error fetching section criteria:', error_5);
                        res.status(500).json({ error: 'Failed to fetch section criteria' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-criterion/uue-stage/:stage
     * Get all criteria for a specific UUE stage
     */
    MasteryCriterionController.prototype.getCriteriaByUueStage = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var stage, criteria, stageStats, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        stage = req.params.stage;
                        if (!stage || !['UNDERSTAND', 'USE', 'EXPLORE'].includes(stage)) {
                            return [2 /*return*/, res.status(400).json({ error: 'Invalid UUE stage' })];
                        }
                        return [4 /*yield*/, masteryCriterion_service_1.masteryCriterionService.getCriteriaByUueStage('section-1', stage)];
                    case 1:
                        criteria = _a.sent();
                        // Ensure criteria is an array and handle undefined returns
                        if (!criteria || !Array.isArray(criteria)) {
                            return [2 /*return*/, res.json({
                                    success: true,
                                    data: {
                                        stage: stage,
                                        criteria: [],
                                        totalCriteria: 0,
                                        stageStats: {},
                                        complexityDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0 },
                                        sectionDistribution: {}
                                    }
                                })];
                        }
                        stageStats = this.calculateStageMasteryStats(criteria);
                        res.json({
                            success: true,
                            data: {
                                stage: stage,
                                criteria: criteria,
                                totalCriteria: criteria.length,
                                stageStats: stageStats,
                                complexityDistribution: this.getComplexityDistribution(criteria),
                                sectionDistribution: this.getSectionDistribution(criteria)
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        console.error('Error fetching stage criteria:', error_6);
                        res.status(500).json({ error: 'Failed to fetch stage criteria' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/mastery-criterion/:id/review
     * Process a criterion review and update mastery tracking
     */
    MasteryCriterionController.prototype.processCriterionReview = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, id, _a, isCorrect, performance_1, confidence, timeSpent, questionType, result, newMasteryScore, error_7, progress, error_8, error_9;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 10, , 11]);
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        id = req.params.id;
                        _a = req.body, isCorrect = _a.isCorrect, performance_1 = _a.performance, confidence = _a.confidence, timeSpent = _a.timeSpent, questionType = _a.questionType;
                        if (!id || isCorrect === undefined) {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'Missing required fields: isCorrect'
                                })];
                        }
                        return [4 /*yield*/, masteryTrackingService.updateMasteryScore(userId, id, performance_1 || 0.8, isCorrect)];
                    case 1:
                        result = _c.sent();
                        newMasteryScore = 0;
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, masteryCalculationService.calculateCriterionMasteryScore(id, userId)];
                    case 3:
                        newMasteryScore = _c.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_7 = _c.sent();
                        console.warn('Could not calculate mastery score:', error_7);
                        newMasteryScore = 0;
                        return [3 /*break*/, 5];
                    case 5:
                        progress = null;
                        _c.label = 6;
                    case 6:
                        _c.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, masteryTrackingService.getMasteryProgress(userId, id)];
                    case 7:
                        progress = _c.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        error_8 = _c.sent();
                        console.warn('Could not get mastery progress:', error_8);
                        return [3 /*break*/, 9];
                    case 9:
                        res.json({
                            success: true,
                            data: __assign(__assign({}, result), { newMasteryScore: newMasteryScore, progress: progress, reviewProcessed: true, timestamp: new Date().toISOString() })
                        });
                        return [3 /*break*/, 11];
                    case 10:
                        error_9 = _c.sent();
                        console.error('Error processing criterion review:', error_9);
                        res.status(500).json({ error: 'Failed to process criterion review' });
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-criterion/:id/mastery-progress
     * Get mastery progress for a specific criterion
     */
    MasteryCriterionController.prototype.getCriterionMasteryProgress = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, id, progress, masteryScore, error_10, error_11;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        id = req.params.id;
                        if (!id) {
                            return [2 /*return*/, res.status(400).json({ error: 'Missing criterion ID' })];
                        }
                        return [4 /*yield*/, masteryTrackingService.getMasteryProgress(userId, id)];
                    case 1:
                        progress = _b.sent();
                        if (!progress) {
                            return [2 /*return*/, res.status(404).json({ error: 'Mastery progress not found' })];
                        }
                        masteryScore = 0;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, masteryCalculationService.calculateCriterionMasteryScore(id, userId)];
                    case 3:
                        masteryScore = _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_10 = _b.sent();
                        console.warn('Could not calculate mastery score:', error_10);
                        masteryScore = progress.masteryScore || 0;
                        return [3 /*break*/, 5];
                    case 5:
                        res.json({
                            success: true,
                            data: __assign(__assign({}, progress), { masteryScore: masteryScore, masteryLevel: this.calculateMasteryLevel(masteryScore), nextReviewDate: this.calculateNextReviewDate(progress.lastReviewAt, masteryScore) })
                        });
                        return [3 /*break*/, 7];
                    case 6:
                        error_11 = _b.sent();
                        console.error('Error fetching criterion mastery progress:', error_11);
                        res.status(500).json({ error: 'Failed to fetch mastery progress' });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * PUT /api/mastery-criterion/:id/mastery-threshold
     * Update mastery threshold for a criterion
     */
    MasteryCriterionController.prototype.updateMasteryThreshold = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, id, threshold, error_12;
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
                        threshold = req.body.threshold;
                        if (!id || !threshold) {
                            return [2 /*return*/, res.status(400).json({ error: 'Missing criterion ID or threshold' })];
                        }
                        if (!['SURVEY', 'PROFICIENT', 'EXPERT'].includes(threshold)) {
                            return [2 /*return*/, res.status(400).json({ error: 'Invalid threshold value' })];
                        }
                        // Update mastery threshold using the mastery tracking service
                        return [4 /*yield*/, masteryTrackingService.updateMasteryThreshold(userId, id, threshold)];
                    case 1:
                        // Update mastery threshold using the mastery tracking service
                        _b.sent();
                        res.json({
                            success: true,
                            data: {
                                message: 'Mastery threshold updated successfully',
                                criterionId: id,
                                threshold: threshold,
                                updatedAt: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_12 = _b.sent();
                        console.error('Error updating mastery threshold:', error_12);
                        res.status(500).json({ error: 'Failed to update mastery threshold' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-criterion/section/:sectionId/uue-progress
     * Get UUE stage progress for a blueprint section
     */
    MasteryCriterionController.prototype.getSectionUueProgress = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, sectionId, stageProgress, sectionMasteryResult, error_13, error_14;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        sectionId = req.params.sectionId;
                        if (!sectionId) {
                            return [2 /*return*/, res.status(400).json({ error: 'Missing section ID' })];
                        }
                        return [4 /*yield*/, masteryTrackingService.getUueStageProgress(userId, sectionId)];
                    case 1:
                        stageProgress = _b.sent();
                        sectionMasteryResult = null;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, masteryCalculationService.calculateUueStageMastery(sectionId, 'UNDERSTAND', // Default to UNDERSTAND stage
                            userId)];
                    case 3:
                        sectionMasteryResult = _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_13 = _b.sent();
                        console.warn('Could not calculate UUE stage mastery:', error_13);
                        sectionMasteryResult = {
                            stage: 'UNDERSTAND',
                            masteryScore: 0,
                            isMastered: false,
                            totalCriteria: 0,
                            masteredCriteria: 0,
                            totalWeight: 0,
                            criteriaBreakdown: []
                        };
                        return [3 /*break*/, 5];
                    case 5:
                        res.json({
                            success: true,
                            data: {
                                sectionId: sectionId,
                                stageProgress: stageProgress,
                                sectionMasteryScore: sectionMasteryResult.masteryScore,
                                masteryLevel: this.calculateMasteryLevel(sectionMasteryResult.masteryScore),
                                recommendations: this.generateSectionRecommendations(stageProgress, sectionMasteryResult.masteryScore)
                            }
                        });
                        return [3 /*break*/, 7];
                    case 6:
                        error_14 = _b.sent();
                        console.error('Error fetching section UUE progress:', error_14);
                        res.status(500).json({ error: 'Failed to fetch UUE progress' });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-criterion/user/:userId/stats
     * Get mastery statistics for a user
     */
    MasteryCriterionController.prototype.getUserMasteryStats = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, stats, analytics, error_15;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, masteryTrackingService.getMasteryStats(userId)];
                    case 1:
                        stats = _b.sent();
                        analytics = this.calculateUserMasteryAnalytics(stats);
                        res.json({
                            success: true,
                            data: __assign(__assign({}, stats), { analytics: analytics, summary: this.generateUserMasterySummary(stats, analytics) })
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_15 = _b.sent();
                        console.error('Error fetching user mastery stats:', error_15);
                        res.status(500).json({ error: 'Failed to fetch mastery stats' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * GET /api/mastery-criterion/user/:userId/recommendations
     * Get personalized mastery recommendations for a user
     */
    MasteryCriterionController.prototype.getUserMasteryRecommendations = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, _a, _b, limit, _c, focus_1, stats, recommendations, error_16;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 2, , 3]);
                        userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        _a = req.query, _b = _a.limit, limit = _b === void 0 ? 10 : _b, _c = _a.focus, focus_1 = _c === void 0 ? 'all' : _c;
                        return [4 /*yield*/, masteryTrackingService.getMasteryStats(userId)];
                    case 1:
                        stats = _e.sent();
                        recommendations = this.generatePersonalizedRecommendations(stats, focus_1);
                        res.json({
                            success: true,
                            data: {
                                userId: userId,
                                recommendations: recommendations.slice(0, parseInt(limit)),
                                totalRecommendations: recommendations.length,
                                focusArea: focus_1,
                                generatedAt: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_16 = _e.sent();
                        console.error('Error generating mastery recommendations:', error_16);
                        res.status(500).json({ error: 'Failed to generate mastery recommendations' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/mastery-criterion/batch-review
     * Process multiple criterion reviews in batch
     */
    MasteryCriterionController.prototype.processBatchReview = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, reviews, results, errors, _i, reviews_1, review, result, error_17, error_18;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        reviews = req.body.reviews;
                        if (!Array.isArray(reviews) || reviews.length === 0) {
                            return [2 /*return*/, res.status(400).json({ error: 'Reviews array is required and must not be empty' })];
                        }
                        results = [];
                        errors = [];
                        _i = 0, reviews_1 = reviews;
                        _b.label = 1;
                    case 1:
                        if (!(_i < reviews_1.length)) return [3 /*break*/, 6];
                        review = reviews_1[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, masteryTrackingService.updateMasteryScore(userId, review.criterionId, review.performance || 0.8, review.isCorrect)];
                    case 3:
                        result = _b.sent();
                        results.push(__assign(__assign({}, result), { criterionId: review.criterionId }));
                        return [3 /*break*/, 5];
                    case 4:
                        error_17 = _b.sent();
                        errors.push({ criterionId: review.criterionId, error: error_17.message });
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        res.json({
                            success: true,
                            data: {
                                processed: results.length,
                                errors: errors.length,
                                results: results,
                                errors: errors,
                                timestamp: new Date().toISOString()
                            }
                        });
                        return [3 /*break*/, 8];
                    case 7:
                        error_18 = _b.sent();
                        console.error('Error processing batch review:', error_18);
                        res.status(500).json({ error: 'Failed to process batch review' });
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================================================
    // HELPER METHODS
    // ============================================================================
    /**
     * Calculate mastery level based on score
     */
    MasteryCriterionController.prototype.calculateMasteryLevel = function (score) {
        if (score >= 0.9)
            return 'EXPERT';
        if (score >= 0.8)
            return 'PROFICIENT';
        if (score >= 0.6)
            return 'COMPETENT';
        if (score >= 0.4)
            return 'LEARNING';
        return 'BEGINNER';
    };
    /**
     * Calculate next review date based on mastery score
     */
    MasteryCriterionController.prototype.calculateNextReviewDate = function (lastReviewDate, masteryScore) {
        var now = new Date();
        var lastReview = lastReviewDate ? new Date(lastReviewDate) : now;
        // Spaced repetition algorithm: longer intervals for higher mastery
        var daysToAdd = 1;
        if (masteryScore >= 0.9)
            daysToAdd = 30;
        else if (masteryScore >= 0.8)
            daysToAdd = 14;
        else if (masteryScore >= 0.6)
            daysToAdd = 7;
        else if (masteryScore >= 0.4)
            daysToAdd = 3;
        var nextReview = new Date(lastReview);
        nextReview.setDate(nextReview.getDate() + daysToAdd);
        return nextReview;
    };
    /**
     * Calculate section mastery statistics
     */
    MasteryCriterionController.prototype.calculateSectionMasteryStats = function (criteria) {
        if (criteria.length === 0)
            return {};
        var totalWeight = criteria.reduce(function (sum, c) { return sum + (c.weight || 1); }, 0);
        var weightedScore = criteria.reduce(function (sum, c) { return sum + (c.masteryScore || 0) * (c.weight || 1); }, 0);
        return {
            totalCriteria: criteria.length,
            averageWeight: totalWeight / criteria.length,
            weightedMasteryScore: weightedScore / totalWeight,
            masteryDistribution: this.getMasteryDistribution(criteria),
            complexityScore: criteria.reduce(function (sum, c) { return sum + (c.complexityScore || 5); }, 0) / criteria.length
        };
    };
    /**
     * Calculate stage mastery statistics
     */
    MasteryCriterionController.prototype.calculateStageMasteryStats = function (criteria) {
        if (criteria.length === 0)
            return {};
        return {
            criteriaCount: criteria.length,
            averageComplexity: criteria.reduce(function (sum, c) { return sum + (c.complexityScore || 5); }, 0) / criteria.length,
            masteryDistribution: this.getMasteryDistribution(criteria),
            sectionCoverage: this.getSectionDistribution(criteria)
        };
    };
    /**
     * Get UUE stage distribution
     */
    MasteryCriterionController.prototype.getUueStageDistribution = function (criteria) {
        var distribution = { UNDERSTAND: 0, USE: 0, EXPLORE: 0 };
        criteria.forEach(function (c) {
            if (distribution[c.uueStage]) {
                distribution[c.uueStage]++;
            }
        });
        return distribution;
    };
    /**
     * Get complexity distribution
     */
    MasteryCriterionController.prototype.getComplexityDistribution = function (criteria) {
        var distribution = { LOW: 0, MEDIUM: 0, HIGH: 0 };
        criteria.forEach(function (c) {
            var complexity = c.complexityScore || 5;
            if (complexity <= 3)
                distribution.LOW++;
            else if (complexity <= 7)
                distribution.MEDIUM++;
            else
                distribution.HIGH++;
        });
        return distribution;
    };
    /**
     * Get section distribution
     */
    MasteryCriterionController.prototype.getSectionDistribution = function (criteria) {
        var distribution = {};
        criteria.forEach(function (c) {
            var sectionId = c.blueprintSectionId;
            distribution[sectionId] = (distribution[sectionId] || 0) + 1;
        });
        return distribution;
    };
    /**
     * Get mastery distribution
     */
    MasteryCriterionController.prototype.getMasteryDistribution = function (criteria) {
        var _this = this;
        var distribution = { BEGINNER: 0, LEARNING: 0, COMPETENT: 0, PROFICIENT: 0, EXPERT: 0 };
        criteria.forEach(function (c) {
            var level = _this.calculateMasteryLevel(c.masteryScore || 0);
            distribution[level]++;
        });
        return distribution;
    };
    /**
     * Generate section recommendations
     */
    MasteryCriterionController.prototype.generateSectionRecommendations = function (stageProgress, masteryScore) {
        var recommendations = [];
        if (masteryScore < 0.6) {
            recommendations.push('Focus on foundational concepts in UNDERSTAND stage');
            recommendations.push('Practice with simpler questions to build confidence');
        }
        else if (masteryScore < 0.8) {
            recommendations.push('Move to USE stage for practical application');
            recommendations.push('Review challenging concepts before advancing');
        }
        else {
            recommendations.push('Ready for EXPLORE stage - tackle advanced problems');
            recommendations.push('Consider teaching others to reinforce mastery');
        }
        return recommendations;
    };
    /**
     * Calculate user mastery analytics
     */
    MasteryCriterionController.prototype.calculateUserMasteryAnalytics = function (stats) {
        return {
            learningVelocity: this.calculateLearningVelocity(stats),
            strengthAreas: this.identifyStrengthAreas(stats),
            improvementAreas: this.identifyImprovementAreas(stats),
            consistencyScore: this.calculateConsistencyScore(stats)
        };
    };
    /**
     * Generate user mastery summary
     */
    MasteryCriterionController.prototype.generateUserMasterySummary = function (stats, analytics) {
        return {
            overallProgress: "".concat(Math.round(stats.overallMastery * 100), "%"),
            learningStage: this.determineLearningStage(stats.overallMastery),
            nextMilestone: this.calculateNextMilestone(stats.overallMastery),
            estimatedTimeToGoal: this.estimateTimeToGoal(stats.overallMastery, analytics.learningVelocity)
        };
    };
    /**
     * Generate personalized recommendations
     */
    MasteryCriterionController.prototype.generatePersonalizedRecommendations = function (stats, focus) {
        var recommendations = [];
        if (focus === 'weakest' || focus === 'all') {
            recommendations.push({
                type: 'REVIEW',
                priority: 'HIGH',
                description: 'Review foundational concepts in UNDERSTAND stage',
                estimatedTime: '15 minutes'
            });
        }
        if (focus === 'strongest' || focus === 'all') {
            recommendations.push({
                type: 'ADVANCE',
                priority: 'MEDIUM',
                description: 'Move to EXPLORE stage for advanced challenges',
                estimatedTime: '20 minutes'
            });
        }
        return recommendations;
    };
    // Additional helper methods for analytics
    MasteryCriterionController.prototype.calculateLearningVelocity = function (stats) {
        // Implementation would calculate rate of improvement over time
        return 0.1; // Placeholder
    };
    MasteryCriterionController.prototype.identifyStrengthAreas = function (stats) {
        // Implementation would identify user's strongest areas
        return ['Calculus', 'Algebra']; // Placeholder
    };
    MasteryCriterionController.prototype.identifyImprovementAreas = function (stats) {
        // Implementation would identify areas needing improvement
        return ['Geometry', 'Trigonometry']; // Placeholder
    };
    MasteryCriterionController.prototype.calculateConsistencyScore = function (stats) {
        // Implementation would calculate consistency of study habits
        return 0.8; // Placeholder
    };
    MasteryCriterionController.prototype.determineLearningStage = function (mastery) {
        if (mastery >= 0.8)
            return 'ADVANCED';
        if (mastery >= 0.6)
            return 'INTERMEDIATE';
        return 'BEGINNER';
    };
    MasteryCriterionController.prototype.calculateNextMilestone = function (mastery) {
        if (mastery < 0.6)
            return 'Reach 60% mastery (COMPETENT level)';
        if (mastery < 0.8)
            return 'Reach 80% mastery (PROFICIENT level)';
        return 'Reach 90% mastery (EXPERT level)';
    };
    MasteryCriterionController.prototype.estimateTimeToGoal = function (currentMastery, velocity) {
        var targetMastery = 0.9;
        var pointsNeeded = targetMastery - currentMastery;
        var daysEstimated = Math.ceil(pointsNeeded / velocity);
        return "".concat(daysEstimated, " days");
    };
    return MasteryCriterionController;
}());
exports.MasteryCriterionController = MasteryCriterionController;
// Export controller instance
exports.masteryCriterionController = new MasteryCriterionController();
