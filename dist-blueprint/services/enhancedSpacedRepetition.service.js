"use strict";
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
exports.enhancedSpacedRepetitionService = exports.EnhancedSpacedRepetitionService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var EnhancedSpacedRepetitionService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var EnhancedSpacedRepetitionService = _classThis = /** @class */ (function () {
        function EnhancedSpacedRepetitionService_1() {
            this.logger = new common_1.Logger(EnhancedSpacedRepetitionService.name);
            this.prisma = new client_1.PrismaClient();
        }
        /**
         * Get due criteria for a user
         */
        EnhancedSpacedRepetitionService_1.prototype.getDueCriteria = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        // for criteria that are due for review based on spaced repetition algorithm
                        return [2 /*return*/, [
                                {
                                    id: 'criterion_1',
                                    description: 'Mock Criterion 1',
                                    blueprintSectionId: 'section_1',
                                    uueStage: 'UNDERSTAND',
                                    weight: 1.0,
                                    masteryThreshold: 0.8
                                },
                                {
                                    id: 'criterion_2',
                                    description: 'Mock Criterion 2',
                                    blueprintSectionId: 'section_2',
                                    uueStage: 'USE',
                                    weight: 1.5,
                                    masteryThreshold: 0.9
                                }
                            ]];
                    }
                    catch (error) {
                        this.logger.error("Error getting due criteria for user ".concat(userId, ":"), error);
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get overdue criteria for a user
         */
        EnhancedSpacedRepetitionService_1.prototype.getOverdueCriteria = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        // for criteria that are overdue for review
                        return [2 /*return*/, []];
                    }
                    catch (error) {
                        this.logger.error("Error getting overdue criteria for user ".concat(userId, ":"), error);
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Process a review outcome
         */
        EnhancedSpacedRepetitionService_1.prototype.processReviewOutcome = function (outcome) {
            return __awaiter(this, void 0, void 0, function () {
                var nextReviewAt;
                return __generator(this, function (_a) {
                    try {
                        nextReviewAt = new Date();
                        nextReviewAt.setDate(nextReviewAt.getDate() + 1); // Default to tomorrow
                        return [2 /*return*/, {
                                nextReviewAt: nextReviewAt,
                                masteryScore: 0.5, // Default score
                                isMastered: false,
                                stageProgression: false,
                                message: 'Review processed successfully'
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error processing review outcome:", error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Update tracking intensity for a criterion
         */
        EnhancedSpacedRepetitionService_1.prototype.updateTrackingIntensity = function (userId, criterionId, intensity) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would update the database
                        this.logger.log("Updated tracking intensity for criterion ".concat(criterionId, " to ").concat(intensity));
                    }
                    catch (error) {
                        this.logger.error("Error updating tracking intensity:", error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get mastery progress for a criterion
         */
        EnhancedSpacedRepetitionService_1.prototype.getMasteryProgress = function (userId, criterionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, {
                                criterionId: criterionId,
                                masteryScore: 0.5,
                                isMastered: false,
                                nextReviewAt: new Date(),
                                consecutiveCorrect: 0,
                                totalReviews: 0
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error getting mastery progress:", error);
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get mastery statistics for a user
         */
        EnhancedSpacedRepetitionService_1.prototype.getMasteryStats = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, {
                                totalCriteria: 10,
                                overdueCriteria: 2,
                                dueCriteria: 3,
                                masteredCriteria: 5,
                                averageMasteryScore: 0.7
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error getting mastery stats:", error);
                        return [2 /*return*/, {
                                totalCriteria: 0,
                                overdueCriteria: 0,
                                dueCriteria: 0,
                                masteredCriteria: 0,
                                averageMasteryScore: 0
                            }];
                    }
                    return [2 /*return*/];
                });
            });
        };
        // ============================================================================
        // MASTERY THRESHOLD MANAGEMENT METHODS
        // ============================================================================
        /**
         * Get user's mastery thresholds
         */
        EnhancedSpacedRepetitionService_1.prototype.getUserMasteryThresholds = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, [
                                {
                                    userId: userId,
                                    defaultThreshold: 0.8,
                                    customThresholds: {},
                                    lastUpdated: new Date()
                                }
                            ]];
                    }
                    catch (error) {
                        this.logger.error("Error getting user mastery thresholds:", error);
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get mastery thresholds for a section
         */
        EnhancedSpacedRepetitionService_1.prototype.getSectionMasteryThresholds = function (sectionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, {
                                sectionId: sectionId,
                                defaultThreshold: 0.8,
                                customThresholds: {},
                                lastUpdated: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error getting section mastery thresholds:", error);
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get mastery threshold for a criterion
         */
        EnhancedSpacedRepetitionService_1.prototype.getCriterionMasteryThreshold = function (criterionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, {
                                criterionId: criterionId,
                                threshold: 0.8,
                                customSettings: {},
                                lastUpdated: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error getting criterion mastery threshold:", error);
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Set mastery threshold for a criterion
         */
        EnhancedSpacedRepetitionService_1.prototype.setCriterionMasteryThreshold = function (criterionId, threshold, customSettings) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would update the database
                        this.logger.log("Set mastery threshold for criterion ".concat(criterionId, " to ").concat(threshold));
                        return [2 /*return*/, {
                                criterionId: criterionId,
                                threshold: threshold,
                                customSettings: customSettings || {},
                                lastUpdated: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error setting criterion mastery threshold:", error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get mastery threshold templates
         */
        EnhancedSpacedRepetitionService_1.prototype.getMasteryThresholdTemplates = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, [
                                {
                                    id: 'template_1',
                                    name: 'Standard',
                                    threshold: 0.8,
                                    description: 'Standard mastery threshold'
                                },
                                {
                                    id: 'template_2',
                                    name: 'Strict',
                                    threshold: 0.9,
                                    description: 'Strict mastery threshold'
                                }
                            ]];
                    }
                    catch (error) {
                        this.logger.error("Error getting mastery threshold templates:", error);
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get user mastery threshold analysis
         */
        EnhancedSpacedRepetitionService_1.prototype.getUserMasteryThresholdAnalysis = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would analyze the database
                        return [2 /*return*/, {
                                userId: userId,
                                effectiveness: 0.85,
                                recommendations: ['Consider lowering threshold for difficult criteria'],
                                lastAnalyzed: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error getting user mastery threshold analysis:", error);
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get section mastery threshold analysis
         */
        EnhancedSpacedRepetitionService_1.prototype.getSectionMasteryThresholdAnalysis = function (sectionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would analyze the database
                        return [2 /*return*/, {
                                sectionId: sectionId,
                                effectiveness: 0.82,
                                recommendations: ['Consider adjusting thresholds based on difficulty'],
                                lastAnalyzed: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error getting section mastery threshold analysis:", error);
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get mastery threshold recommendations
         */
        EnhancedSpacedRepetitionService_1.prototype.getMasteryThresholdRecommendations = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would analyze the database
                        return [2 /*return*/, [
                                {
                                    criterionId: 'criterion_1',
                                    currentThreshold: 0.8,
                                    recommendedThreshold: 0.75,
                                    reason: 'User struggling with this criterion'
                                }
                            ]];
                    }
                    catch (error) {
                        this.logger.error("Error getting mastery threshold recommendations:", error);
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Bulk update mastery thresholds
         */
        EnhancedSpacedRepetitionService_1.prototype.bulkUpdateMasteryThresholds = function (updates) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would update the database
                        this.logger.log("Bulk updating ".concat(updates.length, " mastery thresholds"));
                        return [2 /*return*/, {
                                updatedCount: updates.length,
                                successCount: updates.length,
                                failureCount: 0,
                                errors: []
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error bulk updating mastery thresholds:", error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Bulk reset mastery thresholds to defaults
         */
        EnhancedSpacedRepetitionService_1.prototype.bulkResetMasteryThresholds = function (criterionIds) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would update the database
                        this.logger.log("Bulk resetting ".concat(criterionIds.length, " mastery thresholds"));
                        return [2 /*return*/, {
                                resetCount: criterionIds.length,
                                successCount: criterionIds.length,
                                failureCount: 0,
                                errors: []
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error bulk resetting mastery thresholds:", error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Import mastery thresholds from external source
         */
        EnhancedSpacedRepetitionService_1.prototype.importMasteryThresholds = function (importData, source) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would import to the database
                        this.logger.log("Importing mastery thresholds from ".concat(source));
                        return [2 /*return*/, {
                                importedCount: importData.length || 0,
                                source: source,
                                lastImported: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error importing mastery thresholds:", error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Export user's mastery thresholds
         */
        EnhancedSpacedRepetitionService_1.prototype.exportMasteryThresholds = function (userId_1) {
            return __awaiter(this, arguments, void 0, function (userId, format) {
                if (format === void 0) { format = 'json'; }
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would export from the database
                        this.logger.log("Exporting mastery thresholds for user ".concat(userId, " in ").concat(format, " format"));
                        return [2 /*return*/, {
                                userId: userId,
                                format: format,
                                data: [],
                                exportedAt: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error exporting mastery thresholds:", error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        // ============================================================================
        // UUE STAGE PROGRESSION METHODS
        // ============================================================================
        /**
         * Get UUE stage progress for a criterion
         */
        EnhancedSpacedRepetitionService_1.prototype.getUueStageProgress = function (userId, criterionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, {
                                userId: userId,
                                criterionId: criterionId,
                                currentStage: 'UNDERSTAND',
                                progress: 0.6,
                                nextStage: 'USE',
                                lastUpdated: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error getting UUE stage progress:", error);
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Progress to next UUE level
         */
        EnhancedSpacedRepetitionService_1.prototype.progressToNextUueLevel = function (userId_1, criterionId_1) {
            return __awaiter(this, arguments, void 0, function (userId, criterionId, forceAdvance) {
                if (forceAdvance === void 0) { forceAdvance = false; }
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would update the database
                        this.logger.log("Progressing to next UUE level for criterion ".concat(criterionId, ", force: ").concat(forceAdvance));
                        return [2 /*return*/, {
                                userId: userId,
                                criterionId: criterionId,
                                previousStage: 'UNDERSTAND',
                                newStage: 'USE',
                                progressed: true,
                                timestamp: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error progressing to next UUE level:", error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get user's UUE stage progress
         */
        EnhancedSpacedRepetitionService_1.prototype.getUserUueStageProgress = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, [
                                {
                                    criterionId: 'criterion_1',
                                    currentStage: 'UNDERSTAND',
                                    progress: 0.6,
                                    nextStage: 'USE'
                                }
                            ]];
                    }
                    catch (error) {
                        this.logger.error("Error getting user UUE stage progress:", error);
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Reset UUE stage for a criterion
         */
        EnhancedSpacedRepetitionService_1.prototype.resetUueStage = function (userId_1, criterionId_1) {
            return __awaiter(this, arguments, void 0, function (userId, criterionId, targetStage) {
                if (targetStage === void 0) { targetStage = 'UNDERSTAND'; }
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would update the database
                        this.logger.log("Resetting UUE stage for criterion ".concat(criterionId, " to ").concat(targetStage));
                        return [2 /*return*/, {
                                userId: userId,
                                criterionId: criterionId,
                                previousStage: 'USE',
                                newStage: targetStage,
                                reset: true,
                                timestamp: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error resetting UUE stage:", error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get UUE stage analytics for a user
         */
        EnhancedSpacedRepetitionService_1.prototype.getUueStageAnalytics = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would analyze the database
                        return [2 /*return*/, {
                                userId: userId,
                                stageDistribution: {
                                    UNDERSTAND: 5,
                                    USE: 3,
                                    EXPLAIN: 2
                                },
                                averageProgress: 0.65,
                                lastAnalyzed: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error getting UUE stage analytics:", error);
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Batch advance UUE stages
         */
        EnhancedSpacedRepetitionService_1.prototype.batchAdvanceUueStages = function (userId, criteria) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would update the database
                        this.logger.log("Batch advancing UUE stages for ".concat(criteria.length, " criteria"));
                        return [2 /*return*/, {
                                userId: userId,
                                processedCount: criteria.length,
                                successCount: criteria.length,
                                failureCount: 0,
                                errors: []
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error batch advancing UUE stages:", error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get next UUE stage review
         */
        EnhancedSpacedRepetitionService_1.prototype.getNextUueStageReview = function (userId, criterionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, {
                                userId: userId,
                                criterionId: criterionId,
                                nextReviewAt: new Date(),
                                stage: 'UNDERSTAND',
                                reviewType: 'stage_progression'
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error getting next UUE stage review:", error);
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/];
                });
            });
        };
        // ============================================================================
        // PRIMITIVE COMPATIBILITY METHODS
        // ============================================================================
        /**
         * Toggle primitive tracking
         */
        EnhancedSpacedRepetitionService_1.prototype.togglePrimitiveTracking = function (userId, primitiveId, enabled) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would update the database
                        this.logger.log("Toggling primitive tracking for ".concat(primitiveId, " to ").concat(enabled));
                        return [2 /*return*/, {
                                userId: userId,
                                primitiveId: primitiveId,
                                trackingEnabled: enabled,
                                lastUpdated: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error toggling primitive tracking:", error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get user primitives
         */
        EnhancedSpacedRepetitionService_1.prototype.getUserPrimitives = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, [
                                {
                                    id: 'primitive_1',
                                    name: 'Mock Primitive 1',
                                    trackingEnabled: true,
                                    lastReviewed: new Date()
                                }
                            ]];
                    }
                    catch (error) {
                        this.logger.error("Error getting user primitives:", error);
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get primitive details
         */
        EnhancedSpacedRepetitionService_1.prototype.getPrimitiveDetails = function (userId, primitiveId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, {
                                id: primitiveId,
                                name: 'Mock Primitive',
                                description: 'Mock primitive description',
                                trackingEnabled: true,
                                lastReviewed: new Date(),
                                masteryScore: 0.7
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error getting primitive details:", error);
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Set tracking intensity
         */
        EnhancedSpacedRepetitionService_1.prototype.setTrackingIntensity = function (userId, primitiveId, intensity) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would update the database
                        this.logger.log("Setting tracking intensity for ".concat(primitiveId, " to ").concat(intensity));
                        return [2 /*return*/, {
                                userId: userId,
                                primitiveId: primitiveId,
                                intensity: intensity,
                                lastUpdated: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error setting tracking intensity:", error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get tracking intensity
         */
        EnhancedSpacedRepetitionService_1.prototype.getTrackingIntensity = function (userId, primitiveId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, {
                                userId: userId,
                                primitiveId: primitiveId,
                                intensity: 'NORMAL',
                                lastUpdated: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error getting tracking intensity:", error);
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Reset tracking intensity
         */
        EnhancedSpacedRepetitionService_1.prototype.resetTrackingIntensity = function (userId, primitiveId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would update the database
                        this.logger.log("Resetting tracking intensity for ".concat(primitiveId));
                        return [2 /*return*/, {
                                userId: userId,
                                primitiveId: primitiveId,
                                intensity: 'NORMAL',
                                reset: true,
                                lastUpdated: new Date()
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error resetting tracking intensity:", error);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        return EnhancedSpacedRepetitionService_1;
    }());
    __setFunctionName(_classThis, "EnhancedSpacedRepetitionService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EnhancedSpacedRepetitionService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EnhancedSpacedRepetitionService = _classThis;
}();
exports.EnhancedSpacedRepetitionService = EnhancedSpacedRepetitionService;
exports.enhancedSpacedRepetitionService = new EnhancedSpacedRepetitionService();
