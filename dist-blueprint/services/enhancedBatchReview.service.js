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
exports.EnhancedBatchReviewService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var EnhancedBatchReviewService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var EnhancedBatchReviewService = _classThis = /** @class */ (function () {
        function EnhancedBatchReviewService_1() {
            this.logger = new common_1.Logger(EnhancedBatchReviewService.name);
            this.prisma = new client_1.PrismaClient();
        }
        /**
         * Process batch review outcomes with criterion-based logic
         * Implements consecutive interval mastery checking and UUE stage progression
         */
        EnhancedBatchReviewService_1.prototype.processBatchWithOptimization = function (userId, outcomes) {
            return __awaiter(this, void 0, void 0, function () {
                var startTime, result, validation, batchSize, batches, _i, batches_1, batch, batchResult, error_1;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            startTime = Date.now();
                            result = {
                                success: true,
                                processedCount: 0,
                                successCount: 0,
                                failureCount: 0,
                                masteryUpdates: 0,
                                stageProgressions: 0,
                                errors: [],
                                processingTime: 0
                            };
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 6, , 7]);
                            validation = this.validateBatchInput(outcomes);
                            if (!validation.isValid) {
                                result.success = false;
                                result.errors = validation.errors;
                                return [2 /*return*/, result];
                            }
                            batchSize = 50;
                            batches = this.chunkArray(outcomes, batchSize);
                            _i = 0, batches_1 = batches;
                            _b.label = 2;
                        case 2:
                            if (!(_i < batches_1.length)) return [3 /*break*/, 5];
                            batch = batches_1[_i];
                            return [4 /*yield*/, this.processBatch(userId, batch)];
                        case 3:
                            batchResult = _b.sent();
                            result.processedCount += batchResult.processedCount;
                            result.successCount += batchResult.successCount;
                            result.failureCount += batchResult.failureCount;
                            result.masteryUpdates += batchResult.masteryUpdates;
                            result.stageProgressions += batchResult.stageProgressions;
                            if (batchResult.errors.length > 0) {
                                (_a = result.errors).push.apply(_a, batchResult.errors);
                            }
                            _b.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5:
                            result.processingTime = Date.now() - startTime;
                            this.logger.log("Batch processing completed: ".concat(result.processedCount, " items in ").concat(result.processingTime, "ms"));
                            return [3 /*break*/, 7];
                        case 6:
                            error_1 = _b.sent();
                            result.success = false;
                            result.errors.push("Batch processing failed: ".concat(error_1.message));
                            this.logger.error("Batch processing error: ".concat(error_1.message), error_1.stack);
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/, result];
                    }
                });
            });
        };
        /**
         * Process a single batch of review outcomes
         */
        EnhancedBatchReviewService_1.prototype.processBatch = function (userId, outcomes) {
            return __awaiter(this, void 0, void 0, function () {
                var result, criterionGroups, _i, criterionGroups_1, _a, criterionId, criterionOutcomes, criterionResult, error_2;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            result = {
                                success: true,
                                processedCount: 0,
                                successCount: 0,
                                failureCount: 0,
                                masteryUpdates: 0,
                                stageProgressions: 0,
                                errors: [],
                                processingTime: 0
                            };
                            criterionGroups = this.groupOutcomesByCriterion(outcomes);
                            _i = 0, criterionGroups_1 = criterionGroups;
                            _b.label = 1;
                        case 1:
                            if (!(_i < criterionGroups_1.length)) return [3 /*break*/, 6];
                            _a = criterionGroups_1[_i], criterionId = _a[0], criterionOutcomes = _a[1];
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.processCriterionBatch(userId, criterionId, criterionOutcomes)];
                        case 3:
                            criterionResult = _b.sent();
                            result.processedCount += criterionResult.processedCount;
                            result.successCount += criterionResult.successCount;
                            result.failureCount += criterionResult.failureCount;
                            result.masteryUpdates += criterionResult.masteryUpdates;
                            result.stageProgressions += criterionResult.stageProgressions;
                            return [3 /*break*/, 5];
                        case 4:
                            error_2 = _b.sent();
                            result.errors.push("Criterion ".concat(criterionId, " processing failed: ").concat(error_2.message));
                            result.failureCount += criterionOutcomes.length;
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, result];
                    }
                });
            });
        };
        /**
         * Process all outcomes for a single criterion
         */
        EnhancedBatchReviewService_1.prototype.processCriterionBatch = function (userId, criterionId, outcomes) {
            return __awaiter(this, void 0, void 0, function () {
                var result, sortedOutcomes, _i, sortedOutcomes_1, outcome, masteryUpdate, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            result = {
                                success: true,
                                processedCount: 0,
                                successCount: 0,
                                failureCount: 0,
                                masteryUpdates: 0,
                                stageProgressions: 0,
                                errors: [],
                                processingTime: 0
                            };
                            sortedOutcomes = outcomes.sort(function (a, b) {
                                return a.reviewDate.getTime() - b.reviewDate.getTime();
                            });
                            _i = 0, sortedOutcomes_1 = sortedOutcomes;
                            _a.label = 1;
                        case 1:
                            if (!(_i < sortedOutcomes_1.length)) return [3 /*break*/, 6];
                            outcome = sortedOutcomes_1[_i];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.processSingleOutcome(userId, outcome)];
                        case 3:
                            masteryUpdate = _a.sent();
                            result.processedCount++;
                            result.successCount++;
                            if (masteryUpdate.masteryScore !== masteryUpdate.oldMasteryScore) {
                                result.masteryUpdates++;
                            }
                            if (masteryUpdate.stageProgression) {
                                result.stageProgressions++;
                            }
                            return [3 /*break*/, 5];
                        case 4:
                            error_3 = _a.sent();
                            result.failureCount++;
                            result.errors.push("Outcome processing failed: ".concat(error_3.message));
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, result];
                    }
                });
            });
        };
        /**
         * Process a single review outcome
         */
        EnhancedBatchReviewService_1.prototype.processSingleOutcome = function (userId, outcome) {
            return __awaiter(this, void 0, void 0, function () {
                var criterionId, isCorrect, reviewDate, timeSpentSeconds, confidence, currentProgress, oldMasteryScore, newMasteryScore, isMastered, stageProgression, nextReviewAt;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            criterionId = outcome.criterionId, isCorrect = outcome.isCorrect, reviewDate = outcome.reviewDate, timeSpentSeconds = outcome.timeSpentSeconds, confidence = outcome.confidence;
                            return [4 /*yield*/, this.getMasteryProgress(userId, criterionId)];
                        case 1:
                            currentProgress = _a.sent();
                            if (!currentProgress) {
                                throw new Error("No mastery progress found for criterion ".concat(criterionId));
                            }
                            oldMasteryScore = currentProgress.masteryScore;
                            newMasteryScore = this.calculateNewMasteryScore(oldMasteryScore, isCorrect, confidence, timeSpentSeconds);
                            isMastered = newMasteryScore >= currentProgress.masteryThreshold;
                            return [4 /*yield*/, this.checkStageProgression(userId, criterionId, newMasteryScore, isMastered)];
                        case 2:
                            stageProgression = _a.sent();
                            // Update mastery progress
                            return [4 /*yield*/, this.updateMasteryProgress(userId, criterionId, {
                                    masteryScore: newMasteryScore,
                                    isMastered: isMastered,
                                    lastReviewAt: reviewDate,
                                    consecutiveCorrect: isCorrect ? currentProgress.consecutiveCorrect + 1 : 0,
                                    consecutiveIncorrect: isCorrect ? 0 : currentProgress.consecutiveIncorrect + 1
                                })];
                        case 3:
                            // Update mastery progress
                            _a.sent();
                            nextReviewAt = this.calculateNextReviewInterval(currentProgress.intervalStep, isCorrect, currentProgress.trackingIntensity);
                            // Update review schedule
                            return [4 /*yield*/, this.updateReviewSchedule(userId, criterionId, nextReviewAt)];
                        case 4:
                            // Update review schedule
                            _a.sent();
                            return [2 /*return*/, {
                                    criterionId: criterionId,
                                    oldMasteryScore: oldMasteryScore,
                                    newMasteryScore: newMasteryScore,
                                    isMastered: isMastered,
                                    stageProgression: stageProgression,
                                    nextReviewAt: nextReviewAt
                                }];
                    }
                });
            });
        };
        /**
         * Calculate new mastery score based on performance
         */
        EnhancedBatchReviewService_1.prototype.calculateNewMasteryScore = function (currentScore, isCorrect, confidence, timeSpentSeconds) {
            var scoreChange = 0;
            if (isCorrect) {
                // Positive score change based on confidence and time efficiency
                var confidenceBonus = confidence * 0.1; // 0-10% bonus
                var timeBonus = Math.max(0, (60 - timeSpentSeconds) / 60 * 0.05); // 0-5% bonus for speed
                scoreChange = 0.05 + confidenceBonus + timeBonus; // Base 5% + bonuses
            }
            else {
                // Negative score change based on confidence (higher confidence = bigger penalty)
                scoreChange = -(confidence * 0.1); // 0-10% penalty
            }
            // Apply score change with bounds
            var newScore = Math.max(0, Math.min(1, currentScore + scoreChange));
            return Math.round(newScore * 100) / 100; // Round to 2 decimal places
        };
        /**
         * Check if user can progress to next UUE stage
         */
        EnhancedBatchReviewService_1.prototype.checkStageProgression = function (userId, criterionId, masteryScore, isMastered) {
            return __awaiter(this, void 0, void 0, function () {
                var currentStage, stageCriteria, allStageCriteriaMastered;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!isMastered) {
                                return [2 /*return*/, false];
                            }
                            return [4 /*yield*/, this.getCurrentUueStage(userId, criterionId)];
                        case 1:
                            currentStage = _a.sent();
                            return [4 /*yield*/, this.getStageCriteria(userId, currentStage)];
                        case 2:
                            stageCriteria = _a.sent();
                            allStageCriteriaMastered = stageCriteria.every(function (criterion) {
                                return criterion.masteryScore >= criterion.masteryThreshold;
                            });
                            if (!allStageCriteriaMastered) return [3 /*break*/, 4];
                            // Progress to next stage
                            return [4 /*yield*/, this.progressToNextStage(userId, criterionId, currentStage)];
                        case 3:
                            // Progress to next stage
                            _a.sent();
                            return [2 /*return*/, true];
                        case 4: return [2 /*return*/, false];
                    }
                });
            });
        };
        /**
         * Calculate next review interval
         */
        EnhancedBatchReviewService_1.prototype.calculateNextReviewInterval = function (currentInterval, isCorrect, trackingIntensity) {
            var newInterval;
            if (isCorrect) {
                // Progressive interval increase
                newInterval = Math.min(currentInterval * 1.5, 180); // Cap at 6 months
            }
            else {
                // Reset to shorter interval on failure
                newInterval = Math.max(1, Math.floor(currentInterval * 0.5));
            }
            // Apply tracking intensity multiplier
            var intensityMultipliers = {
                'DENSE': 0.7,
                'NORMAL': 1.0,
                'SPARSE': 1.5
            };
            var multiplier = intensityMultipliers[trackingIntensity] || 1.0;
            var adjustedInterval = Math.round(newInterval * multiplier);
            var nextReviewAt = new Date();
            nextReviewAt.setDate(nextReviewAt.getDate() + adjustedInterval);
            return nextReviewAt;
        };
        /**
         * Validate batch input data
         */
        EnhancedBatchReviewService_1.prototype.validateBatchInput = function (outcomes) {
            var result = {
                isValid: true,
                errors: [],
                warnings: [],
                recommendations: []
            };
            if (!outcomes || outcomes.length === 0) {
                result.isValid = false;
                result.errors.push('No outcomes provided');
                return result;
            }
            if (outcomes.length > 1000) {
                result.warnings.push('Large batch size may impact performance');
                result.recommendations.push('Consider processing in smaller batches');
            }
            // Validate individual outcomes
            for (var i = 0; i < outcomes.length; i++) {
                var outcome = outcomes[i];
                if (!outcome.userId || !outcome.criterionId) {
                    result.errors.push("Outcome ".concat(i, ": Missing userId or criterionId"));
                    result.isValid = false;
                }
                if (outcome.confidence < 0 || outcome.confidence > 1) {
                    result.errors.push("Outcome ".concat(i, ": Invalid confidence value (0-1)"));
                    result.isValid = false;
                }
                if (outcome.timeSpentSeconds < 0) {
                    result.errors.push("Outcome ".concat(i, ": Invalid time spent"));
                    result.isValid = false;
                }
            }
            return result;
        };
        /**
         * Group outcomes by criterion for batch processing
         */
        EnhancedBatchReviewService_1.prototype.groupOutcomesByCriterion = function (outcomes) {
            var groups = new Map();
            for (var _i = 0, outcomes_1 = outcomes; _i < outcomes_1.length; _i++) {
                var outcome = outcomes_1[_i];
                if (!groups.has(outcome.criterionId)) {
                    groups.set(outcome.criterionId, []);
                }
                groups.get(outcome.criterionId).push(outcome);
            }
            return groups;
        };
        /**
         * Split array into chunks for batch processing
         */
        EnhancedBatchReviewService_1.prototype.chunkArray = function (array, chunkSize) {
            var chunks = [];
            for (var i = 0; i < array.length; i += chunkSize) {
                chunks.push(array.slice(i, i + chunkSize));
            }
            return chunks;
        };
        // Mock helper methods for development
        EnhancedBatchReviewService_1.prototype.getMasteryProgress = function (userId, criterionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, {
                            masteryScore: 0.5,
                            masteryThreshold: 0.8,
                            intervalStep: 7,
                            trackingIntensity: 'NORMAL',
                            consecutiveCorrect: 0,
                            consecutiveIncorrect: 0
                        }];
                });
            });
        };
        EnhancedBatchReviewService_1.prototype.updateMasteryProgress = function (userId, criterionId, data) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/];
                });
            });
        };
        EnhancedBatchReviewService_1.prototype.updateReviewSchedule = function (userId, criterionId, nextReviewAt) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/];
                });
            });
        };
        EnhancedBatchReviewService_1.prototype.getCurrentUueStage = function (userId, criterionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, 'UNDERSTAND'];
                });
            });
        };
        EnhancedBatchReviewService_1.prototype.getStageCriteria = function (userId, stage) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, []];
                });
            });
        };
        EnhancedBatchReviewService_1.prototype.progressToNextStage = function (userId, criterionId, currentStage) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/];
                });
            });
        };
        return EnhancedBatchReviewService_1;
    }());
    __setFunctionName(_classThis, "EnhancedBatchReviewService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EnhancedBatchReviewService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EnhancedBatchReviewService = _classThis;
}();
exports.EnhancedBatchReviewService = EnhancedBatchReviewService;
