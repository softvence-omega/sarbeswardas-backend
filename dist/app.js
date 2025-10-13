"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const express_useragent_1 = __importDefault(require("express-useragent"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const not_found_route_1 = __importDefault(require("./app/middlewares/not_found_route"));
const global_error_handler_1 = require("./app/middlewares/global_error_handler");
exports.app = (0, express_1.default)();
// parsers
exports.app.use(express_useragent_1.default.express());
exports.app.use(express_1.default.json());
exports.app.use((0, cors_1.default)());
exports.app.use("/api/v1", routes_1.default);
exports.app.get("/", (req, res) => {
    res.send("Hello World!");
});
exports.app.use(global_error_handler_1.globalErrorHandler);
exports.app.use(not_found_route_1.default);
