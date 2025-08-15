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
exports.IntelligentContextBuilder = void 0;
var client_1 = require("@prisma/client");
var contextAssembly_service_1 = require("./contextAssembly.service");
var prisma = new client_1.PrismaClient();
var IntelligentContextBuilder = /** @class */ (function () {
    function IntelligentContextBuilder() {
        this.contextAssemblyService = new contextAssembly_service_1.default();
    }
    /**
     * Main context building method
     * Builds comprehensive context with intelligent optimization
     */
    IntelligentContextBuilder.prototype.buildContext = function (query_1, userId_1) {
        return __awaiter(this, arguments, void 0, function (query, userId, options, diversityConfig) {
            var startTime, baseContext, optimizedContext, recommendations, qualityMetrics, diversityScore, processingTime, error_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.contextAssemblyService.assembleContext(query, userId, options)];
                    case 2:
                        baseContext = _a.sent();
                        return [4 /*yield*/, this.optimizeContextContent(baseContext, options, diversityConfig)];
                    case 3:
                        optimizedContext = _a.sent();
                        return [4 /*yield*/, this.generateContextRecommendations(optimizedContext, userId, options)];
                    case 4:
                        recommendations = _a.sent();
                        return [4 /*yield*/, this.calculateContentQualityMetrics(optimizedContext)];
                    case 5:
                        qualityMetrics = _a.sent();
                        diversityScore = this.calculateDiversityScore(optimizedContext);
                        processingTime = Date.now() - startTime;
                        return [2 /*return*/, {
                                context: optimizedContext,
                                metadata: {
                                    processingTimeMs: processingTime,
                                    sourcesUsed: this.extractSourcesUsed(baseContext),
                                    contentQuality: qualityMetrics,
                                    diversityScore: diversityScore,
                                    relevanceScore: qualityMetrics.averageRelevance
                                },
                                recommendations: recommendations
                            }];
                    case 6:
                        error_1 = _a.sent();
                        console.error('Intelligent context building failed:', error_1);
                        throw new Error("Intelligent context building failed: ".concat(error_1.message));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Optimizes context content for better quality and diversity
     */
    IntelligentContextBuilder.prototype.optimizeContextContent = function (context, options, diversityConfig) {
        return __awaiter(this, void 0, void 0, function () {
            var config, diversifiedContent, complexityBalanced, ueeOptimized, sourceOptimized;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = diversityConfig || this.getDefaultDiversityConfig();
                        return [4 /*yield*/, this.applyDiversityOptimization(context, config)];
                    case 1:
                        diversifiedContent = _a.sent();
                        return [4 /*yield*/, this.balanceComplexityDistribution(diversifiedContent)];
                    case 2:
                        complexityBalanced = _a.sent();
                        return [4 /*yield*/, this.optimizeUeeProgression(complexityBalanced)];
                    case 3:
                        ueeOptimized = _a.sent();
                        return [4 /*yield*/, this.applySourceVarietyOptimization(ueeOptimized, config)];
                    case 4:
                        sourceOptimized = _a.sent();
                        return [2 /*return*/, sourceOptimized];
                }
            });
        });
    };
    /**
     * Applies diversity optimization to content selection
     */
    IntelligentContextBuilder.prototype.applyDiversityOptimization = function (context, config) {
        return __awaiter(this, void 0, void 0, function () {
            var optimized;
            return __generator(this, function (_a) {
                optimized = {
                    content: {
                        sections: [],
                        primitives: [],
                        notes: [],
                        relationships: []
                    },
                    relationships: context.learningPath || [],
                    learningPaths: context.criterionLearningPaths || [],
                    userProgress: context.userProgress || null,
                    metadata: context.metadata || {
                        totalContent: 0,
                        contentDistribution: { sections: 0, primitives: 0, notes: 0, relationships: 0 },
                        confidence: 0
                    }
                };
                // Optimize sections
                optimized.content.sections = this.optimizeSectionDiversity(context.relevantSections || [], config.contentTypeWeights.sections);
                // Optimize primitives
                optimized.content.primitives = this.optimizePrimitiveDiversity(context.relatedConcepts || [], config.contentTypeWeights.primitives);
                // Optimize notes
                optimized.content.notes = this.optimizeNoteDiversity(context.relevantNotes || [], config.contentTypeWeights.notes);
                // Optimize relationships
                optimized.content.relationships = this.optimizeRelationshipDiversity(context.learningPath || [], config.contentTypeWeights.relationships);
                return [2 /*return*/, optimized];
            });
        });
    };
    /**
     * Balances complexity distribution across content
     */
    IntelligentContextBuilder.prototype.balanceComplexityDistribution = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var balanced;
            return __generator(this, function (_a) {
                balanced = __assign({}, context);
                // Balance primitive complexity
                if (balanced.content.primitives.length > 0) {
                    balanced.content.primitives = this.balancePrimitiveComplexity(balanced.content.primitives);
                }
                // Balance section difficulty
                if (balanced.content.sections.length > 0) {
                    balanced.content.sections = this.balanceSectionDifficulty(balanced.content.sections);
                }
                return [2 /*return*/, balanced];
            });
        });
    };
    /**
     * Optimizes UEE stage progression
     */
    IntelligentContextBuilder.prototype.optimizeUeeProgression = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var optimized;
            return __generator(this, function (_a) {
                optimized = __assign({}, context);
                // Ensure UEE progression follows optimal order
                if (optimized.learningPaths.length > 0) {
                    optimized.learningPaths = this.optimizeLearningPathUeeProgression(optimized.learningPaths);
                }
                // Balance UEE stages in content
                if (optimized.content.primitives.length > 0) {
                    optimized.content.primitives = this.balanceUeeStages(optimized.content.primitives);
                }
                return [2 /*return*/, optimized];
            });
        });
    };
    /**
     * Applies source variety optimization
     */
    IntelligentContextBuilder.prototype.applySourceVarietyOptimization = function (context, config) {
        return __awaiter(this, void 0, void 0, function () {
            var optimized;
            return __generator(this, function (_a) {
                if (!config.sourceVariety)
                    return [2 /*return*/, context];
                optimized = __assign({}, context);
                // Ensure content comes from diverse sources
                optimized.content.sections = this.ensureSourceVariety(optimized.content.sections, 'blueprintSectionId');
                optimized.content.primitives = this.ensureSourceVariety(optimized.content.primitives, 'blueprintSectionId');
                return [2 /*return*/, optimized];
            });
        });
    };
    /**
     * Generates context recommendations
     */
    IntelligentContextBuilder.prototype.generateContextRecommendations = function (context, userId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendations, contentGaps, learningOpportunities, goalAlignment, difficultyBalance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        recommendations = [];
                        return [4 /*yield*/, this.analyzeContentGaps(context, userId)];
                    case 1:
                        contentGaps = _a.sent();
                        if (contentGaps.length > 0) {
                            recommendations.push({
                                type: 'content',
                                priority: 'high',
                                description: "Content gaps detected in ".concat(contentGaps.length, " areas"),
                                action: 'Consider adding more content in identified areas',
                                confidence: 0.8
                            });
                        }
                        return [4 /*yield*/, this.analyzeLearningOpportunities(context, userId)];
                    case 2:
                        learningOpportunities = _a.sent();
                        if (learningOpportunities.length > 0) {
                            recommendations.push({
                                type: 'learning_path',
                                priority: 'medium',
                                description: "".concat(learningOpportunities.length, " learning path opportunities identified"),
                                action: 'Explore suggested learning pathways',
                                confidence: 0.7
                            });
                        }
                        return [4 /*yield*/, this.analyzeUserGoalAlignment(context, userId)];
                    case 3:
                        goalAlignment = _a.sent();
                        if (goalAlignment.score < 0.7) {
                            recommendations.push({
                                type: 'user_goal',
                                priority: 'medium',
                                description: 'Content may not align with current learning goals',
                                action: 'Review and adjust learning objectives',
                                confidence: 0.6
                            });
                        }
                        return [4 /*yield*/, this.analyzeDifficultyBalance(context)];
                    case 4:
                        difficultyBalance = _a.sent();
                        if (difficultyBalance.needsAdjustment) {
                            recommendations.push({
                                type: 'difficulty_adjustment',
                                priority: 'low',
                                description: 'Difficulty progression could be optimized',
                                action: 'Consider adjusting content complexity sequence',
                                confidence: 0.5
                            });
                        }
                        return [2 /*return*/, recommendations];
                }
            });
        });
    };
    /**
     * Calculates content quality metrics
     */
    IntelligentContextBuilder.prototype.calculateContentQualityMetrics = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var sections, primitives, notes, allContent, averageRelevance, contentFreshness, sourceDiversity, complexityBalance, ueeProgression;
            return __generator(this, function (_a) {
                sections = context.content.sections;
                primitives = context.content.primitives;
                notes = context.content.notes;
                allContent = __spreadArray(__spreadArray(__spreadArray([], sections, true), primitives, true), notes, true);
                averageRelevance = allContent.length > 0
                    ? allContent.reduce(function (sum, item) { return sum + (item.relevanceScore || 0); }, 0) / allContent.length
                    : 0;
                contentFreshness = this.calculateContentFreshness(allContent);
                sourceDiversity = this.calculateSourceDiversity(context);
                complexityBalance = this.calculateComplexityBalance(primitives);
                ueeProgression = this.calculateUeeProgression(context);
                return [2 /*return*/, {
                        averageRelevance: averageRelevance,
                        contentFreshness: contentFreshness,
                        sourceDiversity: sourceDiversity,
                        complexityBalance: complexityBalance,
                        ueeProgression: ueeProgression
                    }];
            });
        });
    };
    /**
     * Calculates diversity score
     */
    IntelligentContextBuilder.prototype.calculateDiversityScore = function (context) {
        var sections = context.content.sections.length;
        var primitives = context.content.primitives.length;
        var notes = context.content.notes.length;
        var relationships = context.content.relationships.length;
        var total = sections + primitives + notes + relationships;
        if (total === 0)
            return 0;
        // Calculate diversity using Shannon entropy
        var proportions = [sections, primitives, notes, relationships].map(function (count) { return count / total; });
        var entropy = proportions.reduce(function (sum, p) {
            if (p > 0)
                return sum - p * Math.log2(p);
            return sum;
        }, 0);
        // Normalize to 0-1 range
        return entropy / Math.log2(4); // 4 content types
    };
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    IntelligentContextBuilder.prototype.getDefaultDiversityConfig = function () {
        return {
            minDiversityScore: 0.6,
            contentTypeWeights: {
                sections: 0.3,
                primitives: 0.4,
                notes: 0.2,
                relationships: 0.1
            },
            complexitySpread: 0.5,
            ueeStageBalance: true,
            sourceVariety: true
        };
    };
    IntelligentContextBuilder.prototype.optimizeSectionDiversity = function (sections, targetCount) {
        if (sections.length <= targetCount)
            return sections;
        // Sort by relevance and diversity
        return sections
            .sort(function (a, b) {
            var relevanceDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
            if (Math.abs(relevanceDiff) > 0.1)
                return relevanceDiff;
            // Prefer sections from different depths for diversity
            return Math.abs(a.depth - b.depth);
        })
            .slice(0, targetCount);
    };
    IntelligentContextBuilder.prototype.optimizePrimitiveDiversity = function (primitives, targetCount) {
        if (primitives.length <= targetCount)
            return primitives;
        // Sort by relevance and type diversity
        return primitives
            .sort(function (a, b) {
            var relevanceDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
            if (Math.abs(relevanceDiff) > 0.1)
                return relevanceDiff;
            // Prefer different primitive types for diversity
            return a.primitiveType.localeCompare(b.primitiveType);
        })
            .slice(0, targetCount);
    };
    IntelligentContextBuilder.prototype.optimizeNoteDiversity = function (notes, targetCount) {
        if (notes.length <= targetCount)
            return notes;
        // Sort by relevance and content diversity
        return notes
            .sort(function (a, b) {
            var relevanceDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
            if (Math.abs(relevanceDiff) > 0.1)
                return relevanceDiff;
            // Prefer notes from different sections for diversity
            return a.blueprintSectionId - b.blueprintSectionId;
        })
            .slice(0, targetCount);
    };
    IntelligentContextBuilder.prototype.optimizeRelationshipDiversity = function (relationships, targetCount) {
        if (relationships.length <= targetCount)
            return relationships;
        // Sort by strength and type diversity
        return relationships
            .sort(function (a, b) {
            var strengthDiff = (b.strength || 0) - (a.strength || 0);
            if (Math.abs(strengthDiff) > 0.1)
                return strengthDiff;
            // Prefer different relationship types for diversity
            return a.relationshipType.localeCompare(b.relationshipType);
        })
            .slice(0, targetCount);
    };
    IntelligentContextBuilder.prototype.balancePrimitiveComplexity = function (primitives) {
        if (primitives.length <= 1)
            return primitives;
        // Sort by complexity and interleave for balance
        var sorted = primitives.sort(function (a, b) {
            return (a.complexityScore || 0) - (b.complexityScore || 0);
        });
        var balanced = [];
        var mid = Math.floor(sorted.length / 2);
        for (var i = 0; i < mid; i++) {
            balanced.push(sorted[i]);
            if (i + mid < sorted.length) {
                balanced.push(sorted[i + mid]);
            }
        }
        return balanced;
    };
    IntelligentContextBuilder.prototype.balanceSectionDifficulty = function (sections) {
        if (sections.length <= 1)
            return sections;
        // Group by difficulty and interleave
        var byDifficulty = {
            BEGINNER: sections.filter(function (s) { return s.difficulty === 'BEGINNER'; }),
            INTERMEDIATE: sections.filter(function (s) { return s.difficulty === 'INTERMEDIATE'; }),
            ADVANCED: sections.filter(function (s) { return s.difficulty === 'ADVANCED'; })
        };
        var balanced = [];
        var maxLength = Math.max(byDifficulty.BEGINNER.length, byDifficulty.INTERMEDIATE.length, byDifficulty.ADVANCED.length);
        for (var i = 0; i < maxLength; i++) {
            if (i < byDifficulty.BEGINNER.length)
                balanced.push(byDifficulty.BEGINNER[i]);
            if (i < byDifficulty.INTERMEDIATE.length)
                balanced.push(byDifficulty.INTERMEDIATE[i]);
            if (i < byDifficulty.ADVANCED.length)
                balanced.push(byDifficulty.ADVANCED[i]);
        }
        return balanced;
    };
    IntelligentContextBuilder.prototype.optimizeLearningPathUeeProgression = function (learningPaths) {
        return learningPaths.sort(function (a, b) {
            var _a, _b, _c, _d;
            // Prefer paths with optimal UEE progression
            if (((_a = a.ueeProgression) === null || _a === void 0 ? void 0 : _a.isOptimal) && !((_b = b.ueeProgression) === null || _b === void 0 ? void 0 : _b.isOptimal))
                return -1;
            if (!((_c = a.ueeProgression) === null || _c === void 0 ? void 0 : _c.isOptimal) && ((_d = b.ueeProgression) === null || _d === void 0 ? void 0 : _d.isOptimal))
                return 1;
            // Then sort by cost
            return a.cost - b.cost;
        });
    };
    IntelligentContextBuilder.prototype.balanceUeeStages = function (primitives) {
        // This would balance UEE stages across primitives
        // For now, return as-is
        return primitives;
    };
    IntelligentContextBuilder.prototype.ensureSourceVariety = function (content, sourceField) {
        var sourceCounts = new Map();
        // Count content per source
        content.forEach(function (item) {
            var sourceId = item[sourceField];
            if (sourceId) {
                sourceCounts.set(sourceId, (sourceCounts.get(sourceId) || 0) + 1);
            }
        });
        // If any source has too much content, redistribute
        var maxPerSource = Math.ceil(content.length / sourceCounts.size);
        var redistributed = [];
        var _loop_1 = function (sourceId, count) {
            var sourceContent = content.filter(function (item) { return item[sourceField] === sourceId; });
            redistributed.push.apply(redistributed, sourceContent.slice(0, maxPerSource));
        };
        for (var _i = 0, sourceCounts_1 = sourceCounts; _i < sourceCounts_1.length; _i++) {
            var _a = sourceCounts_1[_i], sourceId = _a[0], count = _a[1];
            _loop_1(sourceId, count);
        }
        return redistributed;
    };
    IntelligentContextBuilder.prototype.analyzeContentGaps = function (context, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder for content gap analysis
                return [2 /*return*/, []];
            });
        });
    };
    IntelligentContextBuilder.prototype.analyzeLearningOpportunities = function (context, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder for learning opportunity analysis
                return [2 /*return*/, []];
            });
        });
    };
    IntelligentContextBuilder.prototype.analyzeUserGoalAlignment = function (context, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder for goal alignment analysis
                return [2 /*return*/, { score: 0.8, details: 'Good alignment with current goals' }];
            });
        });
    };
    IntelligentContextBuilder.prototype.analyzeDifficultyBalance = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder for difficulty balance analysis
                return [2 /*return*/, { needsAdjustment: false, details: 'Difficulty progression is balanced' }];
            });
        });
    };
    IntelligentContextBuilder.prototype.calculateContentFreshness = function (content) {
        if (content.length === 0)
            return 0;
        var now = Date.now();
        var freshnessScores = content.map(function (item) {
            if (!item.updatedAt)
                return 0.5; // Default for items without update time
            var daysSinceUpdate = (now - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate < 1)
                return 1.0;
            if (daysSinceUpdate < 7)
                return 0.8;
            if (daysSinceUpdate < 30)
                return 0.6;
            if (daysSinceUpdate < 90)
                return 0.4;
            return 0.2;
        });
        return freshnessScores.reduce(function (sum, score) { return sum + score; }, 0) / freshnessScores.length;
    };
    IntelligentContextBuilder.prototype.calculateSourceDiversity = function (context) {
        var sources = new Set();
        context.content.sections.forEach(function (s) { return sources.add(s.id); });
        context.content.primitives.forEach(function (p) { return sources.add(p.id); });
        context.content.notes.forEach(function (n) { return sources.add(n.id); });
        return sources.size / (context.content.sections.length + context.content.primitives.length + context.content.notes.length);
    };
    IntelligentContextBuilder.prototype.calculateComplexityBalance = function (primitives) {
        if (primitives.length <= 1)
            return 1.0;
        var complexities = primitives.map(function (p) { return p.complexityScore || 1; });
        var mean = complexities.reduce(function (sum, c) { return sum + c; }, 0) / complexities.length;
        var variance = complexities.reduce(function (sum, c) { return sum + Math.pow(c - mean, 2); }, 0) / complexities.length;
        // Lower variance = better balance
        return Math.max(0, 1 - Math.sqrt(variance) / 10);
    };
    IntelligentContextBuilder.prototype.calculateUeeProgression = function (context) {
        if (context.learningPaths.length === 0)
            return 0;
        var optimalPaths = context.learningPaths.filter(function (path) { var _a; return (_a = path.ueeProgression) === null || _a === void 0 ? void 0 : _a.isOptimal; });
        return optimalPaths.length / context.learningPaths.length;
    };
    IntelligentContextBuilder.prototype.extractSourcesUsed = function (context) {
        var _a, _b, _c, _d, _e;
        var sources = [];
        if ((_a = context.relevantSections) === null || _a === void 0 ? void 0 : _a.length)
            sources.push('blueprint_sections');
        if ((_b = context.relevantPrimitives) === null || _b === void 0 ? void 0 : _b.length)
            sources.push('knowledge_primitives');
        if ((_c = context.relevantNotes) === null || _c === void 0 ? void 0 : _c.length)
            sources.push('notes');
        if ((_d = context.learningPath) === null || _d === void 0 ? void 0 : _d.length)
            sources.push('knowledge_relationships');
        if ((_e = context.criterionLearningPaths) === null || _e === void 0 ? void 0 : _e.length)
            sources.push('mastery_criteria');
        if (context.userProgress)
            sources.push('user_context');
        return sources;
    };
    return IntelligentContextBuilder;
}());
exports.IntelligentContextBuilder = IntelligentContextBuilder;
exports.default = IntelligentContextBuilder;
