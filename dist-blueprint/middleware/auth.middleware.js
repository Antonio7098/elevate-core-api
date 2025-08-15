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
exports.protect = void 0;
var jsonwebtoken_1 = require("jsonwebtoken");
var protect = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, testUserIdHeader, cascadeTestHeader, token, decoded;
    return __generator(this, function (_a) {
        console.log('🔑 [Auth] PROTECT MIDDLEWARE: All Request Headers:', JSON.stringify(req.headers, null, 2)); // Log all headers
        console.log("\uD83D\uDD12 [Auth] PROTECT MIDDLEWARE: Protecting route: ".concat(req.method, " ").concat(req.originalUrl));
        authHeader = req.headers['authorization'];
        testUserIdHeader = req.headers['x-test-user-id'];
        console.log("\uD83D\uDD11 [Auth] PROTECT MIDDLEWARE: Authorization header value: ".concat(authHeader));
        console.log("\uD83D\uDD11 [Auth] PROTECT MIDDLEWARE: Type of authHeader: ".concat(typeof authHeader));
        if (typeof authHeader === 'string') {
            console.log("\uD83D\uDD11 [Auth] PROTECT MIDDLEWARE: Length of authHeader: ".concat(authHeader.length));
        }
        cascadeTestHeader = req.headers['x-cascade-test'];
        console.log("\uD83E\uDDEA [Auth] PROTECT MIDDLEWARE: X-Cascade-Test header: ".concat(cascadeTestHeader || 'None'));
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
            // console.log(`🔑 [Auth] Token extracted: ${token.substring(0, 10)}...`);
            // console.log(`🔑 [Auth] JWT_SECRET available: ${!!process.env.JWT_SECRET}`);
            // Special handling for test token in development environment
            if (process.env.NODE_ENV !== 'production' && token === 'test123') {
                // Allow test user ID override via header
                if (testUserIdHeader && typeof testUserIdHeader === 'string' && !isNaN(Number(testUserIdHeader))) {
                    req.user = { userId: Number(testUserIdHeader) };
                }
                else {
                    req.user = { userId: 1 };
                }
                next();
                return [2 /*return*/];
            }
            try {
                decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                // console.log(`✅ [Auth] Token verified successfully for userId: ${decoded.userId}`);
                // console.log(`User ${decoded.userId} authenticated successfully for ${req.method} ${req.path}`);
                // console.log(`PROTECT_MIDDLEWARE_END: Passing to next handler. Path: ${req.path}, Body: ${JSON.stringify(req.body, null, 2)}`);
                req.user = { userId: decoded.userId };
                // console.log(`✅ [Auth] Token expiration: ${new Date(decoded.exp * 1000).toISOString()}`);
                next();
            }
            catch (error) {
                if (process.env.NODE_ENV !== 'test') {
                    console.error("\u274C [Auth] Token verification failed: ".concat(error instanceof Error ? error.message : 'Unknown error'));
                }
                res.status(401).json({ message: 'Token is not valid' });
                return [2 /*return*/]; // Ensure no further execution
            }
        }
        else {
            if (process.env.NODE_ENV !== 'test') {
                console.error("\u274C [Auth] No valid authorization header found");
            }
            res.status(401).json({ message: 'No token, authorization denied' });
            return [2 /*return*/]; // Ensure no further execution
        }
        return [2 /*return*/];
    });
}); };
exports.protect = protect;
