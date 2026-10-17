"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostHarvestModule = void 0;
const common_1 = require("@nestjs/common");
const post_harvest_service_1 = require("./post-harvest.service");
const post_harvest_controller_1 = require("./post-harvest.controller");
let PostHarvestModule = class PostHarvestModule {
};
exports.PostHarvestModule = PostHarvestModule;
exports.PostHarvestModule = PostHarvestModule = __decorate([
    (0, common_1.Module)({
        controllers: [post_harvest_controller_1.PostHarvestController],
        providers: [post_harvest_service_1.PostHarvestService],
        exports: [post_harvest_service_1.PostHarvestService],
    })
], PostHarvestModule);
//# sourceMappingURL=post-harvest.module.js.map