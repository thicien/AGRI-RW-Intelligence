import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdministrativeUnitsModule } from './administrative-units/administrative-units.module';
import { CropsModule } from './crops/crops.module';
import { SeasonsModule } from './seasons/seasons.module';
import { DatasetsModule } from './datasets/datasets.module';
import { CropStatisticsModule } from './crop-statistics/crop-statistics.module';
import { AgriculturalDataModule } from './agricultural-data/agricultural-data.module';
import { EnvironmentalModule } from './environmental/environmental.module';
import { IrrigationModule } from './irrigation/irrigation.module';
import { SoilFertilityModule } from './soil-fertility/soil-fertility.module';
import { PostHarvestModule } from './post-harvest/post-harvest.module';
import { TradeModule } from './trade/trade.module';
import { ClimateModule } from './climate/climate.module';
import { SatelliteModule } from './satellite/satellite.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { GisModule } from './gis/gis.module';
import { AiModelsModule } from './ai-models/ai-models.module';
import { ModelRunsModule } from './model-runs/model-runs.module';
import { PredictionsModule } from './predictions/predictions.module';
import { PriorityZonesModule } from './priority-zones/priority-zones.module';
import { EvidenceModule } from './evidence/evidence.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { InterventionsModule } from './interventions/interventions.module';
import { InterventionFeedbackModule } from './intervention-feedback/intervention-feedback.module';
import { AlertsModule } from './alerts/alerts.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ScenariosModule } from './scenarios/scenarios.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { DistrictModule } from './district/district.module';
import { DataManagerModule } from './data-manager/data-manager.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'Mug2thi4',
      database: process.env.DB_NAME || 'agrilens_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule, UsersModule, AdministrativeUnitsModule, CropsModule, SeasonsModule, DatasetsModule, CropStatisticsModule, AgriculturalDataModule, EnvironmentalModule, IrrigationModule, SoilFertilityModule, PostHarvestModule, TradeModule, ClimateModule, SatelliteModule, InfrastructureModule, AnalyticsModule, GisModule, AiModelsModule, ModelRunsModule, PredictionsModule, PriorityZonesModule, EvidenceModule, RecommendationsModule, InterventionsModule, InterventionFeedbackModule, AlertsModule, ReportsModule, DashboardModule, ScenariosModule, IngestionModule, DistrictModule, DataManagerModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
