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

const isRemoteHost = (host?: string) => {
  if (!host) return false;
  return host !== 'localhost' && host !== '127.0.0.1';
};

const shouldUseSsl = () => {
  if (process.env.DB_SSL === 'true' || process.env.DB_SSL === 'require') return true;
  if (process.env.DB_SSL === 'false') return false;
  if (process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('sslmode=require') || !process.env.DATABASE_URL.includes('localhost'))) return true;
  if (process.env.NODE_ENV === 'production') return true;
  if (isRemoteHost(process.env.DB_HOST)) return true;
  return false;
};

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'postgres',
          }),
      autoLoadEntities: true,
      synchronize: false,
      ssl: shouldUseSsl()
        ? { rejectUnauthorized: false }
        : false,
      extra: {
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
        ...(process.env.DB_PORT === '6543' || process.env.DATABASE_URL?.includes(':6543') ? { prepare: false } : {}),
      },
      retryAttempts: 5,
      retryDelay: 3000,
    }),
    AuthModule, UsersModule, AdministrativeUnitsModule, CropsModule, SeasonsModule, DatasetsModule, CropStatisticsModule, AgriculturalDataModule, EnvironmentalModule, IrrigationModule, SoilFertilityModule, PostHarvestModule, TradeModule, ClimateModule, SatelliteModule, InfrastructureModule, AnalyticsModule, GisModule, AiModelsModule, ModelRunsModule, PredictionsModule, PriorityZonesModule, EvidenceModule, RecommendationsModule, InterventionsModule, InterventionFeedbackModule, AlertsModule, ReportsModule, DashboardModule, ScenariosModule, IngestionModule, DistrictModule, DataManagerModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
