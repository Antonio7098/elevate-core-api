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
var client_1 = require("@prisma/client");
// ============================================================================
// SERVICE CLASS
// ============================================================================
var KnowledgeGraphTraversal = /** @class */ (function () {
    function KnowledgeGraphTraversal() {
        this.prisma = new client_1.PrismaClient();
    }
    /**
     * Traverses the knowledge graph starting from a given node
     */
    KnowledgeGraphTraversal.prototype.traverseGraph = function (startNodeId_1) {
        return __awaiter(this, arguments, void 0, function (startNodeId, maxDepth, relationshipTypes) {
            var nodes, edges, visited, queue, _a, nodeId, depth, node, relationships, _i, relationships_1, rel, targetId;
            if (maxDepth === void 0) { maxDepth = 3; }
            if (relationshipTypes === void 0) { relationshipTypes = ['PREREQUISITE', 'RELATED', 'ADVANCES_TO']; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        nodes = [];
                        edges = [];
                        visited = new Set();
                        queue = [{ nodeId: startNodeId, depth: 0 }];
                        _b.label = 1;
                    case 1:
                        if (!(queue.length > 0)) return [3 /*break*/, 5];
                        _a = queue.shift(), nodeId = _a.nodeId, depth = _a.depth;
                        if (visited.has(nodeId) || depth > maxDepth) {
                            return [3 /*break*/, 1];
                        }
                        visited.add(nodeId);
                        return [4 /*yield*/, this.prisma.knowledgePrimitive.findUnique({
                                where: { primitiveId: nodeId }
                            })];
                    case 2:
                        node = _b.sent();
                        if (node) {
                            nodes.push(this.mapToGraphNode(node));
                        }
                        if (!(depth < maxDepth)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getRelationships(nodeId, relationshipTypes)];
                    case 3:
                        relationships = _b.sent();
                        for (_i = 0, relationships_1 = relationships; _i < relationships_1.length; _i++) {
                            rel = relationships_1[_i];
                            targetId = rel.targetPrimitiveId;
                            // Add edge even if target is visited (for circular relationships)
                            edges.push({
                                source: nodeId,
                                target: targetId,
                                type: rel.relationshipType,
                                strength: rel.strength || 1.0
                            });
                            // Only add to queue if not visited
                            if (!visited.has(targetId)) {
                                queue.push({ nodeId: targetId, depth: depth + 1 });
                            }
                        }
                        _b.label = 4;
                    case 4: return [3 /*break*/, 1];
                    case 5: return [2 /*return*/, {
                            nodes: nodes,
                            edges: edges,
                            metadata: {
                                maxDepth: maxDepth,
                                totalNodes: nodes.length,
                                totalEdges: edges.length
                            }
                        }];
                }
            });
        });
    };
    /**
     * Finds the prerequisite chain for a given node
     */
    KnowledgeGraphTraversal.prototype.findPrerequisiteChain = function (targetNodeId) {
        return __awaiter(this, void 0, void 0, function () {
            var prerequisites, visited, queue, nodeId, relationships, _i, relationships_2, rel, prereqId, prereqNode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prerequisites = [];
                        visited = new Set();
                        queue = [targetNodeId];
                        _a.label = 1;
                    case 1:
                        if (!(queue.length > 0)) return [3 /*break*/, 7];
                        nodeId = queue.shift();
                        if (visited.has(nodeId)) {
                            return [3 /*break*/, 1];
                        }
                        visited.add(nodeId);
                        return [4 /*yield*/, this.getRelationships(nodeId, ['PREREQUISITE'])];
                    case 2:
                        relationships = _a.sent();
                        _i = 0, relationships_2 = relationships;
                        _a.label = 3;
                    case 3:
                        if (!(_i < relationships_2.length)) return [3 /*break*/, 6];
                        rel = relationships_2[_i];
                        prereqId = rel.targetPrimitiveId;
                        if (!!visited.has(prereqId)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.prisma.knowledgePrimitive.findUnique({
                                where: { primitiveId: prereqId }
                            })];
                    case 4:
                        prereqNode = _a.sent();
                        if (prereqNode) {
                            prerequisites.push(this.mapToGraphNode(prereqNode));
                            queue.push(prereqId);
                        }
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 1];
                    case 7: 
                    // Sort by complexity score (lowest first) and exclude the target node itself
                    return [2 /*return*/, prerequisites
                            .filter(function (node) { return node.id !== targetNodeId; })
                            .sort(function (a, b) { return (a.complexityScore || 0) - (b.complexityScore || 0); })];
                }
            });
        });
    };
    /**
     * Finds the optimal learning path between two concepts
     */
    KnowledgeGraphTraversal.prototype.findLearningPath = function (startNodeId_1, endNodeId_1) {
        return __awaiter(this, arguments, void 0, function (startNodeId, endNodeId, maxPathLength) {
            var visited, queue, _a, nodeId, path, cost, pathNodes, _i, path_1, id, node, relationships, _b, relationships_3, rel, targetId, newCost;
            if (maxPathLength === void 0) { maxPathLength = 10; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        visited = new Set();
                        queue = [
                            { nodeId: startNodeId, path: [startNodeId], cost: 0 }
                        ];
                        _c.label = 1;
                    case 1:
                        if (!(queue.length > 0)) return [3 /*break*/, 8];
                        _a = queue.shift(), nodeId = _a.nodeId, path = _a.path, cost = _a.cost;
                        if (!(nodeId === endNodeId)) return [3 /*break*/, 6];
                        pathNodes = [];
                        _i = 0, path_1 = path;
                        _c.label = 2;
                    case 2:
                        if (!(_i < path_1.length)) return [3 /*break*/, 5];
                        id = path_1[_i];
                        return [4 /*yield*/, this.prisma.knowledgePrimitive.findUnique({
                                where: { primitiveId: id }
                            })];
                    case 3:
                        node = _c.sent();
                        if (node) {
                            pathNodes.push(this.mapToGraphNode(node));
                        }
                        _c.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, { path: pathNodes, cost: cost }];
                    case 6:
                        if (path.length >= maxPathLength) {
                            // Skip this path but continue processing other paths
                            return [3 /*break*/, 1];
                        }
                        if (visited.has(nodeId)) {
                            return [3 /*break*/, 1];
                        }
                        visited.add(nodeId);
                        return [4 /*yield*/, this.getRelationships(nodeId, ['PREREQUISITE', 'RELATED', 'ADVANCES_TO'])];
                    case 7:
                        relationships = _c.sent();
                        for (_b = 0, relationships_3 = relationships; _b < relationships_3.length; _b++) {
                            rel = relationships_3[_b];
                            targetId = rel.targetPrimitiveId;
                            if (!visited.has(targetId)) {
                                newCost = Math.round((cost + (1 - (rel.strength || 1.0))) * 1000) / 1000;
                                queue.push({
                                    nodeId: targetId,
                                    path: __spreadArray(__spreadArray([], path, true), [targetId], false),
                                    cost: newCost
                                });
                            }
                        }
                        return [3 /*break*/, 1];
                    case 8: 
                    // If we get here, no path was found
                    throw new Error("No learning path found between ".concat(startNodeId, " and ").concat(endNodeId));
                }
            });
        });
    };
    /**
     * Finds the learning path between mastery criteria
     */
    KnowledgeGraphTraversal.prototype.findCriterionLearningPath = function (startCriterionId_1, endCriterionId_1) {
        return __awaiter(this, arguments, void 0, function (startCriterionId, endCriterionId, maxPathLength) {
            var visited, queue, _a, criterionId, path, cost, pathCriteria, _i, path_2, id, criterion, ueeProgression, relationships, _b, relationships_4, rel, targetId, newCost;
            if (maxPathLength === void 0) { maxPathLength = 10; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        visited = new Set();
                        queue = [
                            { criterionId: startCriterionId, path: [startCriterionId], cost: 0 }
                        ];
                        _c.label = 1;
                    case 1:
                        if (!(queue.length > 0)) return [3 /*break*/, 8];
                        _a = queue.shift(), criterionId = _a.criterionId, path = _a.path, cost = _a.cost;
                        if (!(criterionId === endCriterionId)) return [3 /*break*/, 6];
                        pathCriteria = [];
                        _i = 0, path_2 = path;
                        _c.label = 2;
                    case 2:
                        if (!(_i < path_2.length)) return [3 /*break*/, 5];
                        id = path_2[_i];
                        return [4 /*yield*/, this.prisma.masteryCriterion.findUnique({
                                where: { id: id }
                            })];
                    case 3:
                        criterion = _c.sent();
                        if (criterion) {
                            pathCriteria.push(this.mapCriterionToGraphNode(criterion));
                        }
                        _c.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        ueeProgression = this.analyzeUUEProgression(pathCriteria);
                        return [2 /*return*/, { path: pathCriteria, cost: cost, ueeProgression: ueeProgression }];
                    case 6:
                        if (path.length >= maxPathLength) {
                            return [3 /*break*/, 1];
                        }
                        if (visited.has(criterionId)) {
                            return [3 /*break*/, 1];
                        }
                        visited.add(criterionId);
                        return [4 /*yield*/, this.getCriterionRelationships(criterionId, ['PREREQUISITE', 'ADVANCES_TO', 'RELATED'])];
                    case 7:
                        relationships = _c.sent();
                        for (_b = 0, relationships_4 = relationships; _b < relationships_4.length; _b++) {
                            rel = relationships_4[_b];
                            targetId = rel.targetCriterionId;
                            if (!visited.has(targetId)) {
                                newCost = cost + (1 - (rel.strength || 1.0));
                                queue.push({
                                    criterionId: targetId,
                                    path: __spreadArray(__spreadArray([], path, true), [targetId], false),
                                    cost: newCost
                                });
                            }
                        }
                        return [3 /*break*/, 1];
                    case 8: throw new Error("No learning path found between criteria ".concat(startCriterionId, " and ").concat(endCriterionId));
                }
            });
        });
    };
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    /**
     * Gets relationships for a knowledge primitive
     */
    KnowledgeGraphTraversal.prototype.getRelationships = function (nodeId, relationshipTypes) {
        return __awaiter(this, void 0, void 0, function () {
            var sourceId;
            return __generator(this, function (_a) {
                sourceId = isNaN(parseInt(nodeId)) ? nodeId : parseInt(nodeId);
                return [2 /*return*/, this.prisma.knowledgeRelationship.findMany({
                        where: {
                            sourcePrimitiveId: sourceId,
                            relationshipType: { in: relationshipTypes }
                        }
                    })];
            });
        });
    };
    /**
     * Gets relationships for a mastery criterion
     */
    KnowledgeGraphTraversal.prototype.getCriterionRelationships = function (criterionId, relationshipTypes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.prisma.masteryCriterionRelationship.findMany({
                        where: {
                            sourceCriterionId: criterionId,
                            relationshipType: { in: relationshipTypes }
                        }
                    })];
            });
        });
    };
    /**
     * Maps a Prisma KnowledgePrimitive to a GraphNode
     */
    KnowledgeGraphTraversal.prototype.mapToGraphNode = function (primitive) {
        return {
            id: primitive.primitiveId || primitive.id, // Handle both Prisma and test data formats
            title: primitive.title,
            description: primitive.description,
            type: primitive.primitiveType,
            difficulty: primitive.difficultyLevel,
            estimatedTime: primitive.estimatedTimeMinutes || 0,
            complexityScore: primitive.complexityScore
        };
    };
    /**
     * Maps a Prisma MasteryCriterion to a GraphNode
     */
    KnowledgeGraphTraversal.prototype.mapCriterionToGraphNode = function (criterion) {
        return {
            id: criterion.id.toString(),
            title: criterion.title,
            description: criterion.description,
            type: 'concept',
            difficulty: 'intermediate',
            estimatedTime: 30,
            complexityScore: criterion.complexityScore,
            uueStage: criterion.uueStage // Add UUE stage for progression analysis
        };
    };
    /**
     * Analyzes UUE progression in a learning path
     */
    KnowledgeGraphTraversal.prototype.analyzeUUEProgression = function (path) {
        var stageCounts = {
            UNDERSTAND: 0,
            USE: 0,
            EXPLORE: 0
        };
        // Count actual UUE stages from the criteria
        path.forEach(function (node) {
            if (node.uueStage) {
                var stage = node.uueStage.toUpperCase();
                if (stage in stageCounts) {
                    stageCounts[stage]++;
                }
            }
        });
        var stages = ['UNDERSTAND', 'USE', 'EXPLORE'];
        var progressionOrder = stages.filter(function (stage) { return stageCounts[stage] > 0; });
        var isOptimal = progressionOrder.length === stages.length &&
            progressionOrder.every(function (stage, index) { return stage === stages[index]; });
        return {
            understandCount: stageCounts.UNDERSTAND,
            useCount: stageCounts.USE,
            exploreCount: stageCounts.EXPLORE,
            progressionOrder: progressionOrder,
            isOptimal: isOptimal
        };
    };
    return KnowledgeGraphTraversal;
}());
exports.default = KnowledgeGraphTraversal;
