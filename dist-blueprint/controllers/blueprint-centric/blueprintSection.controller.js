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
Object.defineProperty(exports, "__esModule", { value: true });
exports.blueprintSectionController = exports.BlueprintSectionController = void 0;
var client_1 = require("@prisma/client");
var blueprintSection_service_1 = require("../../services/blueprint-centric/blueprintSection.service");
var noteSection_service_1 = require("../../services/blueprint-centric/noteSection.service");
var contentAggregator_service_1 = require("../../services/blueprint-centric/contentAggregator.service");
var sectionHierarchyManager_service_1 = require("../../services/blueprint-centric/sectionHierarchyManager.service");
var prisma = new client_1.PrismaClient();
var blueprintSectionService = new blueprintSection_service_1.default(prisma);
var noteSectionService = new noteSection_service_1.default();
var contentAggregator = new contentAggregator_service_1.default();
var sectionHierarchyManager = new sectionHierarchyManager_service_1.default();
// ============================================================================
// BLUEPRINT SECTION CONTROLLER
// ============================================================================
var BlueprintSectionController = /** @class */ (function () {
    function BlueprintSectionController() {
    }
    /**
     * Creates a new blueprint section
     */
    BlueprintSectionController.prototype.createSection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, title, description, blueprintId, parentSectionId, difficulty, estimatedTimeMinutes, userId, section, error_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        _a = req.body, title = _a.title, description = _a.description, blueprintId = _a.blueprintId, parentSectionId = _a.parentSectionId, difficulty = _a.difficulty, estimatedTimeMinutes = _a.estimatedTimeMinutes;
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, blueprintSectionService.createSection({
                                title: title,
                                description: description,
                                blueprintId: blueprintId,
                                parentSectionId: parentSectionId,
                                difficulty: difficulty,
                                estimatedTimeMinutes: estimatedTimeMinutes,
                                userId: userId
                            })];
                    case 1:
                        section = _c.sent();
                        res.status(201).json(section);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _c.sent();
                        res.status(400).json({ error: error_1.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets a blueprint section with its children
     */
    BlueprintSectionController.prototype.getSection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, section, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, blueprintSectionService.getSection(parseInt(id))];
                    case 1:
                        section = _a.sent();
                        res.json(section);
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
     * Updates a blueprint section
     */
    BlueprintSectionController.prototype.updateSection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, updateData, section, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        updateData = req.body;
                        return [4 /*yield*/, blueprintSectionService.updateSection(parseInt(id), updateData)];
                    case 1:
                        section = _a.sent();
                        res.json(section);
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
     * Deletes a blueprint section
     */
    BlueprintSectionController.prototype.deleteSection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, blueprintSectionService.deleteSection(parseInt(id))];
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
     * Gets the complete section tree for a blueprint
     */
    BlueprintSectionController.prototype.getSectionTree = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var blueprintId, tree, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        blueprintId = req.params.blueprintId;
                        return [4 /*yield*/, blueprintSectionService.getSectionTree(parseInt(blueprintId))];
                    case 1:
                        tree = _a.sent();
                        res.json(tree);
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
     * Moves a section to a new parent
     */
    BlueprintSectionController.prototype.moveSection = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, newParentId, section, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        newParentId = req.body.newParentId;
                        return [4 /*yield*/, blueprintSectionService.moveSection(parseInt(id), parseInt(newParentId))];
                    case 1:
                        section = _a.sent();
                        res.json(section);
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        res.status(400).json({ error: error_6.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Reorders sections within a blueprint
     */
    BlueprintSectionController.prototype.reorderSections = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var blueprintId, orderData, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        blueprintId = req.params.blueprintId;
                        orderData = req.body.orderData;
                        return [4 /*yield*/, blueprintSectionService.reorderSections(parseInt(blueprintId), orderData)];
                    case 1:
                        _a.sent();
                        res.status(200).json({ message: 'Sections reordered successfully' });
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        res.status(400).json({ error: error_7.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets content for a section
     */
    BlueprintSectionController.prototype.getSectionContent = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, content, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, blueprintSectionService.getSectionContent(parseInt(id))];
                    case 1:
                        content = _a.sent();
                        res.json(content);
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _a.sent();
                        res.status(400).json({ error: error_8.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets statistics for a section
     */
    BlueprintSectionController.prototype.getSectionStats = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, stats, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        return [4 /*yield*/, blueprintSectionService.getSectionStats(parseInt(id))];
                    case 1:
                        stats = _a.sent();
                        res.json(stats);
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
     * Validates the section hierarchy
     */
    BlueprintSectionController.prototype.validateHierarchy = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var blueprintId, validation, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        blueprintId = req.params.blueprintId;
                        return [4 /*yield*/, sectionHierarchyManager.validateHierarchy(parseInt(blueprintId))];
                    case 1:
                        validation = _a.sent();
                        res.json(validation);
                        return [3 /*break*/, 3];
                    case 2:
                        error_10 = _a.sent();
                        res.status(400).json({ error: error_10.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Optimizes the section hierarchy
     */
    BlueprintSectionController.prototype.optimizeHierarchy = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var blueprintId, optimization, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        blueprintId = req.params.blueprintId;
                        return [4 /*yield*/, sectionHierarchyManager.optimizeHierarchy(parseInt(blueprintId))];
                    case 1:
                        optimization = _a.sent();
                        res.json(optimization);
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
     * Gets UUE stage progression for a section
     */
    BlueprintSectionController.prototype.getUueStageProgress = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var id, userId, progress, error_12;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, contentAggregator.calculateUueStageProgress(id, userId)];
                    case 1:
                        progress = _b.sent();
                        res.json(progress);
                        return [3 /*break*/, 3];
                    case 2:
                        error_12 = _b.sent();
                        res.status(400).json({ error: error_12.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets content statistics for a user across all blueprints
     */
    BlueprintSectionController.prototype.getUserContentStats = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, stats, error_13;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                        if (!userId) {
                            return [2 /*return*/, res.status(401).json({ error: 'User not authenticated' })];
                        }
                        return [4 /*yield*/, contentAggregator.getUserContentStats(userId)];
                    case 1:
                        stats = _b.sent();
                        res.json(stats);
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
    return BlueprintSectionController;
}());
exports.BlueprintSectionController = BlueprintSectionController;
exports.default = BlueprintSectionController;
// Export controller instance
exports.blueprintSectionController = new BlueprintSectionController();
