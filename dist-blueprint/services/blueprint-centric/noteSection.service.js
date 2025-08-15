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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteSectionService = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
// ============================================================================
// NOTE SECTION SERVICE
// ============================================================================
var NoteSectionService = /** @class */ (function () {
    function NoteSectionService() {
    }
    /**
     * Creates a new note in a blueprint section
     */
    NoteSectionService.prototype.createNote = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var blueprintSectionId, userId, noteData, section;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        blueprintSectionId = data.blueprintSectionId, userId = data.userId, noteData = __rest(data, ["blueprintSectionId", "userId"]);
                        return [4 /*yield*/, prisma.blueprintSection.findFirst({
                                where: {
                                    id: blueprintSectionId,
                                    userId: userId
                                }
                            })];
                    case 1:
                        section = _a.sent();
                        if (!section) {
                            throw new Error("Section ".concat(blueprintSectionId, " not found or access denied"));
                        }
                        return [2 /*return*/, prisma.noteSection.create({
                                data: __assign(__assign({}, noteData), { blueprintSectionId: blueprintSectionId, userId: userId, contentVersion: 1 })
                            })];
                }
            });
        });
    };
    /**
     * Gets a note by ID
     */
    NoteSectionService.prototype.getNote = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var note;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.noteSection.findUnique({
                            where: { id: id }
                        })];
                    case 1:
                        note = _a.sent();
                        if (!note) {
                            throw new Error("Note ".concat(id, " not found"));
                        }
                        return [2 /*return*/, note];
                }
            });
        });
    };
    /**
     * Updates a note
     */
    NoteSectionService.prototype.updateNote = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var existingNote, contentChanged, updateData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getNote(id)];
                    case 1:
                        existingNote = _a.sent();
                        contentChanged = data.content !== undefined ||
                            data.contentBlocks !== undefined ||
                            data.contentHtml !== undefined ||
                            data.plainText !== undefined;
                        updateData = __assign(__assign({}, data), { contentVersion: contentChanged ? existingNote.contentVersion + 1 : existingNote.contentVersion });
                        return [2 /*return*/, prisma.noteSection.update({
                                where: { id: id },
                                data: updateData
                            })];
                }
            });
        });
    };
    /**
     * Deletes a note
     */
    NoteSectionService.prototype.deleteNote = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.noteSection.delete({
                            where: { id: id }
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets all notes for a specific section
     */
    NoteSectionService.prototype.getNotesBySection = function (sectionId) {
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
     * Gets notes with section information
     */
    NoteSectionService.prototype.getNotesWithSection = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.noteSection.findMany({
                        where: { userId: userId },
                        include: {
                            blueprintSection: {
                                select: {
                                    id: true,
                                    title: true,
                                    depth: true
                                }
                            }
                        },
                        orderBy: { updatedAt: 'desc' }
                    })];
            });
        });
    };
    /**
     * Moves a note to a different section
     */
    NoteSectionService.prototype.moveNote = function (noteId, newSectionId) {
        return __awaiter(this, void 0, void 0, function () {
            var note, newSection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getNote(noteId)];
                    case 1:
                        note = _a.sent();
                        return [4 /*yield*/, prisma.blueprintSection.findFirst({
                                where: {
                                    id: newSectionId,
                                    userId: note.userId
                                }
                            })];
                    case 2:
                        newSection = _a.sent();
                        if (!newSection) {
                            throw new Error("Section ".concat(newSectionId, " not found or access denied"));
                        }
                        return [2 /*return*/, prisma.noteSection.update({
                                where: { id: noteId },
                                data: { blueprintSectionId: newSectionId }
                            })];
                }
            });
        });
    };
    /**
     * Updates note content with version tracking
     */
    NoteSectionService.prototype.updateContent = function (noteId, content, blocks, html, plainText) {
        return __awaiter(this, void 0, void 0, function () {
            var existingNote;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getNote(noteId)];
                    case 1:
                        existingNote = _a.sent();
                        return [2 /*return*/, prisma.noteSection.update({
                                where: { id: noteId },
                                data: {
                                    content: content,
                                    contentBlocks: blocks,
                                    contentHtml: html,
                                    plainText: plainText,
                                    contentVersion: existingNote.contentVersion + 1
                                }
                            })];
                }
            });
        });
    };
    /**
     * Gets note history (for future versioning system)
     */
    NoteSectionService.prototype.getNoteHistory = function (noteId) {
        return __awaiter(this, void 0, void 0, function () {
            var note;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getNote(noteId)];
                    case 1:
                        note = _a.sent();
                        return [2 /*return*/, [{
                                    id: note.id,
                                    content: note.content,
                                    contentBlocks: note.contentBlocks,
                                    contentHtml: note.contentHtml,
                                    plainText: note.plainText,
                                    contentVersion: note.contentVersion,
                                    createdAt: note.createdAt
                                }]];
                }
            });
        });
    };
    /**
     * Searches notes by content
     */
    NoteSectionService.prototype.searchNotes = function (userId, query) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma.noteSection.findMany({
                        where: {
                            userId: userId,
                            OR: [
                                { title: { contains: query, mode: 'insensitive' } },
                                { content: { contains: query, mode: 'insensitive' } },
                                { plainText: { contains: query, mode: 'insensitive' } }
                            ]
                        },
                        orderBy: { updatedAt: 'desc' }
                    })];
            });
        });
    };
    /**
     * Gets notes by tags (from content blocks)
     */
    NoteSectionService.prototype.getNotesByTags = function (userId, tags) {
        return __awaiter(this, void 0, void 0, function () {
            var notes;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.noteSection.findMany({
                            where: { userId: userId }
                        })];
                    case 1:
                        notes = _a.sent();
                        return [2 /*return*/, notes.filter(function (note) {
                                if (!note.contentBlocks)
                                    return false;
                                try {
                                    var blocks = JSON.parse(note.contentBlocks);
                                    var noteTags_1 = _this.extractTagsFromBlocks(blocks);
                                    return tags.some(function (tag) { return noteTags_1.includes(tag); });
                                }
                                catch (_a) {
                                    return false;
                                }
                            })];
                }
            });
        });
    };
    /**
     * Gets note statistics for a user
     */
    NoteSectionService.prototype.getNoteStats = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var notes, totalNotes, notesBySection, totalContentLength;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.noteSection.findMany({
                            where: { userId: userId },
                            include: {
                                blueprintSection: {
                                    select: { title: true }
                                }
                            }
                        })];
                    case 1:
                        notes = _a.sent();
                        totalNotes = notes.length;
                        notesBySection = {};
                        totalContentLength = 0;
                        notes.forEach(function (note) {
                            var sectionTitle = note.blueprintSection.title;
                            notesBySection[sectionTitle] = (notesBySection[sectionTitle] || 0) + 1;
                            totalContentLength += note.content.length;
                        });
                        return [2 /*return*/, {
                                totalNotes: totalNotes,
                                notesBySection: notesBySection,
                                totalContentLength: totalContentLength,
                                averageContentLength: totalNotes > 0 ? totalContentLength / totalNotes : 0
                            }];
                }
            });
        });
    };
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    /**
     * Extracts tags from content blocks
     */
    NoteSectionService.prototype.extractTagsFromBlocks = function (blocks) {
        var tags = [];
        var extractTags = function (block) {
            if (block.type === 'tag' && block.content) {
                tags.push(block.content);
            }
            if (block.content && Array.isArray(block.content)) {
                block.content.forEach(extractTags);
            }
        };
        blocks.forEach(extractTags);
        return tags;
    };
    return NoteSectionService;
}());
exports.NoteSectionService = NoteSectionService;
exports.default = NoteSectionService;
