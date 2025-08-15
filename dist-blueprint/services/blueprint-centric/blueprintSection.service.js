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
// ============================================================================
// SERVICE CLASS
// ============================================================================
var BlueprintSectionService = /** @class */ (function () {
    function BlueprintSectionService(prisma) {
        this.prisma = prisma;
    }
    /**
     * Creates a new section
     */
    BlueprintSectionService.prototype.createSection = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var depth, parent_1, orderIndex;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Validate input
                        if (!((_a = data.title) === null || _a === void 0 ? void 0 : _a.trim())) {
                            throw new Error('Section title is required');
                        }
                        if (!data.blueprintId) {
                            throw new Error('Blueprint ID is required');
                        }
                        depth = 0;
                        if (!data.parentSectionId) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.prisma.blueprintSection.findUnique({
                                where: { id: data.parentSectionId }
                            })];
                    case 1:
                        parent_1 = _b.sent();
                        if (!parent_1) {
                            throw new Error("Parent section ".concat(data.parentSectionId, " not found"));
                        }
                        depth = parent_1.depth + 1;
                        _b.label = 2;
                    case 2: return [4 /*yield*/, this.getNextOrderIndex(data.blueprintId, data.parentSectionId)];
                    case 3:
                        orderIndex = _b.sent();
                        return [4 /*yield*/, this.prisma.blueprintSection.create({
                                data: {
                                    title: data.title,
                                    description: data.description,
                                    blueprintId: data.blueprintId,
                                    parentSectionId: data.parentSectionId,
                                    depth: depth,
                                    orderIndex: orderIndex,
                                    difficulty: data.difficulty || 'BEGINNER',
                                    estimatedTimeMinutes: data.estimatedTimeMinutes,
                                    userId: data.userId
                                }
                            })];
                    case 4: 
                    // Create section
                    return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /**
     * Gets a section by ID with its children and counts
     */
    BlueprintSectionService.prototype.getSection = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var section;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.prisma.blueprintSection.findUnique({
                            where: { id: id },
                            include: {
                                children: {
                                    orderBy: { orderIndex: 'asc' }
                                },
                                _count: {
                                    select: {
                                        notes: true,
                                        knowledgePrimitives: true,
                                        masteryCriteria: true
                                    }
                                }
                            }
                        })];
                    case 1:
                        section = _b.sent();
                        if (!section) {
                            throw new Error("Section ".concat(id, " not found"));
                        }
                        // Transform the result to match our interface
                        return [2 /*return*/, __assign(__assign({}, section), { children: ((_a = section.children) === null || _a === void 0 ? void 0 : _a.map(function (child) { return (__assign(__assign({}, child), { children: [], _count: { notes: 0, knowledgePrimitives: 0, masteryCriteria: 0 } })); })) || [], _count: section._count || { notes: 0, knowledgePrimitives: 0, masteryCriteria: 0 } })];
                }
            });
        });
    };
    /**
     * Updates a section
     */
    BlueprintSectionService.prototype.updateSection = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updateData, depth, parent_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updateData = __assign({}, data);
                        if (!(data.parentSectionId !== undefined)) return [3 /*break*/, 3];
                        depth = 0;
                        if (!data.parentSectionId) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.prisma.blueprintSection.findUnique({
                                where: { id: data.parentSectionId }
                            })];
                    case 1:
                        parent_2 = _a.sent();
                        if (!parent_2) {
                            throw new Error("Parent section ".concat(data.parentSectionId, " not found"));
                        }
                        depth = parent_2.depth + 1;
                        _a.label = 2;
                    case 2:
                        updateData.depth = depth;
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.prisma.blueprintSection.update({
                            where: { id: id },
                            data: updateData
                        })];
                    case 4: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Deletes a section and its children recursively
     */
    BlueprintSectionService.prototype.deleteSection = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var section;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getSection(id)];
                    case 1:
                        section = _a.sent();
                        return [4 /*yield*/, this.deleteSectionRecursively(section)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Recursively deletes a section and its children
     */
    BlueprintSectionService.prototype.deleteSectionRecursively = function (section) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, child;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(section.children && section.children.length > 0)) return [3 /*break*/, 4];
                        _i = 0, _a = section.children;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        child = _a[_i];
                        return [4 /*yield*/, this.deleteSectionRecursively(child)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: 
                    // Delete the section itself
                    return [4 /*yield*/, this.prisma.blueprintSection.delete({
                            where: { id: section.id }
                        })];
                    case 5:
                        // Delete the section itself
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Moves a section to a new parent
     */
    BlueprintSectionService.prototype.moveSection = function (sectionId, newParentId) {
        return __awaiter(this, void 0, void 0, function () {
            var section, newParent, _a, depth;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getSection(sectionId)];
                    case 1:
                        section = _b.sent();
                        if (!newParentId) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.getSection(newParentId)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = null;
                        _b.label = 4;
                    case 4:
                        newParent = _a;
                        depth = 0;
                        if (newParent) {
                            depth = newParent.depth + 1;
                        }
                        return [4 /*yield*/, this.prisma.blueprintSection.update({
                                where: { id: sectionId },
                                data: {
                                    parentSectionId: newParentId,
                                    depth: depth
                                }
                            })];
                    case 5: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /**
     * Reorders sections within a blueprint
     */
    BlueprintSectionService.prototype.reorderSections = function (blueprintId, sectionIds) {
        return __awaiter(this, void 0, void 0, function () {
            var existingSections;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.blueprintSection.findMany({
                            where: { blueprintId: blueprintId },
                            select: { id: true }
                        })];
                    case 1:
                        existingSections = _a.sent();
                        if (existingSections.length !== sectionIds.length) {
                            throw new Error('Some sections do not belong to the specified blueprint');
                        }
                        // Update each section
                        return [4 /*yield*/, this.prisma.$transaction(sectionIds.map(function (_a) {
                                var id = _a.id, orderIndex = _a.orderIndex;
                                return _this.prisma.blueprintSection.update({
                                    where: { id: id },
                                    data: { orderIndex: orderIndex }
                                });
                            }))];
                    case 2:
                        // Update each section
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets content for a section
     */
    BlueprintSectionService.prototype.getSectionContent = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var section, notes, masteryCriteria, masteryProgress, estimatedTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getSection(id)];
                    case 1:
                        section = _a.sent();
                        return [4 /*yield*/, this.prisma.noteSection.findMany({
                                where: { blueprintSectionId: id },
                                orderBy: { createdAt: 'desc' }
                            })];
                    case 2:
                        notes = _a.sent();
                        return [4 /*yield*/, this.prisma.masteryCriterion.findMany({
                                where: { blueprintSectionId: id }
                            })];
                    case 3:
                        masteryCriteria = _a.sent();
                        return [4 /*yield*/, this.calculateMasteryProgress(id)];
                    case 4:
                        masteryProgress = _a.sent();
                        estimatedTime = this.calculateEstimatedTime(section, notes, masteryCriteria);
                        return [2 /*return*/, {
                                section: section,
                                notes: notes,
                                questions: [], // TODO: Implement when question model is available
                                masteryCriteria: masteryCriteria,
                                masteryProgress: masteryProgress,
                                estimatedTime: estimatedTime
                            }];
                }
            });
        });
    };
    /**
     * Gets section statistics
     */
    BlueprintSectionService.prototype.getSectionStats = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var section, noteCount, questionCount, masteryProgress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getSection(id)];
                    case 1:
                        section = _a.sent();
                        noteCount = section._count.notes;
                        questionCount = section._count.masteryCriteria;
                        return [4 /*yield*/, this.calculateMasteryProgress(id)];
                    case 2:
                        masteryProgress = _a.sent();
                        return [2 /*return*/, {
                                noteCount: noteCount,
                                questionCount: questionCount,
                                masteryProgress: masteryProgress,
                                estimatedTime: section.estimatedTimeMinutes || 0,
                                depth: section.depth,
                                childCount: section.children.length
                            }];
                }
            });
        });
    };
    /**
     * Builds a complete section tree from flat sections
     */
    BlueprintSectionService.prototype.getSectionTree = function (blueprintId) {
        return __awaiter(this, void 0, void 0, function () {
            var sections;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.blueprintSection.findMany({
                            where: { blueprintId: blueprintId },
                            orderBy: { orderIndex: 'asc' }
                        })];
                    case 1:
                        sections = _a.sent();
                        return [2 /*return*/, this.buildSectionTree(sections)];
                }
            });
        });
    };
    /**
     * Builds section tree from flat array
     */
    BlueprintSectionService.prototype.buildSectionTree = function (sections) {
        var sectionMap = new Map();
        var rootSections = [];
        // Create section map
        for (var _i = 0, sections_1 = sections; _i < sections_1.length; _i++) {
            var section = sections_1[_i];
            sectionMap.set(section.id, {
                id: section.id,
                title: section.title,
                description: section.description || undefined,
                depth: section.depth,
                orderIndex: section.orderIndex,
                difficulty: section.difficulty,
                estimatedTimeMinutes: section.estimatedTimeMinutes || undefined,
                children: [],
                stats: {
                    noteCount: 0,
                    questionCount: 0,
                    masteryProgress: 0,
                    estimatedTime: section.estimatedTimeMinutes || 0
                }
            });
        }
        // Build hierarchy
        for (var _a = 0, sections_2 = sections; _a < sections_2.length; _a++) {
            var section = sections_2[_a];
            if (section.parentSectionId) {
                var parent_3 = sectionMap.get(section.parentSectionId);
                if (parent_3) {
                    parent_3.children.push(sectionMap.get(section.id));
                }
            }
            else {
                rootSections.push(sectionMap.get(section.id));
            }
        }
        // Sort sections recursively
        var sortSections = function (sections) {
            return sections.sort(function (a, b) { return a.orderIndex - b.orderIndex; }).map(function (section) { return (__assign(__assign({}, section), { children: sortSections(section.children) })); });
        };
        return sortSections(rootSections);
    };
    /**
     * Gets the next order index for a section
     */
    BlueprintSectionService.prototype.getNextOrderIndex = function (blueprintId, parentSectionId) {
        return __awaiter(this, void 0, void 0, function () {
            var existingSections, expectedIndex, _i, existingSections_1, section;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.blueprintSection.findMany({
                            where: {
                                blueprintId: blueprintId,
                                parentSectionId: parentSectionId
                            },
                            select: {
                                orderIndex: true
                            },
                            orderBy: {
                                orderIndex: 'asc'
                            }
                        })];
                    case 1:
                        existingSections = _a.sent();
                        expectedIndex = 0;
                        for (_i = 0, existingSections_1 = existingSections; _i < existingSections_1.length; _i++) {
                            section = existingSections_1[_i];
                            if (section.orderIndex !== expectedIndex) {
                                return [2 /*return*/, expectedIndex];
                            }
                            expectedIndex++;
                        }
                        // If no gaps found, return the next index after the last one
                        return [2 /*return*/, expectedIndex];
                }
            });
        });
    };
    /**
     * Calculates mastery progress for a section
     */
    BlueprintSectionService.prototype.calculateMasteryProgress = function (sectionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement mastery progress calculation
                return [2 /*return*/, 0];
            });
        });
    };
    /**
     * Calculates estimated time for a section
     */
    BlueprintSectionService.prototype.calculateEstimatedTime = function (section, notes, masteryCriteria) {
        var totalTime = section.estimatedTimeMinutes || 0;
        // Add time for notes
        totalTime += notes.length * 5; // 5 minutes per note
        // Add time for mastery criteria
        totalTime += masteryCriteria.length * 10; // 10 minutes per criterion
        return totalTime;
    };
    return BlueprintSectionService;
}());
exports.default = BlueprintSectionService;
