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
exports.RAGResponseGenerator = void 0;
var client_1 = require("@prisma/client");
var contextAssembly_service_1 = require("./contextAssembly.service");
var intelligentContextBuilder_service_1 = require("./intelligentContextBuilder.service");
var prisma = new client_1.PrismaClient();
var RAGResponseGenerator = /** @class */ (function () {
    function RAGResponseGenerator() {
        this.contextAssembly = new contextAssembly_service_1.default();
        this.contextBuilder = new intelligentContextBuilder_service_1.default();
    }
    /**
     * Main RAG response generation method
     * Combines vector search, graph traversal, and AI generation
     */
    RAGResponseGenerator.prototype.generateRAGResponse = function (query_1, userId_1) {
        return __awaiter(this, arguments, void 0, function (query, userId, options) {
            var startTime, context, intelligentContext, aiResponse, recommendations, response, processingTime, error_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, this.contextAssembly.assembleContext(query, userId, this.buildContextOptions(options))];
                    case 2:
                        context = _a.sent();
                        return [4 /*yield*/, this.contextBuilder.buildContext(query, userId, this.buildContextOptions(options))];
                    case 3:
                        intelligentContext = _a.sent();
                        return [4 /*yield*/, this.generateAIResponse(query, context, intelligentContext, options)];
                    case 4:
                        aiResponse = _a.sent();
                        return [4 /*yield*/, this.generateLearningRecommendations(context, intelligentContext, userId, options)];
                    case 5:
                        recommendations = _a.sent();
                        return [4 /*yield*/, this.assembleRAGResponse(aiResponse, context, intelligentContext, recommendations, options)];
                    case 6:
                        response = _a.sent();
                        processingTime = Date.now() - startTime;
                        return [2 /*return*/, __assign(__assign({}, response), { metadata: __assign(__assign({}, response.metadata), { processingTimeMs: processingTime }) })];
                    case 7:
                        error_1 = _a.sent();
                        console.error('RAG response generation failed:', error_1);
                        return [2 /*return*/, this.generateFallbackResponse(query, error_1.message)];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generates AI response using assembled context
     */
    RAGResponseGenerator.prototype.generateAIResponse = function (query, context, intelligentContext, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.generateStructuredResponse(query, context, intelligentContext, options)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, {
                                answer: response.answer,
                                confidence: response.confidence,
                                reasoning: response.reasoning
                            }];
                    case 2:
                        error_2 = _a.sent();
                        console.error('AI response generation failed:', error_2);
                        throw new Error("AI response generation failed: ".concat(error_2.message));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generates learning recommendations based on context
     */
    RAGResponseGenerator.prototype.generateLearningRecommendations = function (context, intelligentContext, userId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendations, nextSteps, reviewItems, practiceItems, exploreItems, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!options.includeRecommendations) {
                            return [2 /*return*/, []];
                        }
                        recommendations = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.generateNextStepRecommendations(context, intelligentContext, userId)];
                    case 2:
                        nextSteps = _a.sent();
                        recommendations.push.apply(recommendations, nextSteps);
                        return [4 /*yield*/, this.generateReviewRecommendations(context, intelligentContext, userId)];
                    case 3:
                        reviewItems = _a.sent();
                        recommendations.push.apply(recommendations, reviewItems);
                        return [4 /*yield*/, this.generatePracticeRecommendations(context, intelligentContext, userId)];
                    case 4:
                        practiceItems = _a.sent();
                        recommendations.push.apply(recommendations, practiceItems);
                        return [4 /*yield*/, this.generateExploreRecommendations(context, intelligentContext, userId)];
                    case 5:
                        exploreItems = _a.sent();
                        recommendations.push.apply(recommendations, exploreItems);
                        // Sort by confidence and priority
                        return [2 /*return*/, recommendations
                                .sort(function (a, b) { return b.confidence - a.confidence; })
                                .slice(0, 5)]; // Limit to top 5 recommendations
                    case 6:
                        error_3 = _a.sent();
                        console.error('Learning recommendations generation failed:', error_3);
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Assembles the final RAG response
     */
    RAGResponseGenerator.prototype.assembleRAGResponse = function (aiResponse, context, intelligentContext, recommendations, options) {
        return __awaiter(this, void 0, void 0, function () {
            var sources, learningPaths, relatedConcepts, formattedRecommendations, contextQuality;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prepareContextSources(context, options)];
                    case 1:
                        sources = _a.sent();
                        return [4 /*yield*/, this.prepareLearningPaths(context.criterionLearningPaths || [], options)];
                    case 2:
                        learningPaths = _a.sent();
                        return [4 /*yield*/, this.prepareRelatedConcepts(context.learningPath || [], options)];
                    case 3:
                        relatedConcepts = _a.sent();
                        formattedRecommendations = this.formatRecommendations(recommendations);
                        contextQuality = this.calculateContextQuality(sources, learningPaths, relatedConcepts);
                        return [2 /*return*/, {
                                answer: aiResponse.answer,
                                context: {
                                    sources: sources,
                                    learningPaths: learningPaths,
                                    relatedConcepts: relatedConcepts
                                },
                                recommendations: formattedRecommendations,
                                metadata: {
                                    processingTimeMs: 0, // Will be set by caller
                                    contextQuality: contextQuality,
                                    responseConfidence: aiResponse.confidence,
                                    sourcesUsed: this.extractSourcesUsed(context)
                                }
                            }];
                }
            });
        });
    };
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    RAGResponseGenerator.prototype.buildContextOptions = function (options) {
        return {
            maxResults: options.maxContextItems || 20,
            includeLearningPaths: options.includeLearningPaths !== false,
            maxPathDepth: 5,
            includePrerequisites: true,
            includeRelated: true
        };
    };
    RAGResponseGenerator.prototype.generateStructuredResponse = function (query, context, intelligentContext, options) {
        return __awaiter(this, void 0, void 0, function () {
            var answer, confidence, reasoning, contextQuality;
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                answer = '';
                confidence = 0.8;
                reasoning = '';
                // Build answer from context
                if ((_a = context.relevantSections) === null || _a === void 0 ? void 0 : _a.length) {
                    answer += "Based on the blueprint sections, ";
                    answer += context.relevantSections.map(function (s) { return s.title; }).join(', ');
                    answer += " are relevant to your question.\n\n";
                }
                if ((_b = context.relevantPrimitives) === null || _b === void 0 ? void 0 : _b.length) {
                    answer += "The key concepts involved are: ";
                    answer += context.relevantPrimitives.map(function (p) { return p.title; }).join(', ');
                    answer += ".\n\n";
                }
                if ((_c = context.relevantNotes) === null || _c === void 0 ? void 0 : _c.length) {
                    answer += "Additional context from notes: ";
                    answer += context.relevantNotes.map(function (n) { return n.title; }).join(', ');
                    answer += ".\n\n";
                }
                // Add learning pathway information
                if ((_d = context.criterionLearningPaths) === null || _d === void 0 ? void 0 : _d.length) {
                    answer += "Learning pathways available: ";
                    answer += context.criterionLearningPaths.map(function (p) {
                        return "".concat(p.path.length, " steps from ").concat(p.estimatedTime, " minutes");
                    }).join(', ');
                    answer += ".\n\n";
                }
                // Add UEE progression guidance
                if (context.userProgress) {
                    answer += "Based on your current progress (".concat(context.userProgress.currentUeeStage, " stage), ");
                    answer += "I recommend focusing on the next logical steps in your learning journey.\n\n";
                }
                // Add specific answer based on query
                answer += "To answer your question \"".concat(query, "\": ");
                answer += "The information is organized in the blueprint structure, ";
                answer += "and you can follow the suggested learning paths to build comprehensive understanding. ";
                answer += "Consider starting with the foundational concepts and progressing through the UEE stages.";
                contextQuality = this.calculateContextQuality(context.relevantSections || [], context.criterionLearningPaths || [], context.learningPath || []);
                confidence = Math.min(0.95, 0.7 + contextQuality * 0.25);
                reasoning = "Response generated using ".concat(((_e = context.relevantSections) === null || _e === void 0 ? void 0 : _e.length) || 0, " sections, ");
                reasoning += "".concat(((_f = context.relevantPrimitives) === null || _f === void 0 ? void 0 : _f.length) || 0, " primitives, ");
                reasoning += "".concat(((_g = context.relevantNotes) === null || _g === void 0 ? void 0 : _g.length) || 0, " notes, and ");
                reasoning += "".concat(((_h = context.criterionLearningPaths) === null || _h === void 0 ? void 0 : _h.length) || 0, " learning pathways.");
                return [2 /*return*/, { answer: answer, confidence: confidence, reasoning: reasoning }];
            });
        });
    };
    RAGResponseGenerator.prototype.generateNextStepRecommendations = function (context, intelligentContext, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendations, currentStage, nextStage, nextStageCriteria, _i, _a, criterion, error_4;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        recommendations = [];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        currentStage = ((_b = context.userProgress) === null || _b === void 0 ? void 0 : _b.currentUeeStage) || 'UNDERSTAND';
                        nextStage = this.getNextUeeStage(currentStage);
                        return [4 /*yield*/, this.findCriteriaByUeeStage(nextStage, userId)];
                    case 2:
                        nextStageCriteria = _c.sent();
                        for (_i = 0, _a = nextStageCriteria.slice(0, 3); _i < _a.length; _i++) {
                            criterion = _a[_i];
                            recommendations.push({
                                type: 'next_step',
                                title: "Progress to ".concat(nextStage, " stage"),
                                description: "Master \"".concat(criterion.title, "\" to advance your learning"),
                                estimatedTime: 20, // Placeholder
                                difficulty: criterion.complexityScore || 5,
                                ueeStage: nextStage,
                                confidence: 0.8,
                                action: "Study ".concat(criterion.title)
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _c.sent();
                        console.error('Next step recommendations failed:', error_4);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, recommendations];
                }
            });
        });
    };
    RAGResponseGenerator.prototype.generateReviewRecommendations = function (context, intelligentContext, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendations, reviewItems, _i, _a, item, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        recommendations = [];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.findItemsNeedingReview(userId)];
                    case 2:
                        reviewItems = _b.sent();
                        for (_i = 0, _a = reviewItems.slice(0, 2); _i < _a.length; _i++) {
                            item = _a[_i];
                            recommendations.push({
                                type: 'review',
                                title: "Review ".concat(item.title),
                                description: "This concept is due for review to maintain mastery",
                                estimatedTime: 10,
                                difficulty: item.complexityScore || 3,
                                ueeStage: item.ueeStage || 'UNDERSTAND',
                                confidence: 0.9,
                                action: "Review ".concat(item.title)
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _b.sent();
                        console.error('Review recommendations failed:', error_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, recommendations];
                }
            });
        });
    };
    RAGResponseGenerator.prototype.generatePracticeRecommendations = function (context, intelligentContext, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendations, currentStage, practiceCriteria, _i, _a, criterion, error_6;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        recommendations = [];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, , 5]);
                        currentStage = ((_b = context.userProgress) === null || _b === void 0 ? void 0 : _b.currentUeeStage) || 'UNDERSTAND';
                        if (!(currentStage === 'USE' || currentStage === 'EXPLORE')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.findPracticeCriteria(userId, currentStage)];
                    case 2:
                        practiceCriteria = _c.sent();
                        for (_i = 0, _a = practiceCriteria.slice(0, 2); _i < _a.length; _i++) {
                            criterion = _a[_i];
                            recommendations.push({
                                type: 'practice',
                                title: "Practice ".concat(criterion.title),
                                description: "Apply your knowledge through practical exercises",
                                estimatedTime: 30,
                                difficulty: criterion.complexityScore || 6,
                                ueeStage: currentStage,
                                confidence: 0.7,
                                action: "Practice ".concat(criterion.title)
                            });
                        }
                        _c.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_6 = _c.sent();
                        console.error('Practice recommendations failed:', error_6);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, recommendations];
                }
            });
        });
    };
    RAGResponseGenerator.prototype.generateExploreRecommendations = function (context, intelligentContext, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendations, exploreConcepts, _i, exploreConcepts_1, concept;
            var _a;
            return __generator(this, function (_b) {
                recommendations = [];
                try {
                    // Find exploration opportunities based on related concepts
                    if ((_a = context.learningPath) === null || _a === void 0 ? void 0 : _a.length) {
                        exploreConcepts = context.learningPath.slice(0, 2);
                        for (_i = 0, exploreConcepts_1 = exploreConcepts; _i < exploreConcepts_1.length; _i++) {
                            concept = exploreConcepts_1[_i];
                            recommendations.push({
                                type: 'explore',
                                title: "Explore ".concat(concept.title || 'related concept'),
                                description: "Discover connections and deepen your understanding",
                                estimatedTime: 45,
                                difficulty: concept.complexityScore || 7,
                                ueeStage: 'EXPLORE',
                                confidence: 0.6,
                                action: "Explore related concepts"
                            });
                        }
                    }
                }
                catch (error) {
                    console.error('Explore recommendations failed:', error);
                }
                return [2 /*return*/, recommendations];
            });
        });
    };
    RAGResponseGenerator.prototype.prepareContextSources = function (context, options) {
        return __awaiter(this, void 0, void 0, function () {
            var sources;
            return __generator(this, function (_a) {
                sources = [];
                // Add sections
                if (context.relevantSections) {
                    sources.push.apply(sources, context.relevantSections.map(function (s) { return ({
                        type: 'section',
                        id: s.id.toString(),
                        title: s.title,
                        relevance: s.relevanceScore || 0.8,
                        content: s.description || s.title
                    }); }));
                }
                // Add primitives
                if (context.relevantPrimitives) {
                    sources.push.apply(sources, context.relevantPrimitives.map(function (p) { return ({
                        type: 'primitive',
                        id: p.id.toString(),
                        title: p.title,
                        relevance: p.relevanceScore || 0.8,
                        content: p.description || p.title
                    }); }));
                }
                // Add notes
                if (context.relevantNotes) {
                    sources.push.apply(sources, context.relevantNotes.map(function (n) { return ({
                        type: 'note',
                        id: n.id.toString(),
                        title: n.title,
                        relevance: n.relevanceScore || 0.8,
                        content: n.content.substring(0, 200) + '...'
                    }); }));
                }
                // Sort by relevance and limit
                return [2 /*return*/, sources
                        .sort(function (a, b) { return b.relevance - a.relevance; })
                        .slice(0, options.maxContextItems || 10)];
            });
        });
    };
    RAGResponseGenerator.prototype.prepareLearningPaths = function (learningPaths, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!options.includeLearningPaths)
                    return [2 /*return*/, []];
                return [2 /*return*/, learningPaths.map(function (path) {
                        var _a;
                        return ({
                            id: path.path.map(function (p) { return p.id; }).join('-'),
                            title: "Learning Path (".concat(path.path.length, " steps)"),
                            description: "Progressive learning sequence with ".concat(path.estimatedTime, " minutes estimated"),
                            estimatedTime: path.estimatedTime,
                            difficulty: path.difficulty,
                            ueeProgression: ((_a = path.ueeProgression) === null || _a === void 0 ? void 0 : _a.progressionOrder) || ['UNDERSTAND', 'USE', 'EXPLORE']
                        });
                    })];
            });
        });
    };
    RAGResponseGenerator.prototype.prepareRelatedConcepts = function (relationships, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, relationships.map(function (rel) { return ({
                        id: rel.id.toString(),
                        title: "Concept ".concat(rel.id),
                        relationship: rel.relationshipType,
                        strength: rel.strength
                    }); })];
            });
        });
    };
    RAGResponseGenerator.prototype.formatRecommendations = function (recommendations) {
        var _this = this;
        return recommendations.map(function (rec) { return ({
            type: _this.mapRecommendationType(rec.type),
            priority: _this.mapRecommendationPriority(rec.confidence),
            title: rec.title,
            description: rec.description,
            action: rec.action,
            confidence: rec.confidence
        }); });
    };
    RAGResponseGenerator.prototype.mapRecommendationType = function (type) {
        var typeMap = {
            'next_step': 'learning_path',
            'review': 'review_suggestion',
            'practice': 'learning_path',
            'explore': 'learning_path'
        };
        return typeMap[type] || 'learning_path';
    };
    RAGResponseGenerator.prototype.mapRecommendationPriority = function (confidence) {
        if (confidence >= 0.8)
            return 'high';
        if (confidence >= 0.6)
            return 'medium';
        return 'low';
    };
    RAGResponseGenerator.prototype.calculateContextQuality = function (sources, learningPaths, relatedConcepts) {
        var totalItems = sources.length + learningPaths.length + relatedConcepts.length;
        if (totalItems === 0)
            return 0;
        var quality = 0;
        // Source quality
        if (sources.length > 0) {
            var avgRelevance = sources.reduce(function (sum, s) { return sum + s.relevance; }, 0) / sources.length;
            quality += avgRelevance * 0.4;
        }
        // Learning path quality
        if (learningPaths.length > 0) {
            quality += 0.3;
        }
        // Related concepts quality
        if (relatedConcepts.length > 0) {
            var avgStrength = relatedConcepts.reduce(function (sum, c) { return sum + c.strength; }, 0) / relatedConcepts.length;
            quality += avgStrength * 0.3;
        }
        return Math.min(1.0, quality);
    };
    RAGResponseGenerator.prototype.extractSourcesUsed = function (context) {
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
    RAGResponseGenerator.prototype.getNextUeeStage = function (currentStage) {
        var stages = ['UNDERSTAND', 'USE', 'EXPLORE'];
        var currentIndex = stages.indexOf(currentStage);
        var nextIndex = Math.min(currentIndex + 1, stages.length - 1);
        return stages[nextIndex];
    };
    RAGResponseGenerator.prototype.findCriteriaByUeeStage = function (ueeStage, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.masteryCriterion.findMany({
                                where: {
                                    uueStage: uueStage,
                                    userId: userId
                                },
                                take: 5
                            })];
                    case 1: return [2 /*return*/, _b.sent()];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RAGResponseGenerator.prototype.findItemsNeedingReview = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder implementation
                return [2 /*return*/, []];
            });
        });
    };
    RAGResponseGenerator.prototype.findPracticeCriteria = function (userId, ueeStage) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.masteryCriterion.findMany({
                                where: {
                                    uueStage: uueStage,
                                    userId: userId
                                },
                                take: 3
                            })];
                    case 1: return [2 /*return*/, _b.sent()];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RAGResponseGenerator.prototype.generateFallbackResponse = function (query, errorMessage) {
        return {
            answer: "I'm unable to generate a complete response at the moment due to: ".concat(errorMessage, ". Please try again or contact support if the issue persists."),
            context: {
                sources: [],
                learningPaths: [],
                relatedConcepts: []
            },
            recommendations: [],
            metadata: {
                processingTimeMs: 0,
                contextQuality: 0,
                responseConfidence: 0.1,
                sourcesUsed: []
            }
        };
    };
    return RAGResponseGenerator;
}());
exports.RAGResponseGenerator = RAGResponseGenerator;
exports.default = RAGResponseGenerator;
