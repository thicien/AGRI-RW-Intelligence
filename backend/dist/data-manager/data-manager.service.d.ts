import { DataSource } from 'typeorm';
export declare class DataManagerService {
    private dataSource;
    constructor(dataSource: DataSource);
    logDataAudit(params: {
        actorEmail: string;
        action: string;
        resource: string;
        details: any;
    }): Promise<void>;
    getDataOperationsOverview(): Promise<{
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
    getDatasets(filter?: {
        domain?: string;
        status?: string;
        season?: string;
        format?: string;
    }): Promise<any>;
    registerDataset(body: {
        name: string;
        description: string;
        datasetType: string;
        year: number;
        seasonCode: string;
        fileFormat: string;
        fileSizeKb?: number;
        rowCount?: number;
        sourceOrganization?: string;
        actorEmail?: string;
    }): Promise<{
        success: boolean;
        message: string;
        dataset: any;
    }>;
    publishDataset(datasetId: string, actorEmail: string, notes?: string): Promise<{
        success: boolean;
        message: string;
        dataset: any;
    }>;
    getValidationIssues(filter?: {
        status?: string;
        severity?: string;
        issueType?: string;
    }): Promise<{
        summary: any;
        issues: any;
    }>;
    runValidationPipeline(actorEmail: string): Promise<{
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
    resolveValidationIssue(issueId: string, resolutionNotes: string, actorEmail: string): Promise<{
        success: boolean;
        message: string;
        issue: any;
    }>;
    getProcessingJobs(): Promise<any>;
    runProcessingJob(body: {
        jobType: string;
        targetModule: string;
        seasonCode?: string;
        actorEmail?: string;
    }): Promise<{
        success: boolean;
        message: string;
        job: any;
    }>;
    getSeasonsCoverageMatrix(): Promise<{
        totalDistricts: any;
        coverageRatePct: number;
        seasonsAvailable: any;
        districtMatrix: any;
    }>;
    getDatasetVersions(): Promise<any>;
    getDataAuditLogs(limit?: number): Promise<any>;
}
