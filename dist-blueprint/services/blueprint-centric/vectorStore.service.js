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
exports.VectorStoreService = void 0;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var VectorStoreService = /** @class */ (function () {
    function VectorStoreService() {
        // Initialize Pinecone configuration
        this.pineconeApiKey = process.env.PINECONE_API_KEY || '';
        this.pineconeEnvironment = process.env.PINECONE_ENVIRONMENT || '';
        this.pineconeIndex = process.env.PINECONE_INDEX || 'elevate-knowledge';
        this.embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-ada-002';
        this.validateConfiguration();
    }
    /**
     * Main vector search method
     * Searches for semantically similar content across all indexed types
     */
    VectorStoreService.prototype.searchVectorStore = function (query, filters) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, queryEmbedding, searchResults, enrichedResults, filteredResults, processingTime, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 7]);
                        return [4 /*yield*/, this.generateEmbedding(query)];
                    case 2:
                        queryEmbedding = _a.sent();
                        return [4 /*yield*/, this.pineconeSearch(queryEmbedding.vector, filters)];
                    case 3:
                        searchResults = _a.sent();
                        return [4 /*yield*/, this.enrichSearchResults(searchResults, filters)];
                    case 4:
                        enrichedResults = _a.sent();
                        filteredResults = this.applyPostSearchFilters(enrichedResults, filters);
                        processingTime = Date.now() - startTime;
                        console.log("Vector search completed in ".concat(processingTime, "ms"));
                        return [2 /*return*/, filteredResults];
                    case 5:
                        error_1 = _a.sent();
                        console.error('Vector search failed:', error_1);
                        return [4 /*yield*/, this.fallbackDatabaseSearch(query, filters)];
                    case 6: 
                    // Fallback to database-based search
                    return [2 /*return*/, _a.sent()];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generates vector embeddings for content
     */
    VectorStoreService.prototype.generateEmbedding = function (content) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, vector, vector, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        if (!(this.embeddingModel === 'text-embedding-ada-002')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.generateOpenAIEmbedding(content)];
                    case 2:
                        vector = _a.sent();
                        return [2 /*return*/, {
                                vector: vector,
                                dimension: 1536,
                                model: 'text-embedding-ada-002',
                                processingTimeMs: Date.now() - startTime
                            }];
                    case 3:
                        vector = this.generateHashBasedEmbedding(content);
                        return [2 /*return*/, {
                                vector: vector,
                                dimension: 128,
                                model: 'hash-based-fallback',
                                processingTimeMs: Date.now() - startTime
                            }];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_2 = _a.sent();
                        console.error('Embedding generation failed:', error_2);
                        throw new Error("Failed to generate embedding: ".concat(error_2.message));
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Indexes content in the vector store
     */
    VectorStoreService.prototype.indexContent = function (content) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, results, _i, content_1, item, embedding, metadata, error_3, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        results = {
                            success: true,
                            indexedCount: 0,
                            errors: [],
                            processingTimeMs: 0
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        _i = 0, content_1 = content;
                        _a.label = 2;
                    case 2:
                        if (!(_i < content_1.length)) return [3 /*break*/, 8];
                        item = content_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 6, , 7]);
                        return [4 /*yield*/, this.generateEmbedding(item.content)];
                    case 4:
                        embedding = _a.sent();
                        metadata = __assign(__assign({}, item.metadata), { contentType: item.contentType, contentLength: item.content.length, indexedAt: new Date().toISOString() });
                        // Index in Pinecone
                        return [4 /*yield*/, this.pineconeUpsert(item.content, embedding.vector, metadata)];
                    case 5:
                        // Index in Pinecone
                        _a.sent();
                        results.indexedCount++;
                        return [3 /*break*/, 7];
                    case 6:
                        error_3 = _a.sent();
                        results.errors.push("Failed to index ".concat(item.contentType, ": ").concat(error_3.message));
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8:
                        results.processingTimeMs = Date.now() - startTime;
                        return [2 /*return*/, results];
                    case 9:
                        error_4 = _a.sent();
                        results.success = false;
                        results.errors.push("Indexing failed: ".concat(error_4.message));
                        results.processingTimeMs = Date.now() - startTime;
                        return [2 /*return*/, results];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Batch indexes blueprint content
     */
    VectorStoreService.prototype.indexBlueprintContent = function (blueprintId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, sections, primitives, notes, contentToIndex, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, Promise.all([
                                this.getBlueprintSections(blueprintId),
                                this.getBlueprintPrimitives(blueprintId),
                                this.getBlueprintNotes(blueprintId)
                            ])];
                    case 1:
                        _a = _b.sent(), sections = _a[0], primitives = _a[1], notes = _a[2];
                        contentToIndex = __spreadArray(__spreadArray(__spreadArray([], sections.map(function (section) { return ({
                            content: "".concat(section.title, " ").concat(section.description || ''),
                            contentType: 'section',
                            metadata: {
                                title: section.title,
                                description: section.description,
                                blueprintSectionId: section.id,
                                blueprintId: blueprintId,
                                userId: section.userId
                            }
                        }); }), true), primitives.map(function (primitive) { return ({
                            content: "".concat(primitive.title, " ").concat(primitive.description || ''),
                            contentType: 'primitive',
                            metadata: {
                                title: primitive.title,
                                description: primitive.description,
                                conceptTags: primitive.conceptTags || [],
                                complexityScore: primitive.complexityScore,
                                ueeLevel: primitive.ueeLevel,
                                blueprintSectionId: primitive.blueprintSectionId || undefined,
                                blueprintId: blueprintId,
                                userId: primitive.userId
                            }
                        }); }), true), notes.map(function (note) { return ({
                            content: "".concat(note.title, " ").concat(note.content),
                            contentType: 'note',
                            metadata: {
                                title: note.title,
                                blueprintSectionId: note.blueprintSectionId,
                                blueprintId: blueprintId,
                                userId: note.userId
                            }
                        }); }), true);
                        return [4 /*yield*/, this.indexContent(contentToIndex)];
                    case 2: 
                    // Index all content
                    return [2 /*return*/, _b.sent()];
                    case 3:
                        error_5 = _b.sent();
                        console.error('Blueprint content indexing failed:', error_5);
                        return [2 /*return*/, {
                                success: false,
                                indexedCount: 0,
                                errors: ["Blueprint indexing failed: ".concat(error_5.message)],
                                processingTimeMs: 0
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates existing content in the vector store
     */
    VectorStoreService.prototype.updateContent = function (contentId, contentType, newContent, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var embedding, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.generateEmbedding(newContent)];
                    case 1:
                        embedding = _a.sent();
                        // Update in Pinecone
                        return [4 /*yield*/, this.pineconeUpsert(newContent, embedding.vector, __assign(__assign({}, metadata), { contentType: contentType, contentId: contentId, updatedAt: new Date().toISOString() }))];
                    case 2:
                        // Update in Pinecone
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_6 = _a.sent();
                        console.error('Content update failed:', error_6);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deletes content from the vector store
     */
    VectorStoreService.prototype.deleteContent = function (contentId, contentType) {
        return __awaiter(this, void 0, void 0, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Delete from Pinecone
                        return [4 /*yield*/, this.pineconeDelete(contentId)];
                    case 1:
                        // Delete from Pinecone
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_7 = _a.sent();
                        console.error('Content deletion failed:', error_7);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Performs similarity search between content items
     */
    VectorStoreService.prototype.findSimilarContent = function (contentId_1, contentType_1) {
        return __awaiter(this, arguments, void 0, function (contentId, contentType, maxResults, similarityThreshold) {
            var contentVector, similarResults, error_8;
            if (maxResults === void 0) { maxResults = 10; }
            if (similarityThreshold === void 0) { similarityThreshold = 0.7; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.getContentVector(contentId)];
                    case 1:
                        contentVector = _a.sent();
                        if (!contentVector) {
                            throw new Error("Content vector not found for ".concat(contentId));
                        }
                        return [4 /*yield*/, this.pineconeSearch(contentVector, {
                                maxResults: maxResults,
                                similarityThreshold: similarityThreshold,
                                excludeIds: [contentId]
                            })];
                    case 2:
                        similarResults = _a.sent();
                        return [4 /*yield*/, this.enrichSearchResults(similarResults)];
                    case 3: 
                    // Enrich and return results
                    return [2 /*return*/, _a.sent()];
                    case 4:
                        error_8 = _a.sent();
                        console.error('Similar content search failed:', error_8);
                        return [2 /*return*/, []];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    VectorStoreService.prototype.validateConfiguration = function () {
        if (!this.pineconeApiKey) {
            console.warn('PINECONE_API_KEY not set, using fallback search');
        }
        if (!this.pineconeEnvironment) {
            console.warn('PINECONE_ENVIRONMENT not set, using fallback search');
        }
    };
    VectorStoreService.prototype.generateOpenAIEmbedding = function (content) {
        return __awaiter(this, void 0, void 0, function () {
            var dimension, vector, i, hash;
            return __generator(this, function (_a) {
                dimension = 1536;
                vector = [];
                for (i = 0; i < dimension; i++) {
                    hash = this.hashString(content + i.toString());
                    vector.push((hash % 2000 - 1000) / 1000); // Normalize to [-1, 1]
                }
                return [2 /*return*/, vector];
            });
        });
    };
    VectorStoreService.prototype.generateHashBasedEmbedding = function (content) {
        var dimension = 128;
        var vector = [];
        for (var i = 0; i < dimension; i++) {
            var hash = this.hashString(content + i.toString());
            vector.push((hash % 2000 - 1000) / 1000);
        }
        return vector;
    };
    VectorStoreService.prototype.hashString = function (str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    };
    VectorStoreService.prototype.pineconeSearch = function (vector, filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would perform actual Pinecone search
                // For now, return placeholder results
                return [2 /*return*/, [
                        {
                            id: 'placeholder_1',
                            score: 0.95,
                            metadata: { contentType: 'section', sourceId: '1' }
                        },
                        {
                            id: 'placeholder_2',
                            score: 0.87,
                            metadata: { contentType: 'primitive', sourceId: '2' }
                        }
                    ]];
            });
        });
    };
    VectorStoreService.prototype.pineconeUpsert = function (content, vector, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would upsert to Pinecone
                console.log('Pinecone upsert placeholder:', { content: content.substring(0, 50), metadata: metadata });
                return [2 /*return*/];
            });
        });
    };
    VectorStoreService.prototype.pineconeDelete = function (contentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would delete from Pinecone
                console.log('Pinecone delete placeholder:', contentId);
                return [2 /*return*/];
            });
        });
    };
    VectorStoreService.prototype.getContentVector = function (contentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would retrieve vector from Pinecone
                // For now, return null
                return [2 /*return*/, null];
            });
        });
    };
    VectorStoreService.prototype.enrichSearchResults = function (searchResults, filters) {
        return __awaiter(this, void 0, void 0, function () {
            var enriched, _i, searchResults_1, result, contentDetails, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        enriched = [];
                        _i = 0, searchResults_1 = searchResults;
                        _a.label = 1;
                    case 1:
                        if (!(_i < searchResults_1.length)) return [3 /*break*/, 6];
                        result = searchResults_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.getContentDetails(result.metadata.sourceId, result.metadata.contentType)];
                    case 3:
                        contentDetails = _a.sent();
                        if (contentDetails) {
                            enriched.push({
                                id: result.id,
                                content: contentDetails.content,
                                similarity: result.score,
                                sourceType: result.metadata.contentType,
                                sourceId: result.metadata.sourceId,
                                metadata: {
                                    conceptTags: contentDetails.conceptTags || [],
                                    complexityScore: contentDetails.complexityScore,
                                    ueeLevel: contentDetails.ueeLevel,
                                    blueprintSectionId: contentDetails.blueprintSectionId,
                                    blueprintId: contentDetails.blueprintId,
                                    userId: contentDetails.userId,
                                    lastUpdated: contentDetails.updatedAt
                                }
                            });
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_9 = _a.sent();
                        console.error("Failed to enrich result ".concat(result.id, ":"), error_9);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, enriched];
                }
            });
        });
    };
    VectorStoreService.prototype.applyPostSearchFilters = function (results, filters) {
        var filtered = results;
        // Apply similarity threshold
        if (filters === null || filters === void 0 ? void 0 : filters.similarityThreshold) {
            filtered = filtered.filter(function (r) { return r.similarity >= filters.similarityThreshold; });
        }
        // Apply blueprint filter
        if (filters === null || filters === void 0 ? void 0 : filters.blueprintId) {
            filtered = filtered.filter(function (r) { return r.metadata.blueprintId === filters.blueprintId; });
        }
        // Apply section filter
        if (filters === null || filters === void 0 ? void 0 : filters.sectionId) {
            filtered = filtered.filter(function (r) { return r.metadata.blueprintSectionId === filters.sectionId; });
        }
        // Apply UEE level filter
        if (filters === null || filters === void 0 ? void 0 : filters.ueeLevel) {
            filtered = filtered.filter(function (r) { return r.metadata.ueeLevel === filters.ueeLevel; });
        }
        // Apply difficulty range filter
        if (filters === null || filters === void 0 ? void 0 : filters.difficultyRange) {
            var _a = filters.difficultyRange, min_1 = _a[0], max_1 = _a[1];
            filtered = filtered.filter(function (r) {
                var score = r.metadata.complexityScore || 0;
                return score >= min_1 && score <= max_1;
            });
        }
        // Apply concept tags filter
        if ((filters === null || filters === void 0 ? void 0 : filters.conceptTags) && filters.conceptTags.length > 0) {
            filtered = filtered.filter(function (r) {
                return r.metadata.conceptTags.some(function (tag) {
                    return filters.conceptTags.includes(tag);
                });
            });
        }
        // Limit results
        if (filters === null || filters === void 0 ? void 0 : filters.maxResults) {
            filtered = filtered.slice(0, filters.maxResults);
        }
        return filtered;
    };
    VectorStoreService.prototype.fallbackDatabaseSearch = function (query, filters) {
        return __awaiter(this, void 0, void 0, function () {
            var results, sections, primitives, notes, error_10;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.searchBlueprintSections(query, filters)];
                    case 2:
                        sections = _a.sent();
                        results.push.apply(results, sections.map(function (section) { return ({
                            id: "section_".concat(section.id),
                            content: "".concat(section.title, " ").concat(section.description || ''),
                            similarity: _this.calculateTextSimilarity(query, section.title),
                            sourceType: 'section',
                            sourceId: section.id.toString(),
                            metadata: {
                                conceptTags: [],
                                complexityScore: undefined,
                                ueeLevel: undefined,
                                blueprintSectionId: section.id,
                                blueprintId: section.blueprintId,
                                userId: section.userId
                            }
                        }); }));
                        return [4 /*yield*/, this.searchKnowledgePrimitives(query, filters)];
                    case 3:
                        primitives = _a.sent();
                        results.push.apply(results, primitives.map(function (primitive) { return ({
                            id: "primitive_".concat(primitive.id),
                            content: "".concat(primitive.title, " ").concat(primitive.description || ''),
                            similarity: _this.calculateTextSimilarity(query, primitive.title),
                            sourceType: 'primitive',
                            sourceId: primitive.id.toString(),
                            metadata: {
                                conceptTags: primitive.conceptTags || [],
                                complexityScore: primitive.complexityScore,
                                ueeLevel: primitive.ueeLevel,
                                blueprintSectionId: primitive.blueprintSectionId || undefined,
                                blueprintId: primitive.blueprintId,
                                userId: primitive.userId
                            }
                        }); }));
                        return [4 /*yield*/, this.searchNotes(query, filters)];
                    case 4:
                        notes = _a.sent();
                        results.push.apply(results, notes.map(function (note) { return ({
                            id: "note_".concat(note.id),
                            content: "".concat(note.title, " ").concat(note.content),
                            similarity: _this.calculateTextSimilarity(query, note.title),
                            sourceType: 'note',
                            sourceId: note.id.toString(),
                            metadata: {
                                conceptTags: [],
                                complexityScore: undefined,
                                ueeLevel: undefined,
                                blueprintSectionId: note.blueprintSectionId,
                                blueprintId: undefined,
                                userId: note.userId
                            }
                        }); }));
                        // Sort by similarity and apply filters
                        return [2 /*return*/, results
                                .filter(function (result) { return result.similarity > 0.3; })
                                .sort(function (a, b) { return b.similarity - a.similarity; })
                                .slice(0, (filters === null || filters === void 0 ? void 0 : filters.maxResults) || 20)];
                    case 5:
                        error_10 = _a.sent();
                        console.error('Fallback search failed:', error_10);
                        return [2 /*return*/, []];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    VectorStoreService.prototype.calculateTextSimilarity = function (query, content) {
        var queryWords = query.toLowerCase().split(/\s+/);
        var contentWords = content.toLowerCase().split(/\s+/);
        var matches = 0;
        var _loop_1 = function (queryWord) {
            if (contentWords.some(function (contentWord) { return contentWord.includes(queryWord); })) {
                matches++;
            }
        };
        for (var _i = 0, queryWords_1 = queryWords; _i < queryWords_1.length; _i++) {
            var queryWord = queryWords_1[_i];
            _loop_1(queryWord);
        }
        return matches / queryWords.length;
    };
    VectorStoreService.prototype.getContentDetails = function (sourceId, contentType) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 9, , 10]);
                        _a = contentType;
                        switch (_a) {
                            case 'section': return [3 /*break*/, 1];
                            case 'primitive': return [3 /*break*/, 3];
                            case 'note': return [3 /*break*/, 5];
                        }
                        return [3 /*break*/, 7];
                    case 1: return [4 /*yield*/, prisma.blueprintSection.findUnique({
                            where: { id: parseInt(sourceId) }
                        })];
                    case 2: return [2 /*return*/, _c.sent()];
                    case 3: return [4 /*yield*/, prisma.knowledgePrimitive.findUnique({
                            where: { id: parseInt(sourceId) }
                        })];
                    case 4: return [2 /*return*/, _c.sent()];
                    case 5: return [4 /*yield*/, prisma.noteSection.findUnique({
                            where: { id: parseInt(sourceId) }
                        })];
                    case 6: return [2 /*return*/, _c.sent()];
                    case 7: return [2 /*return*/, null];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        _b = _c.sent();
                        return [2 /*return*/, null];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    VectorStoreService.prototype.getBlueprintSections = function (blueprintId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.blueprintSection.findMany({
                            where: { blueprintId: blueprintId }
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    VectorStoreService.prototype.getBlueprintPrimitives = function (blueprintId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.knowledgePrimitive.findMany({
                            where: { blueprintId: blueprintId }
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    VectorStoreService.prototype.getBlueprintNotes = function (blueprintId) {
        return __awaiter(this, void 0, void 0, function () {
            var sections, sectionIds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.blueprintSection.findMany({
                            where: { blueprintId: blueprintId },
                            select: { id: true }
                        })];
                    case 1:
                        sections = _a.sent();
                        sectionIds = sections.map(function (s) { return s.id; });
                        return [4 /*yield*/, prisma.noteSection.findMany({
                                where: {
                                    blueprintSectionId: { in: sectionIds }
                                }
                            })];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    VectorStoreService.prototype.searchBlueprintSections = function (query, filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.blueprintSection.findMany({
                            where: __assign(__assign({ OR: [
                                    { title: { contains: query, mode: 'insensitive' } },
                                    { description: { contains: query, mode: 'insensitive' } }
                                ] }, ((filters === null || filters === void 0 ? void 0 : filters.sectionId) && { id: filters.sectionId })), ((filters === null || filters === void 0 ? void 0 : filters.blueprintId) && { blueprintId: filters.blueprintId })),
                            take: 10
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    VectorStoreService.prototype.searchKnowledgePrimitives = function (query, filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.knowledgePrimitive.findMany({
                            where: __assign(__assign({ OR: [
                                    { title: { contains: query, mode: 'insensitive' } },
                                    { description: { contains: query, mode: 'insensitive' } }
                                ] }, ((filters === null || filters === void 0 ? void 0 : filters.blueprintId) && { blueprintId: filters.blueprintId })), ((filters === null || filters === void 0 ? void 0 : filters.sectionId) && { blueprintSectionId: filters.sectionId })),
                            take: 10
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    VectorStoreService.prototype.searchNotes = function (query, filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.noteSection.findMany({
                            where: __assign({ OR: [
                                    { title: { contains: query, mode: 'insensitive' } },
                                    { content: { contains: query, mode: 'insensitive' } }
                                ] }, ((filters === null || filters === void 0 ? void 0 : filters.sectionId) && { blueprintSectionId: filters.sectionId })),
                            take: 10
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return VectorStoreService;
}());
exports.VectorStoreService = VectorStoreService;
exports.default = VectorStoreService;
