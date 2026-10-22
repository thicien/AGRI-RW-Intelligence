import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private dataSource;
    private jwtService;
    constructor(dataSource: DataSource, jwtService: JwtService);
    getRoles(): Promise<any>;
    getPermissionsMatrix(): Promise<{
        capabilities: any;
        matrix: Record<string, Record<string, string>>;
    }>;
    getUsers(): Promise<any>;
    updateUser(userId: string, updateData: {
        roleCode?: string;
        scopeLevel?: string;
        districtName?: string;
        sectorName?: string;
        status?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    checkExportPermission(params: {
        userEmail: string;
        roleCode: string;
        exportType: 'REPORT' | 'RAW_DATA';
        requestedDistrict?: string;
        datasetName: string;
    }): Promise<{
        allowed: boolean;
        auditToken: string;
        policy: any;
        scope: any;
        message: string;
    }>;
    submitObservation(body: {
        userEmail: string;
        districtName: string;
        sectorName: string;
        cropType: string;
        observationType: string;
        description: string;
        notes: string;
        gpsLat?: number;
        gpsLng?: number;
    }): Promise<{
        success: boolean;
        observationId: any;
        message: string;
    }>;
    getObservations(district?: string, sector?: string): Promise<any>;
    approveDatasetPublication(body: {
        reviewerEmail: string;
        datasetName: string;
        seasonCode: string;
        validationPassScore: number;
        notes?: string;
    }): Promise<{
        success: boolean;
        status: string;
        signedBy: string;
        timestamp: string;
        message: string;
    }>;
    getAuditLogs(limit?: number, actionFilter?: string): Promise<any>;
    private logAuditEvent;
    login(email: string, pass: string): Promise<{
        accessToken: string;
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
            roleName: any;
            scopeLevel: any;
            district: any;
            sector: any;
        };
    }>;
    registerDistrictOfficer(body: {
        fullName: string;
        email: string;
        phone?: string;
        password: string;
        districtName: string;
        notes?: string;
        registeredByEmail?: string;
    }): Promise<{
        success: boolean;
        message: string;
        user: {
            id: any;
            name: any;
            email: any;
            phone: any;
            role: string;
            roleName: any;
            scopeLevel: string;
            district: any;
            status: any;
            createdAt: any;
        };
    }>;
}
