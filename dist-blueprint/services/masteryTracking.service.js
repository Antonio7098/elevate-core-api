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
exports.MasteryTrackingService = exports.UueStage = exports.MasteryThreshold = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var MasteryThreshold;
(function (MasteryThreshold) {
    MasteryThreshold["SURVEY"] = "SURVEY";
    MasteryThreshold["PROFICIENT"] = "PROFICIENT";
    MasteryThreshold["EXPERT"] = "EXPERT";
})(MasteryThreshold || (exports.MasteryThreshold = MasteryThreshold = {}));
var UueStage;
(function (UueStage) {
    UueStage["UNDERSTAND"] = "UNDERSTAND";
    UueStage["USE"] = "USE";
    UueStage["EXPLORE"] = "EXPLORE";
})(UueStage || (exports.UueStage = UueStage = {}));
var MasteryTrackingService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var MasteryTrackingService = _classThis = /** @class */ (function () {
        function MasteryTrackingService_1() {
            var _a;
            this.logger = new common_1.Logger(MasteryTrackingService.name);
            this.prisma = new client_1.PrismaClient();
            // Default mastery thresholds
            this.defaultThresholds = (_a = {},
                _a[MasteryThreshold.SURVEY] = {
                    threshold: MasteryThreshold.SURVEY,
                    value: 0.6,
                    description: 'Basic familiarity - 60%',
                    color: '#FFA500'
                },
                _a[MasteryThreshold.PROFICIENT] = {
                    threshold: MasteryThreshold.PROFICIENT,
                    value: 0.8,
                    description: 'Solid understanding - 80%',
                    color: '#32CD32'
                },
                _a[MasteryThreshold.EXPERT] = {
                    threshold: MasteryThreshold.EXPERT,
                    value: 0.95,
                    description: 'Deep mastery - 95%',
                    color: '#4169E1'
                },
                _a);
        }
        /**
         * Update mastery score for a criterion
         * Implements user-configurable mastery thresholds and UUE stage progression
         */
        MasteryTrackingService_1.prototype.updateMasteryScore = function (userId, criterionId, newScore, isCorrect) {
            return __awaiter(this, void 0, void 0, function () {
                var currentProgress, oldMasteryScore, thresholdValue, updatedMasteryScore, isMastered, stageProgression, nextStage, message, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            return [4 /*yield*/, this.getMasteryProgress(userId, criterionId)];
                        case 1:
                            currentProgress = _a.sent();
                            if (!currentProgress) {
                                throw new Error("No mastery progress found for criterion ".concat(criterionId));
                            }
                            oldMasteryScore = currentProgress.masteryScore;
                            thresholdValue = currentProgress.thresholdValue;
                            updatedMasteryScore = this.calculateUpdatedScore(oldMasteryScore, newScore, isCorrect);
                            isMastered = updatedMasteryScore >= thresholdValue;
                            return [4 /*yield*/, this.checkUueStageProgression(userId, criterionId, updatedMasteryScore, isMastered)];
                        case 2:
                            stageProgression = _a.sent();
                            nextStage = stageProgression ? this.getNextStage(currentProgress.currentStage) : null;
                            // Update mastery progress in database
                            return [4 /*yield*/, this.updateMasteryProgress(userId, criterionId, {
                                    masteryScore: updatedMasteryScore,
                                    isMastered: isMastered,
                                    lastReviewAt: new Date(),
                                    consecutiveCorrect: isCorrect ? currentProgress.consecutiveCorrect + 1 : 0,
                                    consecutiveIncorrect: isCorrect ? 0 : currentProgress.consecutiveIncorrect + 1
                                })];
                        case 3:
                            // Update mastery progress in database
                            _a.sent();
                            message = this.generateMasteryMessage(oldMasteryScore, updatedMasteryScore, isMastered, stageProgression, nextStage);
                            this.logger.log("Mastery updated for user ".concat(userId, ", criterion ").concat(criterionId, ": ").concat(oldMasteryScore, " \u2192 ").concat(updatedMasteryScore));
                            return [2 /*return*/, {
                                    success: true,
                                    oldMasteryScore: oldMasteryScore,
                                    newMasteryScore: updatedMasteryScore,
                                    isMastered: isMastered,
                                    stageProgression: stageProgression,
                                    nextStage: nextStage,
                                    message: message
                                }];
                        case 4:
                            error_1 = _a.sent();
                            this.logger.error("Error updating mastery score: ".concat(error_1.message), error_1.stack);
                            throw error_1;
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get mastery progress for a user and criterion
         */
        MasteryTrackingService_1.prototype.getMasteryProgress = function (userId, criterionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, {
                                userId: userId,
                                criterionId: criterionId,
                                masteryScore: 0.5,
                                isMastered: false,
                                currentStage: UueStage.UNDERSTAND,
                                consecutiveCorrect: 0,
                                consecutiveIncorrect: 0,
                                lastReviewAt: new Date(),
                                nextReviewAt: new Date(),
                                masteryThreshold: MasteryThreshold.PROFICIENT,
                                thresholdValue: 0.8
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error getting mastery progress: ".concat(error.message), error.stack);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Get UUE stage progress for a user and section
         */
        MasteryTrackingService_1.prototype.getUueStageProgress = function (userId, sectionId) {
            return __awaiter(this, void 0, void 0, function () {
                var stages, stageProgress, _i, stages_1, stage, criteria, masteredCriteria, masteryScore, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            stages = [UueStage.UNDERSTAND, UueStage.USE, UueStage.EXPLORE];
                            stageProgress = [];
                            _i = 0, stages_1 = stages;
                            _a.label = 1;
                        case 1:
                            if (!(_i < stages_1.length)) return [3 /*break*/, 4];
                            stage = stages_1[_i];
                            return [4 /*yield*/, this.getCriteriaByStage(sectionId, stage)];
                        case 2:
                            criteria = _a.sent();
                            masteredCriteria = criteria.filter(function (c) { return c.isMastered; }).length;
                            masteryScore = criteria.length > 0 ?
                                criteria.reduce(function (sum, c) { return sum + c.masteryScore; }, 0) / criteria.length : 0;
                            stageProgress.push({
                                stage: stage,
                                totalCriteria: criteria.length,
                                masteredCriteria: masteredCriteria,
                                masteryScore: masteryScore,
                                isCompleted: masteredCriteria === criteria.length && criteria.length > 0,
                                nextStage: this.getNextStage(stage),
                                prerequisites: this.getStagePrerequisites(stage)
                            });
                            _a.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/, stageProgress];
                        case 5:
                            error_2 = _a.sent();
                            this.logger.error("Error getting UUE stage progress: ".concat(error_2.message), error_2.stack);
                            throw error_2;
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Update mastery threshold for a criterion
         */
        MasteryTrackingService_1.prototype.updateMasteryThreshold = function (userId, criterionId, threshold) {
            return __awaiter(this, void 0, void 0, function () {
                var thresholdValue, currentProgress, isMastered, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            thresholdValue = this.defaultThresholds[threshold].value;
                            // Update threshold in database
                            return [4 /*yield*/, this.updateMasteryThresholdInDB(userId, criterionId, threshold, thresholdValue)];
                        case 1:
                            // Update threshold in database
                            _a.sent();
                            return [4 /*yield*/, this.getMasteryProgress(userId, criterionId)];
                        case 2:
                            currentProgress = _a.sent();
                            if (!currentProgress) return [3 /*break*/, 4];
                            isMastered = currentProgress.masteryScore >= thresholdValue;
                            return [4 /*yield*/, this.updateMasteryStatus(userId, criterionId, isMastered)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            this.logger.log("Mastery threshold updated for user ".concat(userId, ", criterion ").concat(criterionId, ": ").concat(threshold, " (").concat(thresholdValue, ")"));
                            return [3 /*break*/, 6];
                        case 5:
                            error_3 = _a.sent();
                            this.logger.error("Error updating mastery threshold: ".concat(error_3.message), error_3.stack);
                            throw error_3;
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Get mastery statistics for a user
         */
        MasteryTrackingService_1.prototype.getMasteryStats = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b;
                return __generator(this, function (_c) {
                    try {
                        // Mock implementation - in real system this would query the database
                        return [2 /*return*/, {
                                totalCriteria: 0,
                                masteredCriteria: 0,
                                stageBreakdown: (_a = {},
                                    _a[UueStage.UNDERSTAND] = { total: 0, mastered: 0, progress: 0 },
                                    _a[UueStage.USE] = { total: 0, mastered: 0, progress: 0 },
                                    _a[UueStage.EXPLORE] = { total: 0, mastered: 0, progress: 0 },
                                    _a),
                                averageMasteryScore: 0,
                                thresholdDistribution: (_b = {},
                                    _b[MasteryThreshold.SURVEY] = 0,
                                    _b[MasteryThreshold.PROFICIENT] = 0,
                                    _b[MasteryThreshold.EXPERT] = 0,
                                    _b)
                            }];
                    }
                    catch (error) {
                        this.logger.error("Error getting mastery stats: ".concat(error.message), error.stack);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * Check if user can progress to next UUE stage
         */
        MasteryTrackingService_1.prototype.checkUueStageProgression = function (userId, criterionId, masteryScore, isMastered) {
            return __awaiter(this, void 0, void 0, function () {
                var currentProgress, currentStage, sectionId, stageCriteria, allStageCriteriaMastered;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!isMastered) {
                                return [2 /*return*/, false];
                            }
                            return [4 /*yield*/, this.getMasteryProgress(userId, criterionId)];
                        case 1:
                            currentProgress = _a.sent();
                            if (!currentProgress) {
                                return [2 /*return*/, false];
                            }
                            currentStage = currentProgress.currentStage;
                            return [4 /*yield*/, this.getSectionIdForCriterion(criterionId)];
                        case 2:
                            sectionId = _a.sent();
                            if (!sectionId) {
                                return [2 /*return*/, false];
                            }
                            return [4 /*yield*/, this.getCriteriaByStage(sectionId, currentStage)];
                        case 3:
                            stageCriteria = _a.sent();
                            allStageCriteriaMastered = stageCriteria.every(function (criterion) {
                                return criterion.isMastered;
                            });
                            if (!allStageCriteriaMastered) return [3 /*break*/, 5];
                            // Progress to next stage
                            return [4 /*yield*/, this.progressToNextStage(userId, sectionId, currentStage)];
                        case 4:
                            // Progress to next stage
                            _a.sent();
                            return [2 /*return*/, true];
                        case 5: return [2 /*return*/, false];
                    }
                });
            });
        };
        /**
         * Calculate updated mastery score
         */
        MasteryTrackingService_1.prototype.calculateUpdatedScore = function (oldScore, newScore, isCorrect) {
            if (isCorrect) {
                // Progressive score increase with diminishing returns
                var scoreGap = 1 - oldScore;
                var increase = scoreGap * 0.1; // 10% of remaining gap
                return Math.min(1, oldScore + increase);
            }
            else {
                // Score decrease on failure
                var decrease = oldScore * 0.05; // 5% of current score
                return Math.max(0, oldScore - decrease);
            }
        };
        /**
         * Get next UUE stage
         */
        MasteryTrackingService_1.prototype.getNextStage = function (currentStage) {
            switch (currentStage) {
                case UueStage.UNDERSTAND:
                    return UueStage.USE;
                case UueStage.USE:
                    return UueStage.EXPLORE;
                case UueStage.EXPLORE:
                    return null; // Already at highest stage
                default:
                    return null;
            }
        };
        /**
         * Get stage prerequisites
         */
        MasteryTrackingService_1.prototype.getStagePrerequisites = function (stage) {
            switch (stage) {
                case UueStage.UNDERSTAND:
                    return []; // No prerequisites
                case UueStage.USE:
                    return ['UNDERSTAND']; // Must complete UNDERSTAND stage
                case UueStage.EXPLORE:
                    return ['UNDERSTAND', 'USE']; // Must complete both previous stages
                default:
                    return [];
            }
        };
        /**
         * Generate mastery message
         */
        MasteryTrackingService_1.prototype.generateMasteryMessage = function (oldScore, newScore, isMastered, stageProgression, nextStage) {
            if (stageProgression && nextStage) {
                return "Congratulations! You've progressed to the ".concat(nextStage, " stage!");
            }
            else if (isMastered) {
                return "Excellent! You've mastered this criterion!";
            }
            else if (newScore > oldScore) {
                return "Great progress! Your mastery increased from ".concat((oldScore * 100).toFixed(1), "% to ").concat((newScore * 100).toFixed(1), "%");
            }
            else if (newScore < oldScore) {
                return "Keep practicing! Your mastery decreased to ".concat((newScore * 100).toFixed(1), "%");
            }
            else {
                return 'Keep up the good work!';
            }
        };
        // Mock helper methods for development
        MasteryTrackingService_1.prototype.getCriteriaByStage = function (sectionId, stage) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, []];
                });
            });
        };
        MasteryTrackingService_1.prototype.getSectionIdForCriterion = function (criterionId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, 'mock-section-id'];
                });
            });
        };
        MasteryTrackingService_1.prototype.progressToNextStage = function (userId, sectionId, currentStage) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/];
                });
            });
        };
        MasteryTrackingService_1.prototype.updateMasteryProgress = function (userId, criterionId, data) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/];
                });
            });
        };
        MasteryTrackingService_1.prototype.updateMasteryThresholdInDB = function (userId, criterionId, threshold, value) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/];
                });
            });
        };
        MasteryTrackingService_1.prototype.updateMasteryStatus = function (userId, criterionId, isMastered) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/];
                });
            });
        };
        return MasteryTrackingService_1;
    }());
    __setFunctionName(_classThis, "MasteryTrackingService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MasteryTrackingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MasteryTrackingService = _classThis;
}();
exports.MasteryTrackingService = MasteryTrackingService;
