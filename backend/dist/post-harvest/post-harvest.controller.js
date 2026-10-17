"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostHarvestController = void 0;
const common_1 = require("@nestjs/common");
const post_harvest_service_1 = require("./post-harvest.service");
let PostHarvestController = class PostHarvestController {
    postHarvestService;
    constructor(postHarvestService) {
        this.postHarvestService = postHarvestService;
    }
    async getSummary(season = '2026B') {
        return this.postHarvestService.getSummary(season);
    }
    async getDistricts(season = '2026B') {
        return this.postHarvestService.getDistricts(season);
    }
    async getSeasons() {
        return this.postHarvestService.getSeasons();
    }
    async getFacilities() {
        return this.postHarvestService.getFacilities();
    }
    async getGapScreening(season = '2026B') {
        return this.postHarvestService.getGapScreening(season);
    }
    async getSiteDossier(district = 'Nyagatare', season = '2026B') {
        return this.postHarvestService.getSiteDossier(district, season);
    }
};
exports.PostHarvestController = PostHarvestController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostHarvestController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('districts'),
    __param(0, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostHarvestController.prototype, "getDistricts", null);
__decorate([
    (0, common_1.Get)('seasons'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PostHarvestController.prototype, "getSeasons", null);
__decorate([
    (0, common_1.Get)('facilities'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PostHarvestController.prototype, "getFacilities", null);
__decorate([
    (0, common_1.Get)('gap-screening'),
    __param(0, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostHarvestController.prototype, "getGapScreening", null);
__decorate([
    (0, common_1.Get)('site-dossier'),
    __param(0, (0, common_1.Query)('district')),
    __param(1, (0, common_1.Query)('season')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PostHarvestController.prototype, "getSiteDossier", null);
exports.PostHarvestController = PostHarvestController = __decorate([
    (0, common_1.Controller)('post-harvest'),
    __metadata("design:paramtypes", [post_harvest_service_1.PostHarvestService])
], PostHarvestController);
//# sourceMappingURL=post-harvest.controller.js.map