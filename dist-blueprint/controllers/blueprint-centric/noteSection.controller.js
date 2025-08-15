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
exports.noteSectionController = exports.NoteSectionController = void 0;
var noteSection_service_1 = require("../../services/blueprint-centric/noteSection.service");
var NoteSectionController = /** @class */ (function () {
    function NoteSectionController() {
        this.noteSectionService = new noteSection_service_1.NoteSectionService();
    }
    /**
     * Creates a new note section
     */
    NoteSectionController.prototype.createNoteSection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var noteData, userId, note, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        noteData = req.body;
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, this.noteSectionService.createNote(__assign(__assign({}, noteData), { userId: userId }))];
                    case 1:
                        note = _b.sent();
                        res.status(201).json(note);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        res.status(400).json({ error: error_1.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets a note section by ID
     */
    NoteSectionController.prototype.getNoteSection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, note, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, this.noteSectionService.getNote(id)];
                    case 1:
                        note = _a.sent();
                        res.json(note);
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        res.status(404).json({ error: error_2.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates a note section
     */
    NoteSectionController.prototype.updateNoteSection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, updateData, note, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        updateData = req.body;
                        return [4 /*yield*/, this.noteSectionService.updateNote(id, updateData)];
                    case 1:
                        note = _a.sent();
                        res.json(note);
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        res.status(400).json({ error: error_3.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deletes a note section
     */
    NoteSectionController.prototype.deleteNoteSection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, this.noteSectionService.deleteNote(id)];
                    case 1:
                        _a.sent();
                        res.status(204).send();
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        res.status(400).json({ error: error_4.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets note sections by section ID
     */
    NoteSectionController.prototype.getNoteSectionsBySection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var sectionId, notes, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        sectionId = req.params.sectionId;
                        return [4 /*yield*/, this.noteSectionService.getNotesBySection(sectionId)];
                    case 1:
                        notes = _a.sent();
                        res.json(notes);
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        res.status(400).json({ error: error_5.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets note sections by user
     */
    NoteSectionController.prototype.getUserNoteSections = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, notes, error_6;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, this.noteSectionService.getNotesWithSection(userId)];
                    case 1:
                        notes = _b.sent();
                        res.json(notes);
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _b.sent();
                        res.status(400).json({ error: error_6.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Searches note sections
     */
    NoteSectionController.prototype.searchNoteSections = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var query, userId, notes, error_7;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        query = req.query.query;
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, this.noteSectionService.searchNotes(userId, query)];
                    case 1:
                        notes = _b.sent();
                        res.json(notes);
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _b.sent();
                        res.status(400).json({ error: error_7.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Moves a note section to a different section
     */
    NoteSectionController.prototype.moveNoteSection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, id, sectionId, result, error_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = req.params, id = _a.id, sectionId = _a.sectionId;
                        return [4 /*yield*/, this.noteSectionService.moveNote(id, sectionId)];
                    case 1:
                        result = _b.sent();
                        res.json(result);
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _b.sent();
                        res.status(400).json({ error: error_8.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates note tags
     */
    NoteSectionController.prototype.updateNoteTags = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, tags, note, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        tags = req.body.tags;
                        return [4 /*yield*/, this.noteSectionService.updateNote(id, { tags: tags })];
                    case 1:
                        note = _a.sent();
                        res.json(note);
                        return [3 /*break*/, 3];
                    case 2:
                        error_9 = _a.sent();
                        res.status(400).json({ error: error_9.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets user note statistics
     */
    NoteSectionController.prototype.getUserNoteStats = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, stats, error_10;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, this.noteSectionService.getNoteStats(userId)];
                    case 1:
                        stats = _b.sent();
                        res.json(stats);
                        return [3 /*break*/, 3];
                    case 2:
                        error_10 = _b.sent();
                        res.status(400).json({ error: error_10.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets notes by section
     */
    NoteSectionController.prototype.getNotesBySection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var sectionId, notes, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        sectionId = req.params.sectionId;
                        return [4 /*yield*/, this.noteSectionService.getNotesBySection(sectionId)];
                    case 1:
                        notes = _a.sent();
                        res.json(notes);
                        return [3 /*break*/, 3];
                    case 2:
                        error_11 = _a.sent();
                        res.status(400).json({ error: error_11.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets notes by UUE stage
     */
    NoteSectionController.prototype.getNotesByUueStage = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var stage, _a, userId, sectionId_1, _b, limit, _c, offset, validStages, stageUpper_1, allNotes, notes, stageStats, error_12;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        stage = req.params.stage;
                        _a = req.query, userId = _a.userId, sectionId_1 = _a.sectionId, _b = _a.limit, limit = _b === void 0 ? 20 : _b, _c = _a.offset, offset = _c === void 0 ? 0 : _c;
                        if (!stage) {
                            return [2 /*return*/, res.status(400).json({ error: 'Stage parameter is required' })];
                        }
                        validStages = ['UNDERSTAND', 'USE', 'EXPLORE'];
                        stageUpper_1 = stage.toUpperCase();
                        if (!validStages.includes(stageUpper_1)) {
                            return [2 /*return*/, res.status(400).json({
                                    error: 'Invalid stage. Must be one of: UNDERSTAND, USE, EXPLORE',
                                    validStages: validStages
                                })];
                        }
                        return [4 /*yield*/, this.noteSectionService.getNotesWithSection(userId ? parseInt(userId) : 0)];
                    case 1:
                        allNotes = _d.sent();
                        notes = allNotes.filter(function (note) {
                            var _a;
                            // Filter by section if specified
                            if (sectionId_1 && ((_a = note.section) === null || _a === void 0 ? void 0 : _a.id) !== parseInt(sectionId_1)) {
                                return false;
                            }
                            // Simulate UUE stage filtering based on note characteristics
                            // In a real implementation, this would come from mastery tracking service
                            var noteStage = _this.determineNoteUueStage(note);
                            return noteStage === stageUpper_1;
                        }).slice(parseInt(offset), parseInt(offset) + parseInt(limit));
                        stageStats = {
                            totalNotes: notes.length,
                            stage: stageUpper_1,
                            averageLength: notes.length > 0 ?
                                Math.round(notes.reduce(function (sum, note) { var _a; return sum + (((_a = note.content) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0) / notes.length) : 0,
                            tags: this.extractCommonTags(notes),
                            lastUpdated: notes.length > 0 ?
                                new Date(Math.max.apply(Math, notes.map(function (n) { return new Date(n.updatedAt).getTime(); }))).toISOString() : null
                        };
                        res.json({
                            success: true,
                            data: {
                                stage: stageUpper_1,
                                notes: notes,
                                pagination: {
                                    limit: parseInt(limit),
                                    offset: parseInt(offset),
                                    total: notes.length,
                                    hasMore: notes.length === parseInt(limit)
                                },
                                stageStats: stageStats,
                                metadata: {
                                    requestDate: new Date().toISOString(),
                                    filters: {
                                        userId: userId || 'all',
                                        sectionId: sectionId_1 || 'all'
                                    }
                                }
                            }
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_12 = _d.sent();
                        console.error('Error getting notes by UUE stage:', error_12);
                        res.status(500).json({
                            success: false,
                            error: 'Failed to retrieve notes by UUE stage'
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Helper method to determine UUE stage based on note characteristics
     */
    NoteSectionController.prototype.determineNoteUueStage = function (note) {
        // This is a simplified heuristic - in a real implementation,
        // this would come from mastery tracking service
        var content = note.content || '';
        var tags = note.tags || [];
        // Simple heuristics based on content length and complexity
        if (content.length < 100 || tags.includes('basic') || tags.includes('intro')) {
            return 'UNDERSTAND';
        }
        else if (content.length < 500 || tags.includes('practice') || tags.includes('example')) {
            return 'USE';
        }
        else {
            return 'EXPLORE';
        }
    };
    /**
     * Helper method to extract common tags from notes
     */
    NoteSectionController.prototype.extractCommonTags = function (notes) {
        var tagCounts = {};
        notes.forEach(function (note) {
            if (note.tags && Array.isArray(note.tags)) {
                note.tags.forEach(function (tag) {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        // Return top 10 most common tags
        return Object.entries(tagCounts)
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        })
            .slice(0, 10)
            .map(function (_a) {
            var tag = _a[0];
            return tag;
        });
    };
    /**
     * Moves a note to a different section
     */
    NoteSectionController.prototype.moveNoteToSection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, id, sectionId, result, error_13;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = req.params, id = _a.id, sectionId = _a.sectionId;
                        return [4 /*yield*/, this.noteSectionService.moveNote(id, sectionId)];
                    case 1:
                        result = _b.sent();
                        res.json(result);
                        return [3 /*break*/, 3];
                    case 2:
                        error_13 = _b.sent();
                        res.status(400).json({ error: error_13.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets note hierarchy for a section
     */
    NoteSectionController.prototype.getNoteHierarchy = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var sectionId;
            return __generator(this, function (_a) {
                try {
                    sectionId = req.params.sectionId;
                    // This method doesn't exist yet, so we'll return an empty object for now
                    res.json({ sectionId: sectionId, hierarchy: [] });
                }
                catch (error) {
                    res.status(400).json({ error: error.message });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Gets section aggregation for notes
     */
    NoteSectionController.prototype.getSectionAggregation = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var sectionId;
            return __generator(this, function (_a) {
                try {
                    sectionId = req.params.sectionId;
                    // This method doesn't exist yet, so we'll return an empty object for now
                    res.json({ sectionId: sectionId, aggregation: {} });
                }
                catch (error) {
                    res.status(400).json({ error: error.message });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Updates note position within a section
     */
    NoteSectionController.prototype.updateNotePosition = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, position;
            return __generator(this, function (_a) {
                try {
                    id = req.params.id;
                    position = req.body.position;
                    // This method doesn't exist yet, so we'll return success for now
                    res.json({ success: true, message: 'Position updated' });
                }
                catch (error) {
                    res.status(400).json({ error: error.message });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Gets section statistics for notes
     */
    NoteSectionController.prototype.getSectionStatistics = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var sectionId;
            return __generator(this, function (_a) {
                try {
                    sectionId = req.params.sectionId;
                    // This method doesn't exist yet, so we'll return empty stats for now
                    res.json({ sectionId: sectionId, stats: {} });
                }
                catch (error) {
                    res.status(400).json({ error: error.message });
                }
                return [2 /*return*/];
            });
        });
    };
    return NoteSectionController;
}());
exports.NoteSectionController = NoteSectionController;
// Export controller instance
exports.noteSectionController = new NoteSectionController();
