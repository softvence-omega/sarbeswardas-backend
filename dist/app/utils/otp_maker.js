"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTPMaker = void 0;
const OTPMaker = () => Math.floor(100000 + Math.random() * 900000).toString();
exports.OTPMaker = OTPMaker;
