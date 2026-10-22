"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const administrative_units_module_1 = require("./administrative-units/administrative-units.module");
const crops_module_1 = require("./crops/crops.module");
const seasons_module_1 = require("./seasons/seasons.module");
const datasets_module_1 = require("./datasets/datasets.module");
const crop_statistics_module_1 = require("./crop-statistics/crop-statistics.module");
const agricultural_data_module_1 = require("./agricultural-data/agricultural-data.module");
const environmental_module_1 = require("./environmental/environmental.module");
const irrigation_module_1 = require("./irrigation/irrigation.module");
const soil_fertility_module_1 = require("./soil-fertility/soil-fertility.module");
const post_harvest_module_1 = require("./post-harvest/post-harvest.module");
const trade_module_1 = require("./trade/trade.module");
const climate_module_1 = require("./climate/climate.module");
const satellite_module_1 = require("./satellite/satellite.module");
const infrastructure_module_1 = require("./infrastructure/infrastructure.module");
const analytics_module_1 = require("./analytics/analytics.module");
const gis_module_1 = require("./gis/gis.module");
const ai_models_module_1 = require("./ai-models/ai-models.module");
const model_runs_module_1 = require("./model-runs/model-runs.module");
const predictions_module_1 = require("./predictions/predictions.module");
const priority_zones_module_1 = require("./priority-zones/priority-zones.module");
const evidence_module_1 = require("./evidence/evidence.module");
const recommendations_module_1 = require("./recommendations/recommendations.module");
const interventions_module_1 = require("./interventions/interventions.module");
const intervention_feedback_module_1 = require("./intervention-feedback/intervention-feedback.module");
const alerts_module_1 = require("./alerts/alerts.module");
const reports_module_1 = require("./reports/reports.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const scenarios_module_1 = require("./scenarios/scenarios.module");
const ingestion_module_1 = require("./ingestion/ingestion.module");
const district_module_1 = require("./district/district.module");
const data_manager_module_1 = require("./data-manager/data-manager.module");
const admin_module_1 = require("./admin/admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5433', 10),
                username: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'Mug2thi4',
                database: process.env.DB_NAME || 'agrilens_db',
                autoLoadEntities: true,
                synchronize: true,
            }),
            auth_module_1.AuthModule, users_module_1.UsersModule, administrative_units_module_1.AdministrativeUnitsModule, crops_module_1.CropsModule, seasons_module_1.SeasonsModule, datasets_module_1.DatasetsModule, crop_statistics_module_1.CropStatisticsModule, agricultural_data_module_1.AgriculturalDataModule, environmental_module_1.EnvironmentalModule, irrigation_module_1.IrrigationModule, soil_fertility_module_1.SoilFertilityModule, post_harvest_module_1.PostHarvestModule, trade_module_1.TradeModule, climate_module_1.ClimateModule, satellite_module_1.SatelliteModule, infrastructure_module_1.InfrastructureModule, analytics_module_1.AnalyticsModule, gis_module_1.GisModule, ai_models_module_1.AiModelsModule, model_runs_module_1.ModelRunsModule, predictions_module_1.PredictionsModule, priority_zones_module_1.PriorityZonesModule, evidence_module_1.EvidenceModule, recommendations_module_1.RecommendationsModule, interventions_module_1.InterventionsModule, intervention_feedback_module_1.InterventionFeedbackModule, alerts_module_1.AlertsModule, reports_module_1.ReportsModule, dashboard_module_1.DashboardModule, scenarios_module_1.ScenariosModule, ingestion_module_1.IngestionModule, district_module_1.DistrictModule, data_manager_module_1.DataManagerModule, admin_module_1.AdminModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map