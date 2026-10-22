import { DataManagerService } from './data-manager.service';
import { JwtService } from '@nestjs/jwt';
export declare class DataManagerController {
    private readonly dataManagerService;
    private readonly jwtService;
    constructor(dataManagerService: DataManagerService, jwtService: JwtService);
    private enforceDataManagerRole;
    getOverview(auth?: string): Promise<{
        kpis: {
            registeredDatasets: number;
            validatedDatasets: number;
            qualityIssues: number;
            criticalIssues: number;
            processingJobsActive: number;
            processingJobsCompleted: number;
            avgQualityScore: number;
        };
        categories: {
            id: string;
            title: string;
            subtitle: string;
            datasetsCount: number;
            formatBreakdown: string;
            latestSeason: string;
            status: string;
        }[];
        coverageSummary: {
            yearsRepresented: string;
            seasonsRepresented: string;
            cropsRepresented: string;
            districtsRepresented: string;
            seasons: any;
        };
        recentIssues: any;
        recentJobs: any;
        moduleReadiness: {
            module: string;
            route: string;
            readinessPct: number;
            recordsCount: number;
            sourceDataset: string;
            coverageStatus: string;
            validationStatus: string;
            color: string;
        }[];
    }>;
    getDatasets(domain?: string, status?: string, season?: string, format?: string, auth?: string): Promise<any>;
    registerDataset(body: any, auth?: string): Promise<{
        success: boolean;
        message: string;
        dataset: any;
    }>;
    publishDataset(id: string, notes?: string, auth?: string): Promise<{
        success: boolean;
        message: string;
        dataset: any;
    }>;
    getValidationIssues(status?: string, severity?: string, issueType?: string, auth?: string): Promise<{
        summary: any;
        issues: any;
    }>;
    runValidationPipeline(auth?: string): Promise<{
        success: boolean;
        timestamp: string;
        overallPassRate: number;
        rulesChecked: {
            code: string;
            name: string;
            status: string;
            scanned: number;
            errors: number;
        }[];
        message: string;
    }>;
    resolveIssue(id: string, notes: string, auth?: string): Promise<{
        success: boolean;
        message: string;
        issue: any;
    }>;
    getProcessingJobs(auth?: string): Promise<any>;
    runProcessingJob(body: any, auth?: string): Promise<{
        success: boolean;
        message: string;
        job: any;
    }>;
    getSeasonsCoverage(auth?: string): Promise<{
        totalDistricts: any;
        coverageRatePct: number;
        seasonsAvailable: any;
        districtMatrix: any;
    }>;
    getVersions(auth?: string): Promise<any>;
    getAuditLogs(limit?: string, auth?: string): Promise<any>;
}
