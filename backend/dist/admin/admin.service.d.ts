import { DataSource } from 'typeorm';
export declare class AdminService {
    private dataSource;
    private readonly logger;
    private systemConfig;
    constructor(dataSource: DataSource);
    getOverview(): Promise<{
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
    getSystemHealth(): Promise<{
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
    getUsers(filters?: {
        role?: string;
        status?: string;
        search?: string;
    }): Promise<any>;
    createUser(body: {
        fullName: string;
        email: string;
        phone?: string;
        password: string;
        roleCode: string;
        districtName?: string;
        sectorName?: string;
    }, actorEmail?: string): Promise<{
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
    updateUserStatus(userId: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE', actorEmail?: string): Promise<{
        success: boolean;
        message: string;
        userId: string;
        newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    }>;
    resetUserPassword(userId: string, newPassword: string, actorEmail?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateUserRoleAndScope(userId: string, body: {
        roleCode: string;
        districtName?: string;
        sectorName?: string;
    }, actorEmail?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getRolesAndPermissions(): Promise<{
        roles: any;
        permissions: any;
        matrix: Record<string, Record<string, string>>;
    }>;
    getGeographyConfig(): Promise<{
        country: string;
        provincesCount: any;
        districtsCount: any;
        sectorsCount: any;
        provinces: any;
        districts: any;
    }>;
    getDatasetsAdmin(): Promise<{
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
    getSystemConfiguration(): Promise<{
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
    updateSystemConfiguration(newConfig: Partial<typeof this.systemConfig>, actorEmail?: string): Promise<{
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
    getAuditLogs(filters?: {
        limit?: number;
        action?: string;
        actor?: string;
    }): Promise<any>;
    getSecurityMetrics(): Promise<{
        metrics: any;
        recentViolations: any;
        policyEnforcements: {
            name: string;
            status: string;
            policy: string;
        }[];
    }>;
    getBackupStatus(): Promise<{
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
    getNotifications(): Promise<{
        id: string;
        title: string;
        message: string;
        severity: string;
        timestamp: string;
        read: boolean;
    }[]>;
    getPlatformReportData(): Promise<{
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
    denyAgriculturalStatsModification(): void;
    denyDirectDatasetPublication(): void;
    denyAuditAlteration(): void;
    private logAuditEvent;
}
