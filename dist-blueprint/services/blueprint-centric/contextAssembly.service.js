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
exports.ContextAssemblyService = void 0;
var client_1 = require("@prisma/client");
var knowledgeGraphTraversal_service_1 = require("./knowledgeGraphTraversal.service");
var vectorStore_service_1 = require("./vectorStore.service");
var prisma = new client_1.PrismaClient();
var ContextAssemblyService = /** @class */ (function () {
    function ContextAssemblyService() {
        this.graphTraversal = new knowledgeGraphTraversal_service_1.default();
        this.vectorStore = new vectorStore_service_1.default();
    }
    /**
     * Main context assembly method
     * Combines vector search, graph traversal, and user context
     */
    ContextAssemblyService.prototype.assembleContext = function (query_1, userId_1) {
        return __awaiter(this, arguments, void 0, function (query, userId, options) {
            var startTime, vectorResults, keyConcepts, graphResults, userContext, learningPaths, unifiedContext, processingTime, error_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, this.searchVectorStore(query, options)];
                    case 2:
                        vectorResults = _a.sent();
                        return [4 /*yield*/, this.extractKeyConcepts(vectorResults)];
                    case 3:
                        keyConcepts = _a.sent();
                        return [4 /*yield*/, this.graphTraversalFromKeyConcepts(keyConcepts, options)];
                    case 4:
                        graphResults = _a.sent();
                        return [4 /*yield*/, this.getUserContext(userId, keyConcepts)];
                    case 5:
                        userContext = _a.sent();
                        return [4 /*yield*/, this.discoverLearningPaths(keyConcepts, options)];
                    case 6:
                        learningPaths = _a.sent();
                        return [4 /*yield*/, this.assembleUnifiedContext(vectorResults, graphResults, userContext, learningPaths, options)];
                    case 7:
                        unifiedContext = _a.sent();
                        processingTime = Date.now() - startTime;
                        return [2 /*return*/, __assign(__assign({}, unifiedContext), { metadata: __assign(__assign({}, unifiedContext.metadata), { processingTimeMs: processingTime, sources: {
                                        vectorSearch: vectorResults.length,
                                        graphTraversal: graphResults.nodes.length,
                                        userContext: userContext ? 1 : 0,
                                        learningPaths: learningPaths.length
                                    } }) })];
                    case 8:
                        error_1 = _a.sent();
                        console.error('Context assembly failed:', error_1);
                        throw new Error("Context assembly failed: ".concat(error_1.message));
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Vector search integration
     * Now uses actual VectorStoreService for Pinecone integration
     */
    ContextAssemblyService.prototype.searchVectorStore = function (query, filters) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.vectorStore.searchVectorStore(query, filters)];
                    case 1: 
                    // Use the VectorStoreService for actual vector search
                    return [2 /*return*/, _a.sent()];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Vector search failed:', error_2);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Knowledge graph traversal from key concepts
     */
    ContextAssemblyService.prototype.graphTraversalFromKeyConcepts = function (keyConcepts, options) {
        return __awaiter(this, void 0, void 0, function () {
            var startConcept, maxDepth, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (keyConcepts.length === 0) {
                            return [2 /*return*/, {
                                    nodes: [],
                                    edges: [],
                                    paths: [],
                                    metadata: { maxDepth: 0, totalNodes: 0, totalEdges: 0, processingTimeMs: 0 }
                                }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        startConcept = keyConcepts[0];
                        maxDepth = options.maxPathDepth || 3;
                        return [4 /*yield*/, this.graphTraversal.traverseGraph(startConcept, maxDepth, ['PREREQUISITE', 'RELATED', 'ADVANCES_TO'])];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Graph traversal failed:', error_3);
                        return [2 /*return*/, {
                                nodes: [],
                                edges: [],
                                paths: [],
                                metadata: { maxDepth: 0, totalNodes: 0, totalEdges: 0, processingTimeMs: 0 }
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Learning pathway discovery
     */
    ContextAssemblyService.prototype.discoverLearningPaths = function (keyConcepts, options) {
        return __awaiter(this, void 0, void 0, function () {
            var paths, relatedCriteria, i, path, error_4, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!options.includeLearningPaths || keyConcepts.length === 0) {
                            return [2 /*return*/, []];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        paths = [];
                        return [4 /*yield*/, this.findRelatedMasteryCriteria(keyConcepts)];
                    case 2:
                        relatedCriteria = _a.sent();
                        i = 0;
                        _a.label = 3;
                    case 3:
                        if (!(i < relatedCriteria.length - 1)) return [3 /*break*/, 8];
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, this.graphTraversal.findCriterionLearningPath(relatedCriteria[i].id, relatedCriteria[i + 1].id, options.maxPathDepth || 5)];
                    case 5:
                        path = _a.sent();
                        paths.push(path);
                        return [3 /*break*/, 7];
                    case 6:
                        error_4 = _a.sent();
                        return [3 /*break*/, 7];
                    case 7:
                        i++;
                        return [3 /*break*/, 3];
                    case 8: return [2 /*return*/, paths];
                    case 9:
                        error_5 = _a.sent();
                        console.error('Learning path discovery failed:', error_5);
                        return [2 /*return*/, []];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * User context integration
     */
    ContextAssemblyService.prototype.getUserContext = function (userId, keyConcepts) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, user, progress, goals, session, error_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all([
                                this.getUser(userId),
                                this.getUserProgress(userId),
                                this.getUserLearningGoals(userId),
                                this.getCurrentStudySession(userId)
                            ])];
                    case 1:
                        _a = _b.sent(), user = _a[0], progress = _a[1], goals = _a[2], session = _a[3];
                        if (!user)
                            return [2 /*return*/, null];
                        return [2 /*return*/, {
                                userId: userId,
                                overallMastery: progress.overallMastery,
                                currentUeeStage: progress.currentUeeStage,
                                recentActivity: progress.recentActivity,
                                learningGoals: goals,
                                currentSession: session
                            }];
                    case 2:
                        error_6 = _b.sent();
                        console.error('User context retrieval failed:', error_6);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Context assembly and ranking
     */
    ContextAssemblyService.prototype.assembleUnifiedContext = function (vectorResults, graphResults, userContext, learningPaths, options) {
        return __awaiter(this, void 0, void 0, function () {
            var allContent, scoredContent, rankedContent, groupedContent;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        allContent = __spreadArray(__spreadArray(__spreadArray([], vectorResults.map(function (r) { return (__assign(__assign({}, r), { source: 'vector' })); }), true), graphResults.nodes.map(function (n) { return (__assign(__assign({}, n), { source: 'graph' })); }), true), (userContext ? [userContext].map(function (u) { return (__assign(__assign({}, u), { source: 'user' })); }) : []), true);
                        return [4 /*yield*/, Promise.all(allContent.map(function (content) { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                var _b;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            _a = [__assign({}, content)];
                                            _b = {};
                                            return [4 /*yield*/, this.calculateRelevance(content, options)];
                                        case 1: return [2 /*return*/, (__assign.apply(void 0, _a.concat([(_b.relevanceScore = _c.sent(), _b)])))];
                                    }
                                });
                            }); }))];
                    case 1:
                        scoredContent = _a.sent();
                        rankedContent = this.rankContentByRelevanceAndDiversity(scoredContent, options.maxResults || 20);
                        groupedContent = this.groupContentByType(rankedContent);
                        return [2 /*return*/, {
                                content: groupedContent,
                                relationships: graphResults.edges,
                                learningPaths: learningPaths,
                                userProgress: (userContext === null || userContext === void 0 ? void 0 : userContext.progress) || null,
                                metadata: {
                                    totalContent: rankedContent.length,
                                    contentDistribution: this.calculateContentDistribution(groupedContent),
                                    confidence: this.calculateOverallConfidence(rankedContent)
                                }
                            }];
                }
            });
        });
    };
    /**
     * Extracts key concepts from vector search results
     */
    ContextAssemblyService.prototype.extractKeyConcepts = function (vectorResults) {
        return __awaiter(this, void 0, void 0, function () {
            var concepts, _i, vectorResults_1, result, extracted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        concepts = new Set();
                        _i = 0, vectorResults_1 = vectorResults;
                        _a.label = 1;
                    case 1:
                        if (!(_i < vectorResults_1.length)) return [3 /*break*/, 4];
                        result = vectorResults_1[_i];
                        return [4 /*yield*/, this.nlpExtractConcepts(result.content)];
                    case 2:
                        extracted = _a.sent();
                        extracted.forEach(function (concept) { return concepts.add(concept); });
                        // Add concepts from metadata
                        if (result.metadata.conceptTags) {
                            result.metadata.conceptTags.forEach(function (tag) { return concepts.add(tag); });
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, Array.from(concepts)];
                }
            });
        });
    };
    /**
     * Calculates relevance score for content
     */
    ContextAssemblyService.prototype.calculateRelevance = function (content, options) {
        return __awaiter(this, void 0, void 0, function () {
            var score, _a, min, max, daysSinceUpdate;
            return __generator(this, function (_b) {
                score = 0;
                // Base relevance from vector search
                if (content.source === 'vector' && content.similarity) {
                    score += content.similarity * 0.6;
                }
                // User preference matching
                if (options.focusSection && content.blueprintSectionId === options.focusSection) {
                    score += 0.2;
                }
                if (options.ueeLevel && content.ueeLevel === options.ueeLevel) {
                    score += 0.1;
                }
                // Difficulty matching
                if (options.difficultyRange) {
                    _a = options.difficultyRange, min = _a[0], max = _a[1];
                    if (content.complexityScore >= min && content.complexityScore <= max) {
                        score += 0.1;
                    }
                }
                // Freshness bonus
                if (content.updatedAt) {
                    daysSinceUpdate = (Date.now() - new Date(content.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
                    if (daysSinceUpdate < 7)
                        score += 0.1;
                }
                return [2 /*return*/, Math.min(1.0, score)];
            });
        });
    };
    /**
     * Ranks content by relevance and diversity
     */
    ContextAssemblyService.prototype.rankContentByRelevanceAndDiversity = function (scoredContent, maxResults) {
        // Simple ranking by relevance score
        // In production, you'd implement diversity-aware ranking
        return scoredContent
            .sort(function (a, b) { return b.relevanceScore - a.relevanceScore; })
            .slice(0, maxResults);
    };
    /**
     * Groups content by type
     */
    ContextAssemblyService.prototype.groupContentByType = function (rankedContent) {
        var sections = [];
        var primitives = [];
        var notes = [];
        var relationships = [];
        for (var _i = 0, rankedContent_1 = rankedContent; _i < rankedContent_1.length; _i++) {
            var content = rankedContent_1[_i];
            if (content.sourceType === 'section') {
                sections.push(content);
            }
            else if (content.sourceType === 'primitive') {
                primitives.push(content);
            }
            else if (content.sourceType === 'note') {
                notes.push(content);
            }
        }
        return { sections: sections, primitives: primitives, notes: notes, relationships: relationships };
    };
    /**
     * Calculates content distribution
     */
    ContextAssemblyService.prototype.calculateContentDistribution = function (groupedContent) {
        return {
            sections: groupedContent.sections.length,
            primitives: groupedContent.primitives.length,
            notes: groupedContent.notes.length,
            relationships: groupedContent.relationships.length
        };
    };
    /**
     * Calculates overall confidence
     */
    ContextAssemblyService.prototype.calculateOverallConfidence = function (rankedContent) {
        if (rankedContent.length === 0)
            return 0;
        var totalConfidence = rankedContent.reduce(function (sum, content) {
            return sum + (content.confidence || 0.8);
        }, 0);
        return totalConfidence / rankedContent.length;
    };
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    ContextAssemblyService.prototype.findRelatedMasteryCriteria = function (keyConcepts) {
        return __awaiter(this, void 0, void 0, function () {
            var criteria, _i, _a, concept, found, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, , 6]);
                        criteria = [];
                        _i = 0, _a = keyConcepts.slice(0, 5);
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        concept = _a[_i];
                        return [4 /*yield*/, prisma.masteryCriterion.findMany({
                                where: {
                                    OR: [
                                        { title: { contains: concept, mode: 'insensitive' } },
                                        { description: { contains: concept, mode: 'insensitive' } }
                                    ]
                                },
                                take: 3
                            })];
                    case 2:
                        found = _c.sent();
                        criteria.push.apply(criteria, found);
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, criteria];
                    case 5:
                        _b = _c.sent();
                        return [2 /*return*/, []];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    ContextAssemblyService.prototype.getUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.user.findUnique({ where: { id: userId } })];
                    case 1: return [2 /*return*/, _b.sent()];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ContextAssemblyService.prototype.getUserProgress = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder implementation
                return [2 /*return*/, {
                        overallMastery: 0.7,
                        currentUeeStage: 'USE',
                        recentActivity: []
                    }];
            });
        });
    };
    ContextAssemblyService.prototype.getUserLearningGoals = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder implementation
                return [2 /*return*/, []];
            });
        });
    };
    ContextAssemblyService.prototype.getCurrentStudySession = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder implementation
                return [2 /*return*/, null];
            });
        });
    };
    ContextAssemblyService.prototype.nlpExtractConcepts = function (content) {
        return __awaiter(this, void 0, void 0, function () {
            var words, concepts;
            return __generator(this, function (_a) {
                words = content.toLowerCase().split(/\s+/);
                concepts = words.filter(function (word) {
                    return word.length > 3 &&
                        !['the', 'and', 'for', 'with', 'this', 'that', 'have', 'been'].includes(word);
                });
                return [2 /*return*/, concepts.slice(0, 5)]; // Return top 5 concepts
            });
        });
    };
    return ContextAssemblyService;
}());
exports.ContextAssemblyService = ContextAssemblyService;
exports.default = ContextAssemblyService;
