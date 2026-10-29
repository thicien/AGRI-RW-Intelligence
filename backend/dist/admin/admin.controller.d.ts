import { AdminService } from './admin.service';
import { JwtService } from '@nestjs/jwt';
export declare class AdminController {
    private readonly adminService;
    private readonly jwtService;
    constructor(adminService: AdminService, jwtService: JwtService);
    private enforceAdminRole;
    getOverview(auth?: string): Promise<{
        kpis: {
            registeredAccounts: any;
            activeAccounts: any;
            suspendedAccounts: any;
            datasetRecords: any;
            totalDataRecords: number;
            systemHealth: "HEALTHY" | "DEGRADED";
            dbLatencyMs: number;
            dbSize: any;
            activeConnections: any;
        };
        healthCheck: {
            status: "HEALTHY" | "DEGRADED";
            latencyMs: number;
            checkedAt: string;
            reasons: string[];
            components: {
                database: {
                    status: string;
                    latencyMs: number;
                    size: any;
                    connections: any;
                };
                api: {
                    status: string;
                    uptimeSeconds: number;
                    memoryMb: number;
                };
                dataIngestion: {
                    status: string;
                    activeJobs: number;
                    failedJobs: number;
                };
                securityGate: {
                    status: string;
                    violationsRecorded: number;
                };
            };
        };
        roleDistribution: any;
        recentAlerts: any;
        districtCoverage: any;
    }>;
    getSystemHealth(auth?: string): Promise<{
        status: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
        timestamp: string;
        database: {
            status: string;
            latencyMs: number;
            port: number;
            databaseName: string;
            size: any;
            version: any;
            connections: any;
            maxConnections: any;
        };
        api: {
            environment: string;
            apiPort: number;
            apiPrefix: string;
            uptimeSeconds: number;
            pid: number;
            nodeVersion: string;
            platform: NodeJS.Platform;
            arch: NodeJS.Architecture;
            memory: {
                rssMb: number;
                heapTotalMb: number;
                heapUsedMb: number;
                externalMb: number;
            };
            status: string;
        };
        storage: {
            status: string;
            databaseSize: any;
            topTables: any;
        };
        dataProcessing: {
            totalDatasetsRegistered: number;
            activeIngestionWorkers: number;
            queuedJobs: number;
            stuckJobs: number;
            failedImports: number;
            lastSuccessfulIngestion: string;
            status: string;
        };
        security: {
            status: string;
            stats: any;
        };
        recentIncidents: {
            id: string;
            severity: string;
            category: string;
            message: string;
            timestamp: string;
            status: string;
        }[];
    }>;
    getUsers(role?: string, status?: string, search?: string, auth?: string): Promise<any>;
    createUser(body: {
        fullName: string;
        email: string;
        phone?: string;
        password: string;
        roleCode: string;
        districtName?: string;
        sectorName?: string;
    }, auth?: string): Promise<{
        success: boolean;
        message: string;
        user: {
            id: any;
            fullName: any;
            email: any;
            phone: any;
            status: any;
            roleCode: any;
            roleName: any;
            district: string | null;
            createdAt: any;
        };
    }>;
    updateUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE', auth?: string): Promise<{
        success: boolean;
        message: string;
        userId: string;
        newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    }>;
    resetUserPassword(userId: string, newPassword: string, auth?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateUserRoleAndScope(userId: string, body: {
        roleCode: string;
        districtName?: string;
        sectorName?: string;
    }, auth?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getRolesAndPermissions(auth?: string): Promise<{
        roles: any;
        permissions: any;
        matrix: Record<string, Record<string, string>>;
    }>;
    getGeographyConfig(auth?: string): Promise<{
        country: string;
        provincesCount: any;
        districtsCount: any;
        sectorsCount: any;
        provinces: any;
        districts: any;
    }>;
    getDatasetsAdmin(auth?: string): Promise<{
        datasets: any;
        totalDatasets: any;
        governanceSummary: {
            cropStatisticsRecords: number;
            soilFertilityRecords: number;
            irrigationRecords: number;
            officialSource: string;
            governanceRule: string;
        };
    }>;
    getSystemConfiguration(auth?: string): Promise<{
        config: {
            sessionTimeoutMinutes: number;
            mfaRequiredForAdmins: boolean;
            rateLimitPerMinute: number;
            passwordPolicy: {
                minLength: number;
                requireUppercase: boolean;
                requireNumbers: boolean;
                requireSpecialChars: boolean;
            };
            maintenanceMode: boolean;
            auditRetentionDays: number;
            maxFailedLoginAttempts: number;
            lockoutDurationMinutes: number;
        };
        protectedAttributes: string[];
        notice: string;
    }>;
    updateSystemConfiguration(body: any, auth?: string): Promise<{
        success: boolean;
        message: string;
        config: {
            sessionTimeoutMinutes: number;
            mfaRequiredForAdmins: boolean;
            rateLimitPerMinute: number;
            passwordPolicy: {
                minLength: number;
                requireUppercase: boolean;
                requireNumbers: boolean;
                requireSpecialChars: boolean;
            };
            maintenanceMode: boolean;
            auditRetentionDays: number;
            maxFailedLoginAttempts: number;
            lockoutDurationMinutes: number;
        };
    }>;
    getAuditLogs(limit?: number, action?: string, actor?: string, auth?: string): Promise<any>;
    getSecurityMetrics(auth?: string): Promise<{
        metrics: any;
        recentViolations: any;
        policyEnforcements: {
            name: string;
            status: string;
            policy: string;
        }[];
    }>;
    getBackupStatus(auth?: string): Promise<{
        status: string;
        lastBackupTimestamp: string;
        backupType: string;
        databaseFootprint: any;
        retentionPolicy: string;
        recoveryProcedures: {
            step: number;
            title: string;
            instruction: string;
        }[];
        recentSnapshots: {
            id: string;
            size: any;
            status: string;
            checksum: string;
        }[];
    }>;
    getNotifications(auth?: string): Promise<{
        id: string;
        title: string;
        message: string;
        severity: string;
        timestamp: string;
        read: boolean;
    }[]>;
    getPlatformReportData(auth?: string): Promise<{
        generatedAt: string;
        platform: string;
        generatedBy: string;
        kpis: {
            registeredAccounts: any;
            activeAccounts: any;
            suspendedAccounts: any;
            datasetRecords: any;
            totalDataRecords: number;
            systemHealth: "HEALTHY" | "DEGRADED";
            dbLatencyMs: number;
            dbSize: any;
            activeConnections: any;
        };
        totalUsers: any;
        userList: any;
        auditSummary: any;
    }>;
    modifyAgriculturalStatsDirectly(): void;
    publishDatasetWithoutApproval(): void;
    deleteAuditRecord(): void;
}
