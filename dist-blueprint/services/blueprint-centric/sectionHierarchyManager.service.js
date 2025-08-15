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
exports.SectionHierarchyManager = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
// ============================================================================
// SECTION HIERARCHY MANAGER SERVICE
// ============================================================================
var SectionHierarchyManager = /** @class */ (function () {
    function SectionHierarchyManager() {
    }
    /**
     * Builds a complete section tree from flat section array
     * Time Complexity: O(n) where n = number of sections
     * Space Complexity: O(n) for the tree structure
     */
    SectionHierarchyManager.prototype.buildSectionTree = function (sections) {
        var sectionMap = new Map();
        var rootSections = [];
        // First pass: create lookup map
        sections.forEach(function (section) {
            sectionMap.set(section.id, __assign(__assign({}, section), { children: [] }));
        });
        // Second pass: build hierarchy
        sections.forEach(function (section) {
            if (section.parentSectionId) {
                var parent_1 = sectionMap.get(section.parentSectionId);
                if (parent_1) {
                    parent_1.children.push(sectionMap.get(section.id));
                }
            }
            else {
                rootSections.push(sectionMap.get(section.id));
            }
        });
        // Sort by orderIndex at each level
        var sortSections = function (sections) {
            return sections.sort(function (a, b) { return a.orderIndex - b.orderIndex; })
                .map(function (section) { return (__assign(__assign({}, section), { children: sortSections(section.children), stats: {
                    noteCount: 0, // Will be calculated when needed
                    questionCount: 0,
                    masteryProgress: 0,
                    estimatedTimeMinutes: 0
                } })); });
        };
        return sortSections(rootSections);
    };
    /**
     * Calculates optimal section depth and prevents circular references
     * Time Complexity: O(n) where n = number of sections
     */
    SectionHierarchyManager.prototype.calculateSectionDepth = function (sections) {
        return __awaiter(this, void 0, void 0, function () {
            var depthMap, visited, calculateDepth;
            return __generator(this, function (_a) {
                depthMap = new Map();
                visited = new Set();
                calculateDepth = function (sectionId, currentDepth) {
                    if (currentDepth === void 0) { currentDepth = 0; }
                    if (visited.has(sectionId)) {
                        throw new Error("Circular reference detected in section ".concat(sectionId));
                    }
                    if (depthMap.has(sectionId)) {
                        return depthMap.get(sectionId);
                    }
                    visited.add(sectionId);
                    var section = sections.find(function (s) { return s.id === sectionId; });
                    if (!section) {
                        visited.delete(sectionId);
                        return 0;
                    }
                    var maxChildDepth = 0;
                    if (section.parentSectionId) {
                        maxChildDepth = calculateDepth(section.parentSectionId, currentDepth + 1);
                    }
                    var depth = Math.max(currentDepth, maxChildDepth);
                    depthMap.set(sectionId, depth);
                    visited.delete(sectionId);
                    return depth;
                };
                sections.forEach(function (section) {
                    if (!depthMap.has(section.id)) {
                        calculateDepth(section.id);
                    }
                });
                return [2 /*return*/, depthMap];
            });
        });
    };
    /**
     * Validates the entire section hierarchy
     */
    SectionHierarchyManager.prototype.validateHierarchy = function (blueprintId) {
        return __awaiter(this, void 0, void 0, function () {
            var sections, result, error_1, validSectionIds, depthMap, orderMap, maxDepth;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.blueprintSection.findMany({
                            where: { blueprintId: blueprintId },
                            orderBy: [{ depth: 'asc' }, { orderIndex: 'asc' }]
                        })];
                    case 1:
                        sections = _a.sent();
                        result = {
                            isValid: true,
                            errors: [],
                            warnings: [],
                            circularReferences: [],
                            orphanedSections: []
                        };
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.calculateSectionDepth(sections)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        result.isValid = false;
                        result.errors.push(error_1.message);
                        result.circularReferences.push(error_1.message);
                        return [3 /*break*/, 5];
                    case 5:
                        validSectionIds = new Set(sections.map(function (s) { return s.id; }));
                        sections.forEach(function (section) {
                            if (section.parentSectionId && !validSectionIds.has(section.parentSectionId)) {
                                result.isValid = false;
                                result.errors.push("Section ".concat(section.id, " references invalid parent ").concat(section.parentSectionId));
                                result.orphanedSections.push(section.id);
                            }
                        });
                        depthMap = new Map();
                        sections.forEach(function (section) {
                            if (section.parentSectionId) {
                                var parent_2 = sections.find(function (s) { return s.id === section.parentSectionId; });
                                if (parent_2) {
                                    var expectedDepth = parent_2.depth + 1;
                                    if (section.depth !== expectedDepth) {
                                        result.warnings.push("Section ".concat(section.id, " has depth ").concat(section.depth, ", expected ").concat(expectedDepth));
                                    }
                                }
                            }
                        });
                        orderMap = new Map();
                        sections.forEach(function (section) {
                            var key = section.parentSectionId || 'root';
                            if (!orderMap.has(key)) {
                                orderMap.set(key, new Set());
                            }
                            if (orderMap.get(key).has(section.orderIndex)) {
                                result.warnings.push("Duplicate order index ".concat(section.orderIndex, " in ").concat(key === 'root' ? 'root' : "parent ".concat(key)));
                            }
                            orderMap.get(key).add(section.orderIndex);
                        });
                        maxDepth = Math.max.apply(Math, sections.map(function (s) { return s.depth; }));
                        if (maxDepth > 10) {
                            result.warnings.push("Maximum depth of ".concat(maxDepth, " exceeds recommended limit of 10"));
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Prevents circular references when building hierarchy
     */
    SectionHierarchyManager.prototype.preventCircularReferences = function (sections) {
        var visited = new Set();
        var recursionStack = new Set();
        var hasCycle = function (sectionId) {
            if (recursionStack.has(sectionId)) {
                return true; // Cycle detected
            }
            if (visited.has(sectionId)) {
                return false; // Already processed
            }
            visited.add(sectionId);
            recursionStack.add(sectionId);
            var section = sections.find(function (s) { return s.id === sectionId; });
            if (section === null || section === void 0 ? void 0 : section.parentSectionId) {
                if (hasCycle(section.parentSectionId)) {
                    return true;
                }
            }
            recursionStack.delete(sectionId);
            return false;
        };
        for (var _i = 0, sections_1 = sections; _i < sections_1.length; _i++) {
            var section = sections_1[_i];
            if (hasCycle(section.id)) {
                return false;
            }
        }
        return true;
    };
    /**
     * Optimizes section hierarchy for better performance
     */
    SectionHierarchyManager.prototype.optimizeHierarchy = function (blueprintId) {
        return __awaiter(this, void 0, void 0, function () {
            var sections, changes, optimized, depthMap, _i, sections_2, section, expectedDepth, sectionsByParent, _a, _b, _c, parentId, parentSections, sortedSections, i, expectedOrder, depths, performance;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, prisma.blueprintSection.findMany({
                            where: { blueprintId: blueprintId }
                        })];
                    case 1:
                        sections = _d.sent();
                        changes = [];
                        optimized = false;
                        return [4 /*yield*/, this.calculateSectionDepth(sections)];
                    case 2:
                        depthMap = _d.sent();
                        _i = 0, sections_2 = sections;
                        _d.label = 3;
                    case 3:
                        if (!(_i < sections_2.length)) return [3 /*break*/, 6];
                        section = sections_2[_i];
                        expectedDepth = depthMap.get(section.id) || 0;
                        if (!(section.depth !== expectedDepth)) return [3 /*break*/, 5];
                        return [4 /*yield*/, prisma.blueprintSection.update({
                                where: { id: section.id },
                                data: { depth: expectedDepth }
                            })];
                    case 4:
                        _d.sent();
                        changes.push("Updated section ".concat(section.id, " depth from ").concat(section.depth, " to ").concat(expectedDepth));
                        optimized = true;
                        _d.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        sectionsByParent = this.groupSectionsByParent(sections);
                        _a = 0, _b = Object.entries(sectionsByParent);
                        _d.label = 7;
                    case 7:
                        if (!(_a < _b.length)) return [3 /*break*/, 12];
                        _c = _b[_a], parentId = _c[0], parentSections = _c[1];
                        sortedSections = parentSections.sort(function (a, b) { return a.orderIndex - b.orderIndex; });
                        i = 0;
                        _d.label = 8;
                    case 8:
                        if (!(i < sortedSections.length)) return [3 /*break*/, 11];
                        expectedOrder = i + 1;
                        if (!(sortedSections[i].orderIndex !== expectedOrder)) return [3 /*break*/, 10];
                        return [4 /*yield*/, prisma.blueprintSection.update({
                                where: { id: sortedSections[i].id },
                                data: { orderIndex: expectedOrder }
                            })];
                    case 9:
                        _d.sent();
                        changes.push("Updated section ".concat(sortedSections[i].id, " order from ").concat(sortedSections[i].orderIndex, " to ").concat(expectedOrder));
                        optimized = true;
                        _d.label = 10;
                    case 10:
                        i++;
                        return [3 /*break*/, 8];
                    case 11:
                        _a++;
                        return [3 /*break*/, 7];
                    case 12:
                        depths = Array.from(depthMap.values());
                        performance = {
                            maxDepth: Math.max.apply(Math, depths),
                            averageDepth: depths.reduce(function (sum, depth) { return sum + depth; }, 0) / depths.length,
                            totalSections: sections.length
                        };
                        return [2 /*return*/, { optimized: optimized, changes: changes, performance: performance }];
                }
            });
        });
    };
    /**
     * Groups sections by their parent for optimization
     */
    SectionHierarchyManager.prototype.groupSectionsByParent = function (sections) {
        var grouped = {};
        sections.forEach(function (section) {
            var parentId = section.parentSectionId || 'root';
            if (!grouped[parentId]) {
                grouped[parentId] = [];
            }
            grouped[parentId].push(section);
        });
        return grouped;
    };
    /**
     * Moves a section to a new parent with validation
     */
    SectionHierarchyManager.prototype.moveSection = function (sectionId, newParentId, newOrderIndex) {
        return __awaiter(this, void 0, void 0, function () {
            var section, newParent, newDepth, finalOrderIndex, affectedSections, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, prisma.blueprintSection.findUnique({
                            where: { id: sectionId }
                        })];
                    case 1:
                        section = _c.sent();
                        if (!section) {
                            throw new Error("Section ".concat(sectionId, " not found"));
                        }
                        newParent = null;
                        if (!newParentId) return [3 /*break*/, 4];
                        return [4 /*yield*/, prisma.blueprintSection.findUnique({
                                where: { id: newParentId }
                            })];
                    case 2:
                        newParent = _c.sent();
                        if (!newParent) {
                            throw new Error("New parent section ".concat(newParentId, " not found"));
                        }
                        return [4 /*yield*/, this.wouldCreateCycle(sectionId, newParentId)];
                    case 3:
                        // Check if moving would create a cycle
                        if (_c.sent()) {
                            throw new Error("Moving section ".concat(sectionId, " to ").concat(newParentId, " would create a circular reference"));
                        }
                        _c.label = 4;
                    case 4:
                        newDepth = newParent ? newParent.depth + 1 : 0;
                        finalOrderIndex = newOrderIndex;
                        if (!(finalOrderIndex === undefined)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.getNextOrderIndex(section.blueprintId, newParentId)];
                    case 5:
                        finalOrderIndex = _c.sent();
                        _c.label = 6;
                    case 6: 
                    // Update the section
                    return [4 /*yield*/, prisma.blueprintSection.update({
                            where: { id: sectionId },
                            data: {
                                parentSectionId: newParentId,
                                depth: newDepth,
                                orderIndex: finalOrderIndex
                            }
                        })];
                    case 7:
                        // Update the section
                        _c.sent();
                        return [4 /*yield*/, this.updateDescendantDepths(sectionId, newDepth + 1)];
                    case 8:
                        affectedSections = _c.sent();
                        if (!newParentId) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.reorderSiblings(newParentId)];
                    case 9:
                        _c.sent();
                        _c.label = 10;
                    case 10:
                        _b = {
                            success: true
                        };
                        _a = this.buildSectionTree;
                        return [4 /*yield*/, prisma.blueprintSection.findUnique({ where: { id: sectionId } })];
                    case 11: return [4 /*yield*/, _a.apply(this, [[_c.sent()]])[0]];
                    case 12: return [2 /*return*/, (_b.section = _c.sent(),
                            _b.depthChanges = Math.abs(newDepth - section.depth),
                            _b.affectedSections = affectedSections,
                            _b)];
                }
            });
        });
    };
    /**
     * Checks if moving a section would create a cycle
     */
    SectionHierarchyManager.prototype.wouldCreateCycle = function (sectionId, newParentId) {
        return __awaiter(this, void 0, void 0, function () {
            var visited, checkCycle;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        visited = new Set();
                        checkCycle = function (currentId) { return __awaiter(_this, void 0, void 0, function () {
                            var section;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (currentId === sectionId) {
                                            return [2 /*return*/, true]; // Cycle detected
                                        }
                                        if (visited.has(currentId)) {
                                            return [2 /*return*/, false]; // Already checked
                                        }
                                        visited.add(currentId);
                                        return [4 /*yield*/, prisma.blueprintSection.findUnique({
                                                where: { id: currentId }
                                            })];
                                    case 1:
                                        section = _a.sent();
                                        if (!(section === null || section === void 0 ? void 0 : section.parentSectionId)) return [3 /*break*/, 3];
                                        return [4 /*yield*/, checkCycle(section.parentSectionId)];
                                    case 2: return [2 /*return*/, _a.sent()];
                                    case 3: return [2 /*return*/, false];
                                }
                            });
                        }); };
                        return [4 /*yield*/, checkCycle(newParentId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Updates depths for all descendants of a section
     */
    SectionHierarchyManager.prototype.updateDescendantDepths = function (sectionId, newDepth) {
        return __awaiter(this, void 0, void 0, function () {
            var affectedSections, updateDescendants;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        affectedSections = [];
                        updateDescendants = function (currentId, currentDepth) { return __awaiter(_this, void 0, void 0, function () {
                            var children, _i, children_1, child;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prisma.blueprintSection.findMany({
                                            where: { parentSectionId: currentId }
                                        })];
                                    case 1:
                                        children = _a.sent();
                                        _i = 0, children_1 = children;
                                        _a.label = 2;
                                    case 2:
                                        if (!(_i < children_1.length)) return [3 /*break*/, 6];
                                        child = children_1[_i];
                                        return [4 /*yield*/, prisma.blueprintSection.update({
                                                where: { id: child.id },
                                                data: { depth: currentDepth }
                                            })];
                                    case 3:
                                        _a.sent();
                                        affectedSections.push(child.id);
                                        return [4 /*yield*/, updateDescendants(child.id, currentDepth + 1)];
                                    case 4:
                                        _a.sent();
                                        _a.label = 5;
                                    case 5:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 6: return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, updateDescendants(sectionId, newDepth)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, affectedSections];
                }
            });
        });
    };
    /**
     * Reorders siblings to maintain consistent ordering
     */
    SectionHierarchyManager.prototype.reorderSiblings = function (parentId) {
        return __awaiter(this, void 0, void 0, function () {
            var siblings, i, expectedOrder;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.blueprintSection.findMany({
                            where: { parentSectionId: parentId },
                            orderBy: { orderIndex: 'asc' }
                        })];
                    case 1:
                        siblings = _a.sent();
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < siblings.length)) return [3 /*break*/, 5];
                        expectedOrder = i + 1;
                        if (!(siblings[i].orderIndex !== expectedOrder)) return [3 /*break*/, 4];
                        return [4 /*yield*/, prisma.blueprintSection.update({
                                where: { id: siblings[i].id },
                                data: { orderIndex: expectedOrder }
                            })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets the next available order index for a parent
     */
    SectionHierarchyManager.prototype.getNextOrderIndex = function (blueprintId, parentSectionId) {
        return __awaiter(this, void 0, void 0, function () {
            var maxOrder;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.blueprintSection.aggregate({
                            where: {
                                blueprintId: blueprintId,
                                parentSectionId: parentSectionId
                            },
                            _max: {
                                orderIndex: true
                            }
                        })];
                    case 1:
                        maxOrder = _a.sent();
                        return [2 /*return*/, (maxOrder._max.orderIndex || 0) + 1];
                }
            });
        });
    };
    /**
     * Flattens a section tree for easier processing
     */
    SectionHierarchyManager.prototype.flattenSectionTree = function (tree) {
        var flattened = [];
        var flatten = function (sections) {
            sections.forEach(function (section) {
                flattened.push(section);
                if (section.children.length > 0) {
                    flatten(section.children);
                }
            });
        };
        flatten(tree);
        return flattened;
    };
    /**
     * Finds the path from root to a specific section
     */
    SectionHierarchyManager.prototype.findSectionPath = function (sectionId) {
        return __awaiter(this, void 0, void 0, function () {
            var path, buildPath;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = [];
                        buildPath = function (currentId) { return __awaiter(_this, void 0, void 0, function () {
                            var section;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, prisma.blueprintSection.findUnique({
                                            where: { id: currentId }
                                        })];
                                    case 1:
                                        section = _a.sent();
                                        if (!section)
                                            return [2 /*return*/];
                                        if (!section.parentSectionId) return [3 /*break*/, 3];
                                        return [4 /*yield*/, buildPath(section.parentSectionId)];
                                    case 2:
                                        _a.sent();
                                        _a.label = 3;
                                    case 3:
                                        path.push({
                                            id: section.id,
                                            title: section.title,
                                            description: section.description,
                                            depth: section.depth,
                                            orderIndex: section.orderIndex,
                                            difficulty: section.difficulty,
                                            estimatedTimeMinutes: section.estimatedTimeMinutes,
                                            children: [],
                                            stats: {
                                                noteCount: 0,
                                                questionCount: 0,
                                                masteryProgress: 0,
                                                estimatedTimeMinutes: 0
                                            }
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, buildPath(sectionId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, path];
                }
            });
        });
    };
    return SectionHierarchyManager;
}());
exports.SectionHierarchyManager = SectionHierarchyManager;
exports.default = SectionHierarchyManager;
