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
exports.ContentAggregator = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
// ============================================================================
// CONTENT AGGREGATOR SERVICE
// ============================================================================
var ContentAggregator = /** @class */ (function () {
    function ContentAggregator() {
    }
    /**
     * Aggregates all content within a section and its children
     * Time Complexity: O(n + m) where n = sections, m = content items
     */
    ContentAggregator.prototype.aggregateSectionContent = function (sectionId) {
        return __awaiter(this, void 0, void 0, function () {
            var section, content;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getSectionWithChildren(sectionId)];
                    case 1:
                        section = _b.sent();
                        return [4 /*yield*/, this.recursiveContentAggregation(section)];
                    case 2:
                        content = _b.sent();
                        _a = {
                            section: section,
                            notes: content.notes,
                            questions: content.questions
                        };
                        return [4 /*yield*/, this.calculateMasteryProgress(sectionId)];
                    case 3: return [2 /*return*/, (_a.masteryProgress = _b.sent(),
                            _a.estimatedTime = this.calculateEstimatedTime(content),
                            _a.difficulty = this.calculateAverageDifficulty(content),
                            _a)];
                }
            });
        });
    };
    /**
     * Recursively aggregates content from all child sections
     */
    ContentAggregator.prototype.recursiveContentAggregation = function (section) {
        return __awaiter(this, void 0, void 0, function () {
            var notes, questions, _a, _b, _c, _d, _e, _f, _i, _g, child, childContent;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        notes = [];
                        questions = [];
                        _b = 
                        // Get direct content
                        (_a = notes.push).apply;
                        _c = [
                            // Get direct content
                            notes];
                        return [4 /*yield*/, this.getNotesBySection(section.id)];
                    case 1:
                        // Get direct content
                        _b.apply(_a, _c.concat([_h.sent()]));
                        _e = (_d = questions.push).apply;
                        _f = [questions];
                        return [4 /*yield*/, this.getMasteryCriteriaBySection(section.id)];
                    case 2:
                        _e.apply(_d, _f.concat([_h.sent()]));
                        _i = 0, _g = section.children;
                        _h.label = 3;
                    case 3:
                        if (!(_i < _g.length)) return [3 /*break*/, 6];
                        child = _g[_i];
                        return [4 /*yield*/, this.recursiveContentAggregation(child)];
                    case 4:
                        childContent = _h.sent();
                        notes.push.apply(notes, childContent.notes);
                        questions.push.apply(questions, childContent.questions);
                        _h.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [2 /*return*/, { notes: notes, questions: questions }];
                }
            });
        });
    };
    /**
     * Calculates mastery progress across all content in section
     */
    ContentAggregator.prototype.calculateMasteryProgress = function (sectionId) {
        return __awaiter(this, void 0, void 0, function () {
            var criteria, userMasteries, totalWeight, masteredWeight;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getMasteryCriteriaBySection(sectionId)];
                    case 1:
                        criteria = _a.sent();
                        return [4 /*yield*/, this.getUserMasteries(criteria.map(function (c) { return c.id; }))];
                    case 2:
                        userMasteries = _a.sent();
                        totalWeight = criteria.reduce(function (sum, c) { return sum + c.weight; }, 0);
                        masteredWeight = userMasteries.reduce(function (sum, m) {
                            var criterion = criteria.find(function (c) { return c.id === m.masteryCriterionId; });
                            return sum + (m.isMastered ? ((criterion === null || criterion === void 0 ? void 0 : criterion.weight) || 0) : 0);
                        }, 0);
                        return [2 /*return*/, {
                                overall: totalWeight > 0 ? masteredWeight / totalWeight : 0,
                                byStage: this.calculateProgressByStage(criteria, userMasteries),
                                totalCriteria: criteria.length,
                                masteredCriteria: userMasteries.filter(function (m) { return m.isMastered; }).length
                            }];
                }
            });
        });
    };
    /**
     * Calculates UUE stage progression for a section
     * FOUNDATIONAL: Essential for spaced repetition and learning pathways
     */
    ContentAggregator.prototype.calculateUueStageProgress = function (sectionId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var masteryCriteria, userMasteries, stageProgress, _loop_1, _i, masteryCriteria_1, criterion, currentStage, canProgress, nextStageRequirements;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getMasteryCriteriaBySection(sectionId)];
                    case 1:
                        masteryCriteria = _a.sent();
                        return [4 /*yield*/, this.getUserMasteriesForCriteria(masteryCriteria.map(function (mc) { return mc.id; }), userId)];
                    case 2:
                        userMasteries = _a.sent();
                        stageProgress = {
                            understand: { total: 0, mastered: 0, progress: 0 },
                            use: { total: 0, mastered: 0, progress: 0 },
                            explore: { total: 0, mastered: 0, progress: 0 }
                        };
                        _loop_1 = function (criterion) {
                            var mastery = userMasteries.find(function (m) { return m.masteryCriterionId === criterion.id; });
                            var stage = criterion.uueStage.toLowerCase();
                            stageProgress[stage].total++;
                            if (mastery === null || mastery === void 0 ? void 0 : mastery.isMastered) {
                                stageProgress[stage].mastered++;
                            }
                        };
                        // Calculate progress for each UUE stage
                        for (_i = 0, masteryCriteria_1 = masteryCriteria; _i < masteryCriteria_1.length; _i++) {
                            criterion = masteryCriteria_1[_i];
                            _loop_1(criterion);
                        }
                        // Calculate progress percentages
                        Object.values(stageProgress).forEach(function (stage) {
                            stage.progress = stage.total > 0 ? stage.mastered / stage.total : 0;
                        });
                        currentStage = this.determineCurrentUueStage(stageProgress);
                        canProgress = this.canProgressToNextStage(stageProgress, currentStage);
                        nextStageRequirements = this.getNextStageRequirements(stageProgress, currentStage);
                        return [2 /*return*/, __assign(__assign({}, stageProgress), { currentStage: currentStage, canProgress: canProgress, nextStageRequirements: nextStageRequirements })];
                }
            });
        });
    };
    /**
     * Aggregates content across multiple sections
     */
    ContentAggregator.prototype.aggregateMultipleSections = function (sectionIds) {
        return __awaiter(this, void 0, void 0, function () {
            var contentBySection, totalNotes, totalQuestions, totalEstimatedTime, difficultyScores, _i, sectionIds_1, sectionId, content, _a, difficultyScore, averageDifficulty, allCriteria, userMasteries, totalWeight, masteredWeight, masteryProgress;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        contentBySection = {};
                        totalNotes = 0;
                        totalQuestions = 0;
                        totalEstimatedTime = 0;
                        difficultyScores = [];
                        _i = 0, sectionIds_1 = sectionIds;
                        _b.label = 1;
                    case 1:
                        if (!(_i < sectionIds_1.length)) return [3 /*break*/, 5];
                        sectionId = sectionIds_1[_i];
                        _a = this.recursiveContentAggregation;
                        return [4 /*yield*/, this.getSectionWithChildren(sectionId)];
                    case 2: return [4 /*yield*/, _a.apply(this, [_b.sent()])];
                    case 3:
                        content = _b.sent();
                        contentBySection[sectionId] = content;
                        totalNotes += content.notes.length;
                        totalQuestions += content.questions.length;
                        totalEstimatedTime += content.estimatedTime;
                        difficultyScore = this.difficultyToScore(content.difficulty);
                        difficultyScores.push(difficultyScore);
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5:
                        averageDifficulty = this.scoreToDifficulty(difficultyScores.reduce(function (sum, score) { return sum + score; }, 0) / difficultyScores.length);
                        return [4 /*yield*/, this.getAllMasteryCriteria(sectionIds)];
                    case 6:
                        allCriteria = _b.sent();
                        return [4 /*yield*/, this.getUserMasteries(allCriteria.map(function (c) { return c.id; }))];
                    case 7:
                        userMasteries = _b.sent();
                        totalWeight = allCriteria.reduce(function (sum, c) { return sum + c.weight; }, 0);
                        masteredWeight = userMasteries.reduce(function (sum, m) {
                            var criterion = allCriteria.find(function (c) { return c.id === m.masteryCriterionId; });
                            return sum + (m.isMastered ? ((criterion === null || criterion === void 0 ? void 0 : criterion.weight) || 0) : 0);
                        }, 0);
                        masteryProgress = {
                            overall: totalWeight > 0 ? masteredWeight / totalWeight : 0,
                            byStage: this.calculateProgressByStage(allCriteria, userMasteries),
                            totalCriteria: allCriteria.length,
                            masteredCriteria: userMasteries.filter(function (m) { return m.isMastered; }).length
                        };
                        return [2 /*return*/, {
                                totalNotes: totalNotes,
                                totalQuestions: totalQuestions,
                                totalEstimatedTime: totalEstimatedTime,
                                averageDifficulty: averageDifficulty,
                                masteryProgress: masteryProgress,
                                contentBySection: contentBySection
                            }];
                }
            });
        });
    };
    /**
     * Gets content statistics for a user across all blueprints
     */
    ContentAggregator.prototype.getUserContentStats = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var sections, contentByBlueprint, totalNotes, totalQuestions, totalEstimatedTime, sectionsByBlueprint, _i, _a, _b, blueprintId, blueprintSections, sectionIds, blueprintContent, allCriteria, userMasteries, totalWeight, masteredWeight, masteryProgress;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, prisma.blueprintSection.findMany({
                            where: { userId: userId },
                            include: {
                                blueprint: {
                                    select: { id: true, title: true }
                                }
                            }
                        })];
                    case 1:
                        sections = _c.sent();
                        contentByBlueprint = {};
                        totalNotes = 0;
                        totalQuestions = 0;
                        totalEstimatedTime = 0;
                        sectionsByBlueprint = sections.reduce(function (acc, section) {
                            if (!acc[section.blueprintId]) {
                                acc[section.blueprintId] = [];
                            }
                            acc[section.blueprintId].push(section);
                            return acc;
                        }, {});
                        _i = 0, _a = Object.entries(sectionsByBlueprint);
                        _c.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        _b = _a[_i], blueprintId = _b[0], blueprintSections = _b[1];
                        sectionIds = blueprintSections.map(function (s) { return s.id; });
                        return [4 /*yield*/, this.aggregateMultipleSections(sectionIds)];
                    case 3:
                        blueprintContent = _c.sent();
                        contentByBlueprint[parseInt(blueprintId)] = __assign({ title: blueprintSections[0].blueprint.title, sections: blueprintSections.length }, blueprintContent);
                        totalNotes += blueprintContent.totalNotes;
                        totalQuestions += blueprintContent.totalQuestions;
                        totalEstimatedTime += blueprintContent.totalEstimatedTime;
                        _c.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [4 /*yield*/, this.getAllMasteryCriteriaForUser(userId)];
                    case 6:
                        allCriteria = _c.sent();
                        return [4 /*yield*/, this.getUserMasteries(allCriteria.map(function (c) { return c.id; }))];
                    case 7:
                        userMasteries = _c.sent();
                        totalWeight = allCriteria.reduce(function (sum, c) { return sum + c.weight; }, 0);
                        masteredWeight = userMasteries.reduce(function (sum, m) {
                            var criterion = allCriteria.find(function (c) { return c.id === m.masteryCriterionId; });
                            return sum + (m.isMastered ? ((criterion === null || criterion === void 0 ? void 0 : criterion.weight) || 0) : 0);
                        }, 0);
                        masteryProgress = {
                            overall: totalWeight > 0 ? masteredWeight / totalWeight : 0,
                            byStage: this.calculateProgressByStage(allCriteria, userMasteries),
                            totalCriteria: allCriteria.length,
                            masteredCriteria: userMasteries.filter(function (m) { return m.isMastered; }).length
                        };
                        return [2 /*return*/, {
                                totalSections: sections.length,
                                totalNotes: totalNotes,
                                totalQuestions: totalQuestions,
                                totalEstimatedTime: totalEstimatedTime,
                                masteryProgress: masteryProgress,
                                contentByBlueprint: contentByBlueprint
                            }];
                }
            });
        });
    };
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    /**
     * Gets a section with its children
     */
    ContentAggregator.prototype.getSectionWithChildren = function (sectionId) {
        return __awaiter(this, void 0, void 0, function () {
            var section;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.blueprintSection.findUnique({
                            where: { id: sectionId },
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
                        section = _a.sent();
                        if (!section) {
                            throw new Error("Section ".concat(sectionId, " not found"));
                        }
                        return [2 /*return*/, section];
                }
            });
        });
    };
    /**
     * Gets notes by section
     */
    ContentAggregator.prototype.getNotesBySection = function (sectionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.noteSection.findMany({
                        where: { blueprintSectionId: sectionId },
                        orderBy: { createdAt: 'desc' }
                    })];
            });
        });
    };
    /**
     * Gets mastery criteria by section
     */
    ContentAggregator.prototype.getMasteryCriteriaBySection = function (sectionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.masteryCriterion.findMany({
                        where: { blueprintSectionId: sectionId }
                    })];
            });
        });
    };
    /**
     * Gets all mastery criteria for multiple sections
     */
    ContentAggregator.prototype.getAllMasteryCriteria = function (sectionIds) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.masteryCriterion.findMany({
                        where: {
                            blueprintSectionId: { in: sectionIds }
                        }
                    })];
            });
        });
    };
    /**
     * Gets all mastery criteria for a user
     */
    ContentAggregator.prototype.getAllMasteryCriteriaForUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.masteryCriterion.findMany({
                        where: { userId: userId }
                    })];
            });
        });
    };
    /**
     * Gets user masteries for criteria
     */
    ContentAggregator.prototype.getUserMasteries = function (criterionIds) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (criterionIds.length === 0)
                    return [2 /*return*/, []];
                return [2 /*return*/, prisma.userCriterionMastery.findMany({
                        where: {
                            criterionId: { in: criterionIds }
                        }
                    })];
            });
        });
    };
    /**
     * Gets user masteries for criteria by user ID
     */
    ContentAggregator.prototype.getUserMasteriesForCriteria = function (criterionIds, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (criterionIds.length === 0)
                    return [2 /*return*/, []];
                return [2 /*return*/, prisma.userCriterionMastery.findMany({
                        where: {
                            criterionId: { in: criterionIds },
                            userId: userId
                        }
                    })];
            });
        });
    };
    /**
     * Calculates progress by UUE stage
     */
    ContentAggregator.prototype.calculateProgressByStage = function (criteria, userMasteries) {
        var stageProgress = {};
        // Group criteria by UUE stage
        var criteriaByStage = criteria.reduce(function (acc, criterion) {
            var stage = criterion.uueStage.toLowerCase();
            if (!acc[stage])
                acc[stage] = [];
            acc[stage].push(criterion);
            return acc;
        }, {});
        // Calculate progress for each stage
        for (var _i = 0, _a = Object.entries(criteriaByStage); _i < _a.length; _i++) {
            var _b = _a[_i], stage = _b[0], stageCriteria = _b[1];
            var totalWeight = stageCriteria.reduce(function (sum, c) { return sum + c.weight; }, 0);
            var masteredWeight = stageCriteria.reduce(function (sum, c) {
                var mastery = userMasteries.find(function (m) { return m.masteryCriterionId === c.id; });
                return sum + ((mastery === null || mastery === void 0 ? void 0 : mastery.isMastered) ? c.weight : 0);
            }, 0);
            stageProgress[stage] = totalWeight > 0 ? masteredWeight / totalWeight : 0;
        }
        return stageProgress;
    };
    /**
     * Determines current UUE stage based on mastery progress
     */
    ContentAggregator.prototype.determineCurrentUueStage = function (stageProgress) {
        var _a, _b, _c;
        if (((_a = stageProgress.explore) === null || _a === void 0 ? void 0 : _a.progress) >= 0.8)
            return 'EXPLORE';
        if (((_b = stageProgress.use) === null || _b === void 0 ? void 0 : _b.progress) >= 0.8)
            return 'USE';
        if (((_c = stageProgress.understand) === null || _c === void 0 ? void 0 : _c.progress) >= 0.8)
            return 'UNDERSTAND';
        return 'UNDERSTAND';
    };
    /**
     * Checks if user can progress to next UUE stage
     */
    ContentAggregator.prototype.canProgressToNextStage = function (stageProgress, currentStage) {
        var _a, _b, _c;
        switch (currentStage) {
            case 'UNDERSTAND':
                return ((_a = stageProgress.understand) === null || _a === void 0 ? void 0 : _a.progress) >= 0.8;
            case 'USE':
                return ((_b = stageProgress.use) === null || _b === void 0 ? void 0 : _b.progress) >= 0.8;
            case 'EXPLORE':
                return ((_c = stageProgress.explore) === null || _c === void 0 ? void 0 : _c.progress) >= 0.8;
            default:
                return false;
        }
    };
    /**
     * Gets requirements for next UUE stage
     */
    ContentAggregator.prototype.getNextStageRequirements = function (stageProgress, currentStage) {
        var _a, _b, _c;
        var requirements = [];
        switch (currentStage) {
            case 'UNDERSTAND':
                if (((_a = stageProgress.understand) === null || _a === void 0 ? void 0 : _a.progress) < 0.8) {
                    requirements.push("Master ".concat(Math.ceil((0.8 - stageProgress.understand.progress) * stageProgress.understand.total), " more understand criteria"));
                }
                break;
            case 'USE':
                if (((_b = stageProgress.use) === null || _b === void 0 ? void 0 : _b.progress) < 0.8) {
                    requirements.push("Master ".concat(Math.ceil((0.8 - stageProgress.use.progress) * stageProgress.use.total), " more use criteria"));
                }
                break;
            case 'EXPLORE':
                if (((_c = stageProgress.explore) === null || _c === void 0 ? void 0 : _c.progress) < 0.8) {
                    requirements.push("Master ".concat(Math.ceil((0.8 - stageProgress.explore.progress) * stageProgress.explore.total), " more explore criteria"));
                }
                break;
        }
        return requirements;
    };
    /**
     * Calculates estimated time for content
     */
    ContentAggregator.prototype.calculateEstimatedTime = function (content) {
        var totalTime = 0;
        // Add time for notes (estimate 5 minutes per note)
        totalTime += content.notes.length * 5;
        // Add time for mastery criteria (estimate 10 minutes per criterion)
        totalTime += content.questions.length * 10;
        return totalTime;
    };
    /**
     * Calculates average difficulty for content
     */
    ContentAggregator.prototype.calculateAverageDifficulty = function (content) {
        // For now, return the most common difficulty
        // In a real implementation, you might want to calculate a weighted average
        var difficulties = content.questions.map(function (q) { return q.difficulty || 'MEDIUM'; });
        if (difficulties.length === 0)
            return 'BEGINNER';
        var difficultyCounts = difficulties.reduce(function (acc, difficulty) {
            acc[difficulty] = (acc[difficulty] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(difficultyCounts).reduce(function (a, b) {
            return difficultyCounts[a[0]] > difficultyCounts[b[0]] ? a : b;
        })[0];
    };
    /**
     * Converts difficulty string to numeric score
     */
    ContentAggregator.prototype.difficultyToScore = function (difficulty) {
        switch (difficulty.toUpperCase()) {
            case 'BEGINNER': return 1;
            case 'INTERMEDIATE': return 2;
            case 'ADVANCED': return 3;
            default: return 1;
        }
    };
    /**
     * Converts numeric score to difficulty string
     */
    ContentAggregator.prototype.scoreToDifficulty = function (score) {
        if (score <= 1.5)
            return 'BEGINNER';
        if (score <= 2.5)
            return 'INTERMEDIATE';
        return 'ADVANCED';
    };
    return ContentAggregator;
}());
exports.ContentAggregator = ContentAggregator;
exports.default = ContentAggregator;
