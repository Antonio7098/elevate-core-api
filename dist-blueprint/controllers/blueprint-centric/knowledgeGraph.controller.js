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
exports.knowledgeGraphController = exports.KnowledgeGraphController = void 0;
var client_1 = require("@prisma/client");
var knowledgeGraphTraversal_service_1 = require("../../services/blueprint-centric/knowledgeGraphTraversal.service");
var contextAssembly_service_1 = require("../../services/blueprint-centric/contextAssembly.service");
var ragResponseGenerator_service_1 = require("../../services/blueprint-centric/ragResponseGenerator.service");
var vectorStore_service_1 = require("../../services/blueprint-centric/vectorStore.service");
var prisma = new client_1.PrismaClient();
var KnowledgeGraphController = /** @class */ (function () {
    function KnowledgeGraphController() {
        this.graphTraversal = new knowledgeGraphTraversal_service_1.default();
        this.contextAssembly = new contextAssembly_service_1.default();
        this.ragGenerator = new ragResponseGenerator_service_1.default();
        this.vectorStore = new vectorStore_service_1.default();
    }
    /**
     * GET /api/knowledge-graph/:blueprintId
     * Get knowledge graph for a specific blueprint
     */
    KnowledgeGraphController.prototype.getKnowledgeGraph = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var blueprintId, _a, maxDepth, sections, primitives, relationships, graph;
            return __generator(this, function (_b) {
                try {
                    blueprintId = req.params.blueprintId;
                    _a = req.query.maxDepth, maxDepth = _a === void 0 ? 3 : _a;
                    sections = [];
                    primitives = [];
                    relationships = [];
                    graph = {
                        blueprintId: parseInt(blueprintId),
                        sections: sections,
                        primitives: primitives,
                        relationships: relationships,
                        metadata: {
                            totalSections: sections.length,
                            totalPrimitives: primitives.length,
                            totalRelationships: relationships.length,
                            maxDepth: parseInt(maxDepth)
                        }
                    };
                    res.json({ success: true, data: graph });
                }
                catch (error) {
                    console.error('Failed to get knowledge graph:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to retrieve knowledge graph'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * POST /api/knowledge-graph/traverse
     * Traverse knowledge graph from a starting node
     */
    KnowledgeGraphController.prototype.traverseGraph = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, startNodeId, _b, maxDepth, relationshipTypes, traversalResult, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        _a = req.body, startNodeId = _a.startNodeId, _b = _a.maxDepth, maxDepth = _b === void 0 ? 3 : _b, relationshipTypes = _a.relationshipTypes;
                        if (!startNodeId) {
                            res.status(400).json({
                                success: false,
                                error: 'startNodeId is required'
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.graphTraversal.traverseGraph(startNodeId, maxDepth, relationshipTypes || ['PREREQUISITE', 'RELATED', 'ADVANCES_TO'])];
                    case 1:
                        traversalResult = _c.sent();
                        res.json({ success: true, data: traversalResult });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _c.sent();
                        console.error('Graph traversal failed:', error_1);
                        res.status(500).json({
                            success: false,
                            error: 'Graph traversal failed'
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/knowledge-graph/rag/generate
     * Generate RAG response with context
     */
    KnowledgeGraphController.prototype.generateRAGResponse = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, query, _b, options, userId, ragResponse, error_2;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        _a = req.body, query = _a.query, _b = _a.options, options = _b === void 0 ? {} : _b;
                        userId = ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id) || 1;
                        if (!query) {
                            res.status(400).json({
                                success: false,
                                error: 'Query is required'
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.ragGenerator.generateRAGResponse(query, userId, options)];
                    case 1:
                        ragResponse = _d.sent();
                        res.json({ success: true, data: ragResponse });
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _d.sent();
                        console.error('RAG response generation failed:', error_2);
                        res.status(500).json({
                            success: false,
                            error: 'Failed to generate RAG response'
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/knowledge-graph/vector/search
     * Perform vector search
     */
    KnowledgeGraphController.prototype.vectorSearch = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, query, _b, filters, searchResults, error_3;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        _a = req.body, query = _a.query, _b = _a.filters, filters = _b === void 0 ? {} : _b;
                        if (!query) {
                            res.status(400).json({
                                success: false,
                                error: 'Query is required'
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.vectorStore.searchVectorStore(query, filters)];
                    case 1:
                        searchResults = _c.sent();
                        res.json({ success: true, data: searchResults });
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _c.sent();
                        console.error('Vector search failed:', error_3);
                        res.status(500).json({
                            success: false,
                            error: 'Vector search failed'
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * POST /api/knowledge-graph/vector/index-blueprint/:blueprintId
     * Index all content for a blueprint
     */
    KnowledgeGraphController.prototype.indexBlueprintContent = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var blueprintId, indexingResult, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        blueprintId = req.params.blueprintId;
                        return [4 /*yield*/, this.vectorStore.indexBlueprintContent(parseInt(blueprintId))];
                    case 1:
                        indexingResult = _a.sent();
                        res.json({ success: true, data: indexingResult });
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Blueprint indexing failed:', error_4);
                        res.status(500).json({
                            success: false,
                            error: 'Blueprint indexing failed'
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Discovers learning pathways for a user
     */
    KnowledgeGraphController.prototype.discoverLearningPathways = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, _a, blueprintId, _b, maxDepth, _c, includePrerequisites_1, userProgress_1, availableContent, discoveredPathways, analyzedPathways, sortedPathways, error_5;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 4, , 5]);
                        userId = req.params.userId;
                        _a = req.query, blueprintId = _a.blueprintId, _b = _a.maxDepth, maxDepth = _b === void 0 ? 3 : _b, _c = _a.includePrerequisites, includePrerequisites_1 = _c === void 0 ? true : _c;
                        if (!userId) {
                            res.status(400).json({
                                success: false,
                                error: 'User ID is required'
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.getUserLearningProgress(parseInt(userId))];
                    case 1:
                        userProgress_1 = _d.sent();
                        return [4 /*yield*/, this.getAvailableLearningContent(parseInt(userId), blueprintId ? parseInt(blueprintId) : undefined)];
                    case 2:
                        availableContent = _d.sent();
                        return [4 /*yield*/, this.discoverOptimalPathways(userProgress_1, availableContent, parseInt(maxDepth), includePrerequisites_1 === 'true')];
                    case 3:
                        discoveredPathways = _d.sent();
                        analyzedPathways = discoveredPathways.map(function (pathway) { return (__assign(__assign({}, pathway), { relevance: _this.calculatePathwayRelevance(pathway, userProgress_1), difficulty: _this.assessPathwayDifficulty(pathway), estimatedDuration: _this.estimatePathwayDuration(pathway, userProgress_1), prerequisites: _this.identifyPathwayPrerequisites(pathway, includePrerequisites_1 === 'true'), nextSteps: _this.suggestNextSteps(pathway, userProgress_1) })); });
                        sortedPathways = analyzedPathways.sort(function (a, b) {
                            // Primary sort by relevance
                            if (a.relevance !== b.relevance) {
                                return b.relevance - a.relevance;
                            }
                            // Secondary sort by difficulty (easier first)
                            return a.difficulty.level - b.difficulty.level;
                        });
                        res.json({
                            success: true,
                            data: {
                                userId: parseInt(userId),
                                blueprintId: blueprintId ? parseInt(blueprintId) : null,
                                pathways: sortedPathways,
                                totalPathways: sortedPathways.length,
                                discoveryMetadata: {
                                    maxDepth: parseInt(maxDepth),
                                    includePrerequisites: includePrerequisites_1 === 'true',
                                    userProgressLevel: userProgress_1.overallLevel,
                                    contentAvailability: availableContent.totalAvailable,
                                    discoveryDate: new Date().toISOString()
                                }
                            }
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        error_5 = _d.sent();
                        console.error('Learning pathway discovery failed:', error_5);
                        res.status(500).json({
                            success: false,
                            error: 'Learning pathway discovery failed'
                        });
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Helper method to get user learning progress
     */
    KnowledgeGraphController.prototype.getUserLearningProgress = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would integrate with the mastery tracking service
                // For now, return mock data
                return [2 /*return*/, {
                        userId: userId,
                        overallLevel: 'INTERMEDIATE',
                        masteredCriteria: 15,
                        totalCriteria: 25,
                        currentStage: 'USE',
                        learningStrengths: ['visual', 'practical'],
                        learningWeaknesses: ['theoretical', 'memorization'],
                        preferredPace: 'moderate',
                        lastActiveDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                    }];
            });
        });
    };
    /**
     * Helper method to get available learning content
     */
    KnowledgeGraphController.prototype.getAvailableLearningContent = function (userId, blueprintId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would query the database for available content
                // For now, return mock data
                return [2 /*return*/, {
                        totalAvailable: 50,
                        criteria: [
                            { id: 'crit-1', title: 'Basic Concepts', difficulty: 'BEGINNER', stage: 'UNDERSTAND' },
                            { id: 'crit-2', title: 'Practical Application', difficulty: 'INTERMEDIATE', stage: 'USE' },
                            { id: 'crit-3', title: 'Advanced Analysis', difficulty: 'ADVANCED', stage: 'EXPLORE' }
                        ],
                        sections: [
                            { id: 'section-1', title: 'Fundamentals', difficulty: 'BEGINNER' },
                            { id: 'section-2', title: 'Intermediate Topics', difficulty: 'INTERMEDIATE' },
                            { id: 'section-3', title: 'Advanced Concepts', difficulty: 'ADVANCED' }
                        ]
                    }];
            });
        });
    };
    /**
     * Helper method to discover optimal pathways
     */
    KnowledgeGraphController.prototype.discoverOptimalPathways = function (userProgress, availableContent, maxDepth, includePrerequisites) {
        return __awaiter(this, void 0, void 0, function () {
            var pathways;
            return __generator(this, function (_a) {
                pathways = [
                    {
                        id: 'path-1',
                        title: 'Fundamentals to Advanced',
                        description: 'Progressive learning path from basics to advanced concepts',
                        difficulty: 'BEGINNER',
                        criteria: ['crit-1', 'crit-2', 'crit-3'],
                        sections: ['section-1', 'section-2', 'section-3'],
                        estimatedDuration: '4 weeks',
                        complexity: 'linear',
                        prerequisites: includePrerequisites ? ['crit-1'] : []
                    },
                    {
                        id: 'path-2',
                        title: 'Practical Skills Focus',
                        description: 'Emphasis on hands-on application and real-world usage',
                        difficulty: 'INTERMEDIATE',
                        criteria: ['crit-2', 'crit-3'],
                        sections: ['section-2', 'section-3'],
                        estimatedDuration: '3 weeks',
                        complexity: 'modular',
                        prerequisites: includePrerequisites ? ['crit-1'] : []
                    },
                    {
                        id: 'path-3',
                        title: 'Advanced Mastery',
                        description: 'Deep dive into complex concepts and expert-level understanding',
                        difficulty: 'ADVANCED',
                        criteria: ['crit-3'],
                        sections: ['section-3'],
                        estimatedDuration: '2 weeks',
                        complexity: 'specialized',
                        prerequisites: includePrerequisites ? ['crit-1', 'crit-2'] : []
                    }
                ];
                return [2 /*return*/, pathways.slice(0, maxDepth)];
            });
        });
    };
    /**
     * Helper method to calculate pathway relevance
     */
    KnowledgeGraphController.prototype.calculatePathwayRelevance = function (pathway, userProgress) {
        // Calculate relevance based on user's current level, preferences, and progress
        var relevance = 0.5; // Base relevance
        // Adjust based on difficulty match
        if (pathway.difficulty === userProgress.overallLevel) {
            relevance += 0.3;
        }
        else if (pathway.difficulty === 'BEGINNER' && userProgress.overallLevel === 'INTERMEDIATE') {
            relevance += 0.1;
        }
        else if (pathway.difficulty === 'ADVANCED' && userProgress.overallLevel === 'INTERMEDIATE') {
            relevance += 0.2;
        }
        // Adjust based on learning pace
        if (pathway.estimatedDuration.includes('2 weeks') && userProgress.preferredPace === 'fast') {
            relevance += 0.1;
        }
        else if (pathway.estimatedDuration.includes('4 weeks') && userProgress.preferredPace === 'slow') {
            relevance += 0.1;
        }
        return Math.min(1.0, Math.max(0.0, relevance));
    };
    /**
     * Helper method to assess pathway difficulty
     */
    KnowledgeGraphController.prototype.assessPathwayDifficulty = function (pathway) {
        var difficultyLevels = { 'BEGINNER': 1, 'INTERMEDIATE': 2, 'ADVANCED': 3 };
        var complexityLevels = { 'linear': 1, 'modular': 2, 'specialized': 3 };
        return {
            level: difficultyLevels[pathway.difficulty] || 2,
            complexity: complexityLevels[pathway.complexity] || 2,
            description: "".concat(pathway.difficulty, " level with ").concat(pathway.complexity, " complexity")
        };
    };
    /**
     * Helper method to estimate pathway duration
     */
    KnowledgeGraphController.prototype.estimatePathwayDuration = function (pathway, userProgress) {
        var baseDuration = pathway.estimatedDuration;
        var userPace = userProgress.preferredPace;
        if (userPace === 'fast') {
            return baseDuration.replace(/\d+/, function (match) { return Math.max(1, parseInt(match) - 1).toString(); });
        }
        else if (userPace === 'slow') {
            return baseDuration.replace(/\d+/, function (match) { return (parseInt(match) + 1).toString(); });
        }
        return baseDuration;
    };
    /**
     * Helper method to identify pathway prerequisites
     */
    KnowledgeGraphController.prototype.identifyPathwayPrerequisites = function (pathway, includePrerequisites) {
        if (!includePrerequisites) {
            return [];
        }
        return pathway.prerequisites.map(function (prereqId) { return ({
            id: prereqId,
            title: "Prerequisite: ".concat(prereqId),
            type: 'criterion',
            importance: 'required',
            status: 'not-started' // This would be determined by user progress
        }); });
    };
    /**
     * Helper method to suggest next steps
     */
    KnowledgeGraphController.prototype.suggestNextSteps = function (pathway, userProgress) {
        var steps = [];
        if (userProgress.currentStage === 'UNDERSTAND') {
            steps.push('Complete understanding of basic concepts');
            steps.push('Practice with simple examples');
        }
        else if (userProgress.currentStage === 'USE') {
            steps.push('Apply concepts in practical scenarios');
            steps.push('Build confidence through repetition');
        }
        else if (userProgress.currentStage === 'EXPLORE') {
            steps.push('Experiment with advanced applications');
            steps.push('Connect concepts across different domains');
        }
        return steps;
    };
    /**
     * Gets recommended learning pathways for a user
     */
    KnowledgeGraphController.prototype.getRecommendedPathways = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId;
            return __generator(this, function (_a) {
                try {
                    userId = req.params.userId;
                    // For now, return a placeholder response
                    // TODO: Implement actual learning pathway recommendation logic
                    res.json({
                        userId: userId,
                        recommendations: [
                            {
                                id: 'rec-1',
                                title: 'Personalized Learning Path',
                                description: 'AI-generated path based on your learning history',
                                confidence: 0.85,
                                criteria: ['crit-1', 'crit-2']
                            }
                        ],
                        totalRecommendations: 1
                    });
                }
                catch (error) {
                    console.error('Learning pathway recommendation failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Learning pathway recommendation failed'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Helper method to get user learning profile
     */
    KnowledgeGraphController.prototype.getUserLearningProfile = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would integrate with user profile and preference services
                // For now, return mock data
                return [2 /*return*/, {
                        userId: userId,
                        overallLevel: 'INTERMEDIATE',
                        learningStyle: 'visual-practical',
                        preferredPace: 'moderate',
                        interests: ['technology', 'problem-solving', 'innovation'],
                        goals: ['career advancement', 'skill development', 'knowledge expansion'],
                        timeAvailability: '10-15 hours per week',
                        preferredFormat: 'interactive',
                        difficultyPreference: 'challenging but achievable'
                    }];
            });
        });
    };
    /**
     * Helper method to generate personalized recommendations
     */
    KnowledgeGraphController.prototype.generatePersonalizedRecommendations = function (userProfile, userProgress, limit, includeProgress, filterByDifficulty) {
        return __awaiter(this, void 0, void 0, function () {
            var baseRecommendations, filteredRecommendations;
            var _this = this;
            return __generator(this, function (_a) {
                baseRecommendations = [
                    {
                        id: 'rec-1',
                        title: 'Personalized Learning Path',
                        description: 'AI-generated path based on your learning history and preferences',
                        type: 'personalized',
                        difficulty: 'INTERMEDIATE',
                        estimatedDuration: '3 weeks',
                        relevance: 0.9,
                        criteria: ['crit-1', 'crit-2', 'crit-3'],
                        sections: ['section-1', 'section-2'],
                        learningStyle: 'visual-practical',
                        pace: 'moderate'
                    },
                    {
                        id: 'rec-2',
                        title: 'Skill Gap Filler',
                        description: 'Targeted path to address identified skill gaps',
                        type: 'skill-gap',
                        difficulty: 'INTERMEDIATE',
                        estimatedDuration: '2 weeks',
                        relevance: 0.8,
                        criteria: ['crit-2', 'crit-4'],
                        sections: ['section-2'],
                        learningStyle: 'practical',
                        pace: 'fast'
                    },
                    {
                        id: 'rec-3',
                        title: 'Advanced Mastery Track',
                        description: 'Deep dive into advanced concepts for experienced learners',
                        type: 'advanced-mastery',
                        difficulty: 'ADVANCED',
                        estimatedDuration: '4 weeks',
                        relevance: 0.7,
                        criteria: ['crit-3', 'crit-5'],
                        sections: ['section-3'],
                        learningStyle: 'theoretical-practical',
                        pace: 'slow'
                    },
                    {
                        id: 'rec-4',
                        title: 'Quick Review Path',
                        description: 'Fast-paced review of essential concepts',
                        type: 'review',
                        difficulty: 'BEGINNER',
                        estimatedDuration: '1 week',
                        relevance: 0.6,
                        criteria: ['crit-1'],
                        sections: ['section-1'],
                        learningStyle: 'any',
                        pace: 'fast'
                    },
                    {
                        id: 'rec-5',
                        title: 'Comprehensive Foundation',
                        description: 'Complete foundation building for beginners',
                        type: 'foundation',
                        difficulty: 'BEGINNER',
                        estimatedDuration: '6 weeks',
                        relevance: 0.5,
                        criteria: ['crit-1', 'crit-2'],
                        sections: ['section-1', 'section-2'],
                        learningStyle: 'structured',
                        pace: 'slow'
                    }
                ];
                filteredRecommendations = baseRecommendations;
                if (filterByDifficulty) {
                    filteredRecommendations = baseRecommendations.filter(function (rec) {
                        return rec.difficulty.toLowerCase() === filterByDifficulty.toLowerCase();
                    });
                }
                // Add progress information if requested
                if (includeProgress) {
                    filteredRecommendations = filteredRecommendations.map(function (rec) { return (__assign(__assign({}, rec), { progress: _this.calculatePathwayProgress(rec, userProgress), estimatedCompletion: _this.estimateCompletionTime(rec, userProgress) })); });
                }
                return [2 /*return*/, filteredRecommendations.slice(0, limit)];
            });
        });
    };
    /**
     * Helper method to calculate recommendation confidence
     */
    KnowledgeGraphController.prototype.calculateRecommendationConfidence = function (recommendation, userProfile, userProgress) {
        var confidence = 0.5; // Base confidence
        // Adjust based on difficulty match
        if (recommendation.difficulty === userProfile.overallLevel) {
            confidence += 0.2;
        }
        else if (recommendation.difficulty === 'INTERMEDIATE' &&
            (userProfile.overallLevel === 'BEGINNER' || userProfile.overallLevel === 'ADVANCED')) {
            confidence += 0.1;
        }
        // Adjust based on learning style match
        if (recommendation.learningStyle === userProfile.learningStyle) {
            confidence += 0.15;
        }
        else if (recommendation.learningStyle === 'any') {
            confidence += 0.1;
        }
        // Adjust based on pace preference
        if (recommendation.pace === userProfile.preferredPace) {
            confidence += 0.1;
        }
        // Adjust based on relevance score
        confidence += recommendation.relevance * 0.1;
        return Math.min(1.0, Math.max(0.0, confidence));
    };
    /**
     * Helper method to explain recommendation reasoning
     */
    KnowledgeGraphController.prototype.explainRecommendationReasoning = function (recommendation, userProfile, userProgress) {
        var reasons = [];
        if (recommendation.difficulty === userProfile.overallLevel) {
            reasons.push('Matches your current skill level');
        }
        if (recommendation.learningStyle === userProfile.learningStyle) {
            reasons.push('Aligns with your preferred learning style');
        }
        if (recommendation.pace === userProfile.preferredPace) {
            reasons.push('Fits your preferred learning pace');
        }
        if (recommendation.type === 'skill-gap') {
            reasons.push('Addresses identified skill gaps in your profile');
        }
        if (recommendation.type === 'personalized') {
            reasons.push('Based on your learning history and preferences');
        }
        return reasons.length > 0 ? reasons.join('. ') : 'General recommendation based on your profile';
    };
    /**
     * Helper method to categorize recommendations
     */
    KnowledgeGraphController.prototype.categorizeRecommendations = function (recommendations) {
        var categories = {
            personalized: recommendations.filter(function (r) { return r.type === 'personalized'; }),
            skillGap: recommendations.filter(function (r) { return r.type === 'skill-gap'; }),
            advanced: recommendations.filter(function (r) { return r.type === 'advanced-mastery'; }),
            review: recommendations.filter(function (r) { return r.type === 'review'; }),
            foundation: recommendations.filter(function (r) { return r.type === 'foundation'; })
        };
        return {
            total: recommendations.length,
            personalized: categories.personalized.length,
            skillGap: categories.skillGap.length,
            advanced: categories.advanced.length,
            review: categories.review.length,
            foundation: categories.foundation.length
        };
    };
    /**
     * Helper method to calculate pathway progress
     */
    KnowledgeGraphController.prototype.calculatePathwayProgress = function (recommendation, userProgress) {
        // This would calculate actual progress through the pathway
        // For now, return mock progress
        var totalCriteria = recommendation.criteria.length;
        var completedCriteria = Math.floor(Math.random() * totalCriteria);
        var progressPercentage = Math.round((completedCriteria / totalCriteria) * 100);
        return {
            completedCriteria: completedCriteria,
            totalCriteria: totalCriteria,
            progressPercentage: progressPercentage,
            status: progressPercentage === 100 ? 'completed' :
                progressPercentage > 50 ? 'in-progress' : 'not-started'
        };
    };
    /**
     * Helper method to estimate completion time
     */
    KnowledgeGraphController.prototype.estimateCompletionTime = function (recommendation, userProgress) {
        var baseDuration = recommendation.estimatedDuration;
        var userPace = userProgress.preferredPace;
        if (userPace === 'fast') {
            return baseDuration.replace(/\d+/, function (match) { return Math.max(1, parseInt(match) - 1).toString(); });
        }
        else if (userPace === 'slow') {
            return baseDuration.replace(/\d+/, function (match) { return (parseInt(match) + 1).toString(); });
        }
        return baseDuration;
    };
    /**
     * Gets pathways leading to a criterion
     */
    KnowledgeGraphController.prototype.getPathwaysToCriterion = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var criterionId;
            return __generator(this, function (_a) {
                try {
                    criterionId = req.params.criterionId;
                    // For now, return a placeholder response
                    // TODO: Implement actual pathway to criterion logic
                    res.json({
                        criterionId: criterionId,
                        pathways: [
                            {
                                id: 'path-to-1',
                                title: 'Path to Criterion',
                                description: 'Learning path leading to this criterion',
                                difficulty: 'BEGINNER',
                                estimatedDuration: '2 weeks'
                            }
                        ],
                        totalPathways: 1
                    });
                }
                catch (error) {
                    console.error('Get pathways to criterion failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to get pathways to criterion'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Gets learning pathways that start from a specific criterion
     */
    KnowledgeGraphController.prototype.getPathwaysFromCriterion = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var criterionId;
            return __generator(this, function (_a) {
                try {
                    criterionId = req.params.criterionId;
                    // For now, return a placeholder response
                    // TODO: Implement actual pathway from criterion logic
                    res.json({
                        criterionId: criterionId,
                        pathways: [
                            {
                                id: 'path-from-1',
                                title: 'Path from Criterion',
                                description: 'Learning path starting from this criterion',
                                difficulty: 'INTERMEDIATE',
                                estimatedDuration: '3 weeks'
                            }
                        ],
                        totalPathways: 1
                    });
                }
                catch (error) {
                    console.error('Get pathways from criterion failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to get pathways from criterion'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Gets optimal pathway for a user to a target criterion
     */
    KnowledgeGraphController.prototype.getOptimalPathway = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, userId, targetCriterionId;
            return __generator(this, function (_b) {
                try {
                    _a = req.params, userId = _a.userId, targetCriterionId = _a.targetCriterionId;
                    // For now, return a placeholder response
                    // TODO: Implement actual optimal pathway logic
                    res.json({
                        userId: userId,
                        targetCriterionId: targetCriterionId,
                        optimalPathway: {
                            id: 'optimal-1',
                            title: 'Optimal Learning Path',
                            description: 'Best path to reach the target criterion',
                            difficulty: 'INTERMEDIATE',
                            estimatedDuration: '5 weeks',
                            criteria: ['crit-1', 'crit-2', 'crit-3', targetCriterionId]
                        }
                    });
                }
                catch (error) {
                    console.error('Get optimal pathway failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to get optimal pathway'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Analyzes a learning pathway
     */
    KnowledgeGraphController.prototype.analyzePathway = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var pathwayId;
            return __generator(this, function (_a) {
                try {
                    pathwayId = req.params.pathwayId;
                    // For now, return a placeholder response
                    // TODO: Implement actual pathway analysis logic
                    res.json({
                        pathwayId: pathwayId,
                        analysis: {
                            difficulty: 'INTERMEDIATE',
                            estimatedDuration: '4 weeks',
                            prerequisites: ['crit-1', 'crit-2'],
                            outcomes: ['crit-3', 'crit-4'],
                            complexity: 'MEDIUM',
                            successRate: 0.85
                        }
                    });
                }
                catch (error) {
                    console.error('Pathway analysis failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to analyze pathway'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Gets pathway complexity
     */
    KnowledgeGraphController.prototype.getPathwayComplexity = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var pathwayId;
            return __generator(this, function (_a) {
                try {
                    pathwayId = req.params.pathwayId;
                    // For now, return a placeholder response
                    // TODO: Implement actual pathway complexity logic
                    res.json({
                        pathwayId: pathwayId,
                        complexity: {
                            level: 'MEDIUM',
                            score: 7.5,
                            factors: ['Prerequisites', 'Time commitment', 'Concept difficulty'],
                            estimatedHours: 40
                        }
                    });
                }
                catch (error) {
                    console.error('Get pathway complexity failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to get pathway complexity'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Gets prerequisites for a criterion
     */
    KnowledgeGraphController.prototype.getPrerequisites = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var criterionId;
            return __generator(this, function (_a) {
                try {
                    criterionId = req.params.criterionId;
                    // For now, return a placeholder response
                    // TODO: Implement actual prerequisites logic
                    res.json({
                        criterionId: criterionId,
                        prerequisites: [
                            {
                                id: 'prereq-1',
                                title: 'Basic Understanding',
                                description: 'Fundamental knowledge required',
                                masteryLevel: 80
                            }
                        ],
                        totalPrerequisites: 1
                    });
                }
                catch (error) {
                    console.error('Get prerequisites failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to get prerequisites'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Creates a custom pathway
     */
    KnowledgeGraphController.prototype.createCustomPathway = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var pathwayData;
            return __generator(this, function (_a) {
                try {
                    pathwayData = req.body;
                    // For now, return a placeholder response
                    // TODO: Implement actual custom pathway creation logic
                    res.json({
                        id: 'custom-path-1',
                        title: pathwayData.title,
                        description: pathwayData.description,
                        difficulty: pathwayData.difficulty || 'CUSTOM',
                        estimatedDuration: pathwayData.estimatedDuration || 'Variable',
                        criteria: pathwayData.criteria || [],
                        message: 'Custom pathway created successfully'
                    });
                }
                catch (error) {
                    console.error('Create custom pathway failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to create custom pathway'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Updates a pathway
     */
    KnowledgeGraphController.prototype.updatePathway = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var pathwayId, updateData;
            return __generator(this, function (_a) {
                try {
                    pathwayId = req.params.pathwayId;
                    updateData = req.body;
                    // For now, return a placeholder response
                    // TODO: Implement actual pathway update logic
                    res.json({
                        id: pathwayId,
                        title: updateData.title,
                        description: updateData.description,
                        difficulty: updateData.difficulty,
                        estimatedDuration: updateData.estimatedDuration,
                        criteria: updateData.criteria,
                        message: 'Pathway updated successfully'
                    });
                }
                catch (error) {
                    console.error('Update pathway failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to update pathway'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Deletes a pathway
     */
    KnowledgeGraphController.prototype.deletePathway = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var pathwayId;
            return __generator(this, function (_a) {
                try {
                    pathwayId = req.params.pathwayId;
                    // For now, return a placeholder response
                    // TODO: Implement actual pathway deletion logic
                    res.json({
                        id: pathwayId,
                        message: 'Pathway deleted successfully'
                    });
                }
                catch (error) {
                    console.error('Delete pathway failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to delete pathway'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Gets user pathways
     */
    KnowledgeGraphController.prototype.getUserPathways = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId;
            return __generator(this, function (_a) {
                try {
                    userId = req.params.userId;
                    // For now, return a placeholder response
                    // TODO: Implement actual user pathways logic
                    res.json({
                        userId: userId,
                        pathways: [
                            {
                                id: 'user-path-1',
                                title: 'User Learning Path',
                                description: 'Personalized learning path for user',
                                progress: 60,
                                currentCriterion: 'crit-2'
                            }
                        ],
                        totalPathways: 1
                    });
                }
                catch (error) {
                    console.error('Get user pathways failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to get user pathways'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Gets pathway progress for a user
     */
    KnowledgeGraphController.prototype.getPathwayProgress = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, pathwayId, userId;
            return __generator(this, function (_b) {
                try {
                    _a = req.params, pathwayId = _a.pathwayId, userId = _a.userId;
                    // For now, return a placeholder response
                    // TODO: Implement actual pathway progress logic
                    res.json({
                        pathwayId: pathwayId,
                        userId: userId,
                        progress: {
                            percentage: 60,
                            completedCriteria: 3,
                            totalCriteria: 5,
                            currentCriterion: 'crit-3',
                            estimatedTimeRemaining: '2 weeks'
                        }
                    });
                }
                catch (error) {
                    console.error('Get pathway progress failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to get pathway progress'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Starts a pathway for a user
     */
    KnowledgeGraphController.prototype.startPathway = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, pathwayId, userId;
            return __generator(this, function (_b) {
                try {
                    _a = req.params, pathwayId = _a.pathwayId, userId = _a.userId;
                    // For now, return a placeholder response
                    // TODO: Implement actual pathway start logic
                    res.json({
                        pathwayId: pathwayId,
                        userId: userId,
                        startDate: new Date().toISOString(),
                        message: 'Pathway started successfully',
                        firstCriterion: 'crit-1'
                    });
                }
                catch (error) {
                    console.error('Start pathway failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to start pathway'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Completes a pathway for a user
     */
    KnowledgeGraphController.prototype.completePathway = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, pathwayId, userId;
            return __generator(this, function (_b) {
                try {
                    _a = req.params, pathwayId = _a.pathwayId, userId = _a.userId;
                    // For now, return a placeholder response
                    // TODO: Implement actual pathway completion logic
                    res.json({
                        pathwayId: pathwayId,
                        userId: userId,
                        completionDate: new Date().toISOString(),
                        message: 'Pathway completed successfully',
                        finalScore: 95,
                        timeToComplete: '4 weeks'
                    });
                }
                catch (error) {
                    console.error('Complete pathway failed:', error);
                    res.status(500).json({
                        success: false,
                        error: 'Failed to complete pathway'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    return KnowledgeGraphController;
}());
exports.KnowledgeGraphController = KnowledgeGraphController;
exports.default = KnowledgeGraphController;
// Export controller instance
exports.knowledgeGraphController = new KnowledgeGraphController();
