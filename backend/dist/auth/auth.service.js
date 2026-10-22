"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const argon2 = __importStar(require("argon2"));
let AuthService = class AuthService {
    dataSource;
    jwtService;
    constructor(dataSource, jwtService) {
        this.dataSource = dataSource;
        this.jwtService = jwtService;
    }
    async getRoles() {
        const rolesQuery = `
      SELECT 
        r.id,
        r.code,
        r.name,
        r.description,
        r.scope_type,
        COUNT(DISTINCT ur.user_id) AS active_users_count
      FROM agrilens.roles r
      LEFT JOIN agrilens.user_roles ur ON r.id = ur.role_id
      WHERE r.code IS NOT NULL
      GROUP BY r.id, r.code, r.name, r.description, r.scope_type
      ORDER BY 
        CASE r.code
          WHEN 'PLATFORM_ADMIN' THEN 1
          WHEN 'DATA_MANAGER' THEN 2
          WHEN 'NATIONAL_PLANNER' THEN 3
          WHEN 'DISTRICT_OFFICER' THEN 4
          WHEN 'SECTOR_OFFICER' THEN 5
          WHEN 'RESEARCHER_ANALYST' THEN 6
          WHEN 'COOPERATIVE_FARMER' THEN 7
          WHEN 'PARTNER_VIEWER' THEN 8
          ELSE 9
        END;
    `;
        const roles = await this.dataSource.query(rolesQuery);
        const roleDetails = {
            PLATFORM_ADMIN: {
                geographicScope: 'System-wide (Rwanda All)',
                allowedCapabilities: [
                    'Full account lifecycle & role assignment',
                    'System configuration & parameter tuning',
                    'Security audit trail & forensic log inspection',
                    'Two-man rule publication authorization override'
                ],
                restrictions: [
                    'Should separate routine administration from statistical data modification',
                    'Direct statistical edits must pass through controlled correction workflow'
                ]
            },
            DATA_MANAGER: {
                geographicScope: 'Rwanda-wide / Assigned Data Domains',
                allowedCapabilities: [
                    'Upload raw seasonal datasets & GIS shapefiles',
                    'Execute automated schema & outlier validation checks',
                    'Correct parsing inconsistencies & staging data',
                    'Approve dataset publication (if designated as reviewer)'
                ],
                restrictions: [
                    'Cannot manage user roles or platform security configurations',
                    'High-impact official reporting requires second authorized sign-off'
                ]
            },
            NATIONAL_PLANNER: {
                geographicScope: 'Rwanda-wide (National & 30 Districts)',
                allowedCapabilities: [
                    'View nationwide cross-district comparative indicators',
                    'Inspect all 5 seasonal analytics & opportunity rankings',
                    'Export aggregate strategic briefs and policy dashboards',
                    'Filter historical seasons from 2014 through 2026A'
                ],
                restrictions: [
                    'No direct access to raw unaggregated survey microdata by default',
                    'Cannot edit or alter official published statistical records'
                ]
            },
            DISTRICT_OFFICER: {
                geographicScope: 'Assigned District and Subordinate Sectors',
                allowedCapabilities: [
                    'Review localized district yields and sector league rankings',
                    'Analyze local irrigation, soil and post-harvest dossiers',
                    'Export district-scoped briefs and intervention priority plans',
                    'Review submitted sector field observations within district'
                ],
                restrictions: [
                    'Strictly barred from inspecting restricted operational data of other districts',
                    'Cannot manage platform users or raw dataset ingestions'
                ]
            },
            SECTOR_OFFICER: {
                geographicScope: 'Assigned Sector and Subordinate Cells',
                allowedCapabilities: [
                    'Access local sector indicators and crop performance benchmarks',
                    'Submit ground-truth field observations & verification records',
                    'Track local facility utilization and farmer alerts'
                ],
                restrictions: [
                    'Cannot view administrative functions or unrestricted data outside assigned sector',
                    'Cannot alter official published district or national statistics'
                ]
            },
            RESEARCHER_ANALYST: {
                geographicScope: 'Approved National or Regional Dataset Scope',
                allowedCapabilities: [
                    'Conduct multi-season comparative analysis (2014-2026A)',
                    'Filter crop and seasonal opportunity matrices',
                    'Export permitted research tables with automated source citations',
                    'Inspect approved research staging files'
                ],
                restrictions: [
                    'Access to unreleased draft datasets requires specific committee sign-off',
                    'Cannot modify published official government records'
                ]
            },
            COOPERATIVE_FARMER: {
                geographicScope: 'Local Cooperative Catchment & Public Data',
                allowedCapabilities: [
                    'View seasonal crop advisories, rainfall forecasts & planting windows',
                    'Locate nearby verified warehouses, dryers & cold storage facilities',
                    'Check commodity market prices & aggregation demand',
                    'Submit cooperative feedback or storage assistance requests'
                ],
                restrictions: [
                    'Cannot modify official statistics or access internal policy dossiers',
                    'Export restricted to farmer advisory summaries only'
                ]
            },
            PARTNER_VIEWER: {
                geographicScope: 'Published Public Information Only',
                allowedCapabilities: [
                    'Inspect published national overview dashboards',
                    'Explore approved interactive GIS agricultural maps',
                    'Download published public reports and executive summaries'
                ],
                restrictions: [
                    'Cannot upload datasets or submit field modifications',
                    'Cannot access confidential microdata, user logs or administrative tools'
                ]
            }
        };
        return roles.map((r) => ({
            ...r,
            details: roleDetails[r.code] || {
                geographicScope: 'Configured Scope',
                allowedCapabilities: ['View authorized dashboards'],
                restrictions: ['Standard platform access rules apply']
            }
        }));
    }
    async getPermissionsMatrix() {
        const capsQuery = `
      SELECT id, code, name, category, description
      FROM agrilens.permissions
      ORDER BY 
        CASE category
          WHEN 'DASHBOARDS' THEN 1
          WHEN 'DATASETS' THEN 2
          WHEN 'ANALYTICS' THEN 3
          WHEN 'INTELLIGENCE' THEN 4
          WHEN 'REPORTING' THEN 5
          WHEN 'OPERATIONS' THEN 6
          WHEN 'ADMIN' THEN 7
          ELSE 8
        END, code;
    `;
        const capabilities = await this.dataSource.query(capsQuery);
        const matrixQuery = `
      SELECT 
        p.code AS permission_code,
        r.code AS role_code,
        rp.policy_value
      FROM agrilens.role_permissions rp
      JOIN agrilens.permissions p ON rp.permission_id = p.id
      JOIN agrilens.roles r ON rp.role_id = r.id;
    `;
        const matrixRows = await this.dataSource.query(matrixQuery);
        const matrix = {};
        for (const row of matrixRows) {
            if (!matrix[row.permission_code]) {
                matrix[row.permission_code] = {};
            }
            matrix[row.permission_code][row.role_code] = row.policy_value;
        }
        return {
            capabilities,
            matrix
        };
    }
    async getUsers() {
        const usersQuery = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.status,
        u.created_at,
        r.id AS role_id,
        r.code AS role_code,
        r.name AS role_name,
        r.scope_type,
        ul.scope_level,
        ul.district_name,
        ul.sector_name,
        au.name AS admin_unit_name
      FROM agrilens.users u
      LEFT JOIN agrilens.user_roles ur ON u.id = ur.user_id
      LEFT JOIN agrilens.roles r ON ur.role_id = r.id
      LEFT JOIN agrilens.user_locations ul ON u.id = ul.user_id
      LEFT JOIN agrilens.administrative_units au ON ul.admin_unit_id = au.id
      ORDER BY u.created_at ASC;
    `;
        return await this.dataSource.query(usersQuery);
    }
    async updateUser(userId, updateData) {
        if (updateData.status) {
            await this.dataSource.query(`UPDATE agrilens.users SET status = $1, updated_at = NOW() WHERE id = $2`, [updateData.status, userId]);
        }
        if (updateData.roleCode) {
            const role = await this.dataSource.query(`SELECT id FROM agrilens.roles WHERE code = $1 LIMIT 1`, [updateData.roleCode]);
            if (role.length > 0) {
                await this.dataSource.query(`DELETE FROM agrilens.user_roles WHERE user_id = $1`, [userId]);
                await this.dataSource.query(`INSERT INTO agrilens.user_roles (user_id, role_id) VALUES ($1, $2)`, [userId, role[0].id]);
            }
        }
        if (updateData.scopeLevel) {
            await this.dataSource.query(`DELETE FROM agrilens.user_locations WHERE user_id = $1`, [userId]);
            let unitId = null;
            if (updateData.districtName) {
                const dUnit = await this.dataSource.query(`SELECT id FROM agrilens.administrative_units WHERE name ILIKE $1 LIMIT 1`, [updateData.districtName]);
                if (dUnit.length > 0)
                    unitId = dUnit[0].id;
            }
            await this.dataSource.query(`INSERT INTO agrilens.user_locations (user_id, admin_unit_id, scope_level, district_name, sector_name)
         VALUES ($1, $2, $3, $4, $5)`, [userId, unitId, updateData.scopeLevel, updateData.districtName || null, updateData.sectorName || null]);
        }
        await this.logAuditEvent({
            actorEmail: 'admin@agrilens.gov.rw',
            actorRole: 'PLATFORM_ADMIN',
            action: 'USER_SCOPE_ASSIGNMENT',
            resource: 'USER_MANAGEMENT',
            details: { userId, updates: updateData }
        });
        return { success: true, message: 'User role and geographic authorization updated successfully.' };
    }
    async checkExportPermission(params) {
        const { userEmail, roleCode, exportType, requestedDistrict, datasetName } = params;
        const locRes = await this.dataSource.query(`
      SELECT ul.scope_level, ul.district_name, ul.sector_name, r.code AS role_code
      FROM agrilens.users u
      JOIN agrilens.user_roles ur ON u.id = ur.user_id
      JOIN agrilens.roles r ON ur.role_id = r.id
      LEFT JOIN agrilens.user_locations ul ON u.id = ul.user_id
      WHERE u.email = $1 OR r.code = $2
      LIMIT 1;
    `, [userEmail, roleCode]);
        const userProfile = locRes[0] || { role_code: roleCode, scope_level: 'NATIONAL' };
        const capCode = exportType === 'RAW_DATA' ? 'EXPORT_RAW_DATA' : 'EXPORT_REPORTS';
        const permQuery = `
      SELECT rp.policy_value
      FROM agrilens.role_permissions rp
      JOIN agrilens.permissions p ON rp.permission_id = p.id
      JOIN agrilens.roles r ON rp.role_id = r.id
      WHERE p.code = $1 AND r.code = $2;
    `;
        const permRes = await this.dataSource.query(permQuery, [capCode, userProfile.role_code]);
        const policy = permRes[0]?.policy_value || 'NO';
        if (policy === 'NO') {
            await this.logAuditEvent({
                actorEmail: userEmail,
                actorRole: userProfile.role_code,
                action: 'EXPORT_ATTEMPT_DENIED',
                resource: datasetName,
                details: { reason: `Role ${userProfile.role_code} has NO permission for ${capCode}`, requestedDistrict }
            });
            throw new common_1.ForbiddenException(`Access Denied: Your role (${userProfile.role_code}) is not permitted to perform ${exportType} export.`);
        }
        if (policy === 'SCOPED') {
            if (requestedDistrict && userProfile.district_name && requestedDistrict.toLowerCase() !== userProfile.district_name.toLowerCase()) {
                await this.logAuditEvent({
                    actorEmail: userEmail,
                    actorRole: userProfile.role_code,
                    action: 'GEOGRAPHIC_BOUNDARY_VIOLATION',
                    resource: datasetName,
                    details: { requestedDistrict, assignedDistrict: userProfile.district_name }
                });
                throw new common_1.ForbiddenException(`Geographic Access Restriction: You are authorized for ${userProfile.district_name} District only. Access to ${requestedDistrict} is prohibited.`);
            }
        }
        const token = `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await this.logAuditEvent({
            actorEmail: userEmail,
            actorRole: userProfile.role_code,
            action: 'EXPORT_AUTHORIZED',
            resource: datasetName,
            details: { exportType, scope: userProfile.district_name || 'NATIONAL', auditToken: token }
        });
        return {
            allowed: true,
            auditToken: token,
            policy,
            scope: userProfile.district_name || 'RWANDA_WIDE',
            message: 'Export authorization verified by backend security guard.'
        };
    }
    async submitObservation(body) {
        const userRes = await this.dataSource.query(`SELECT id FROM agrilens.users WHERE email = $1 LIMIT 1`, [body.userEmail]);
        const userId = userRes[0]?.id || null;
        const query = `
      INSERT INTO agrilens.field_observations 
        (user_id, district_name, sector_name, crop_type, observation_type, description, notes, status, gps_lat, gps_lng)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING_VALIDATION', $8, $9)
      RETURNING id, created_at;
    `;
        const res = await this.dataSource.query(query, [
            userId,
            body.districtName,
            body.sectorName,
            body.cropType,
            body.observationType,
            body.description,
            body.notes,
            body.gpsLat || -1.482,
            body.gpsLng || 30.345
        ]);
        await this.logAuditEvent({
            actorEmail: body.userEmail,
            actorRole: 'SECTOR_OFFICER',
            action: 'FIELD_OBSERVATION_SUBMITTED',
            resource: `${body.districtName}/${body.sectorName}`,
            details: { observationId: res[0].id, crop: body.cropType, type: body.observationType }
        });
        return {
            success: true,
            observationId: res[0].id,
            message: 'Field observation submitted successfully and queued for verification.'
        };
    }
    async getObservations(district, sector) {
        let query = `
      SELECT 
        fo.id,
        fo.district_name,
        fo.sector_name,
        fo.crop_type,
        fo.observation_type,
        fo.description,
        fo.notes,
        fo.status,
        fo.gps_lat,
        fo.gps_lng,
        fo.created_at,
        u.full_name AS observer_name,
        u.email AS observer_email
      FROM agrilens.field_observations fo
      LEFT JOIN agrilens.users u ON fo.user_id = u.id
      WHERE 1=1
    `;
        const params = [];
        if (district) {
            params.push(district);
            query += ` AND fo.district_name ILIKE $${params.length}`;
        }
        if (sector) {
            params.push(sector);
            query += ` AND fo.sector_name ILIKE $${params.length}`;
        }
        query += ` ORDER BY fo.created_at DESC LIMIT 50;`;
        return await this.dataSource.query(query, params);
    }
    async approveDatasetPublication(body) {
        const reviewerRes = await this.dataSource.query(`
      SELECT r.code AS role_code
      FROM agrilens.users u
      JOIN agrilens.user_roles ur ON u.id = ur.user_id
      JOIN agrilens.roles r ON ur.role_id = r.id
      WHERE u.email = $1 LIMIT 1;
    `, [body.reviewerEmail]);
        const role = reviewerRes[0]?.role_code;
        if (role !== 'DATA_MANAGER' && role !== 'PLATFORM_ADMIN') {
            throw new common_1.ForbiddenException('Only authorized Data Managers or Platform Administrators may sign off on dataset publication.');
        }
        await this.logAuditEvent({
            actorEmail: body.reviewerEmail,
            actorRole: role,
            action: 'DATASET_PUBLICATION_APPROVED',
            resource: `${body.datasetName} (${body.seasonCode})`,
            details: {
                score: body.validationPassScore,
                notes: body.notes || 'Dataset verified against NISR statistical benchmarks and approved for platform-wide publication.'
            }
        });
        return {
            success: true,
            status: 'PUBLISHED',
            signedBy: body.reviewerEmail,
            timestamp: new Date().toISOString(),
            message: `Dataset ${body.datasetName} (${body.seasonCode}) officially published to AgriLens repository.`
        };
    }
    async getAuditLogs(limit = 50, actionFilter) {
        let query = `
      SELECT id, actor_email, actor_role, action, resource, details, ip_address, created_at
      FROM agrilens.audit_logs
      WHERE 1=1
    `;
        const params = [];
        if (actionFilter) {
            params.push(`%${actionFilter}%`);
            query += ` AND action ILIKE $${params.length}`;
        }
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1};`;
        params.push(limit);
        return await this.dataSource.query(query, params);
    }
    async logAuditEvent(event) {
        try {
            await this.dataSource.query(`
        INSERT INTO agrilens.audit_logs (actor_email, actor_role, action, resource, details)
        VALUES ($1, $2, $3, $4, $5);
      `, [event.actorEmail, event.actorRole, event.action, event.resource, JSON.stringify(event.details)]);
        }
        catch (e) {
            console.error('Audit log write error:', e.message);
        }
    }
    async login(email, pass) {
        const userRes = await this.dataSource.query(`
      SELECT 
        u.id, u.full_name, u.email, u.password_hash, u.status,
        r.code AS role_code, r.name AS role_name, r.scope_type,
        ul.scope_level, ul.district_name, ul.sector_name
      FROM agrilens.users u
      LEFT JOIN agrilens.user_roles ur ON u.id = ur.user_id
      LEFT JOIN agrilens.roles r ON ur.role_id = r.id
      LEFT JOIN agrilens.user_locations ul ON u.id = ul.user_id
      WHERE u.email = $1 LIMIT 1;
    `, [email]);
        if (userRes.length === 0) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        const user = userRes[0];
        if (user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('Account is inactive. Contact system administrator.');
        }
        const validPassword = await argon2.verify(user.password_hash, pass);
        if (!validPassword) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.full_name,
            role: user.role_code,
            scopeLevel: user.scope_level || 'NATIONAL',
            district: user.district_name,
            sector: user.sector_name
        };
        const token = this.jwtService.sign(payload);
        await this.logAuditEvent({
            actorEmail: user.email,
            actorRole: user.role_code,
            action: 'USER_LOGIN_SUCCESS',
            resource: 'AUTH_GATEWAY',
            details: { scopeLevel: user.scope_level, district: user.district_name }
        });
        return {
            accessToken: token,
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role_code,
                roleName: user.role_name,
                scopeLevel: user.scope_level || 'NATIONAL',
                district: user.district_name,
                sector: user.sector_name
            }
        };
    }
    async registerDistrictOfficer(body) {
        if (!body.fullName || !body.email || !body.password || !body.districtName) {
            throw new common_1.BadRequestException('Full name, email, password, and assigned district are required.');
        }
        const cleanEmail = body.email.trim().toLowerCase();
        const existing = await this.dataSource.query(`SELECT id FROM agrilens.users WHERE email = $1 LIMIT 1;`, [cleanEmail]);
        if (existing.length > 0) {
            throw new common_1.BadRequestException(`An account with email '${cleanEmail}' is already registered.`);
        }
        const hashedPassword = await argon2.hash(body.password);
        const roleRes = await this.dataSource.query(`SELECT id, name FROM agrilens.roles WHERE code = 'DISTRICT_OFFICER' LIMIT 1;`);
        if (roleRes.length === 0) {
            throw new common_1.NotFoundException('DISTRICT_OFFICER role not found in system.');
        }
        const roleId = roleRes[0].id;
        const roleName = roleRes[0].name;
        const unitRes = await this.dataSource.query(`SELECT id, name FROM agrilens.administrative_units WHERE name ILIKE $1 AND unit_type = 'DISTRICT' LIMIT 1;`, [body.districtName.trim()]);
        const adminUnitId = unitRes.length > 0 ? unitRes[0].id : null;
        const resolvedDistrict = unitRes.length > 0 ? unitRes[0].name : body.districtName.trim();
        const insertRes = await this.dataSource.query(`
      INSERT INTO agrilens.users (full_name, email, phone, password_hash, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), NOW())
      RETURNING id, full_name, email, phone, status, created_at;
    `, [body.fullName.trim(), cleanEmail, body.phone?.trim() || null, hashedPassword]);
        const createdUser = insertRes[0];
        await this.dataSource.query(`
      INSERT INTO agrilens.user_roles (user_id, role_id)
      VALUES ($1, $2);
    `, [createdUser.id, roleId]);
        await this.dataSource.query(`
      INSERT INTO agrilens.user_locations (user_id, admin_unit_id, scope_level, district_name, sector_name)
      VALUES ($1, $2, 'DISTRICT', $3, NULL);
    `, [createdUser.id, adminUnitId, resolvedDistrict]);
        await this.logAuditEvent({
            actorEmail: body.registeredByEmail || 'admin@agrilens.gov.rw',
            actorRole: 'PLATFORM_ADMIN',
            action: 'DISTRICT_OFFICER_REGISTERED',
            resource: `USER:${createdUser.id}`,
            details: {
                officerName: createdUser.full_name,
                officerEmail: createdUser.email,
                assignedDistrict: resolvedDistrict,
                role: 'DISTRICT_OFFICER',
                notes: body.notes || 'Agricultural District Officer registered by System Administrator'
            }
        });
        return {
            success: true,
            message: `Agricultural District Officer for ${resolvedDistrict} registered successfully.`,
            user: {
                id: createdUser.id,
                name: createdUser.full_name,
                email: createdUser.email,
                phone: createdUser.phone,
                role: 'DISTRICT_OFFICER',
                roleName: roleName,
                scopeLevel: 'DISTRICT',
                district: resolvedDistrict,
                status: createdUser.status,
                createdAt: createdUser.created_at
            }
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map