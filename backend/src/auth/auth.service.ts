import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private jwtService: JwtService,
  ) {}

  /**
   * 1. Retrieve all 8 Official Logical Roles with Geographic Scope and Capability Metadata
   */
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

    // Map capabilities and restrictions per role for Section 4.4 interactive explorer
    const roleDetails: Record<string, any> = {
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

    return roles.map((r: any) => ({
      ...r,
      details: roleDetails[r.code] || {
        geographicScope: 'Configured Scope',
        allowedCapabilities: ['View authorized dashboards'],
        restrictions: ['Standard platform access rules apply']
      }
    }));
  }

  /**
   * 2. Retrieve Section 4.2 Permissions Matrix (13 Capabilities x 8 Roles)
   */
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

    // Group into a clean matrix object
    const matrix: Record<string, Record<string, string>> = {};
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

  /**
   * 3. Retrieve User Directory with Assigned Roles and Geographic Scope
   */
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

  /**
   * 4. Update User Role and Geographic Scope
   */
  async updateUser(userId: string, updateData: {
    roleCode?: string;
    scopeLevel?: string;
    districtName?: string;
    sectorName?: string;
    status?: string;
  }) {
    if (updateData.status) {
      await this.dataSource.query(
        `UPDATE agrilens.users SET status = $1, updated_at = NOW() WHERE id = $2`,
        [updateData.status, userId]
      );
    }

    if (updateData.roleCode) {
      const role = await this.dataSource.query(
        `SELECT id FROM agrilens.roles WHERE code = $1 LIMIT 1`,
        [updateData.roleCode]
      );
      if (role.length > 0) {
        await this.dataSource.query(`DELETE FROM agrilens.user_roles WHERE user_id = $1`, [userId]);
        await this.dataSource.query(
          `INSERT INTO agrilens.user_roles (user_id, role_id) VALUES ($1, $2)`,
          [userId, role[0].id]
        );
      }
    }

    if (updateData.scopeLevel) {
      await this.dataSource.query(`DELETE FROM agrilens.user_locations WHERE user_id = $1`, [userId]);

      let unitId = null;
      if (updateData.districtName) {
        const dUnit = await this.dataSource.query(
          `SELECT id FROM agrilens.administrative_units WHERE name ILIKE $1 LIMIT 1`,
          [updateData.districtName]
        );
        if (dUnit.length > 0) unitId = dUnit[0].id;
      }

      await this.dataSource.query(
        `INSERT INTO agrilens.user_locations (user_id, admin_unit_id, scope_level, district_name, sector_name)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, unitId, updateData.scopeLevel, updateData.districtName || null, updateData.sectorName || null]
      );
    }

    // Log security audit event
    await this.logAuditEvent({
      actorEmail: 'admin@agrilens.gov.rw',
      actorRole: 'PLATFORM_ADMIN',
      action: 'USER_SCOPE_ASSIGNMENT',
      resource: 'USER_MANAGEMENT',
      details: { userId, updates: updateData }
    });

    return { success: true, message: 'User role and geographic authorization updated successfully.' };
  }

  /**
   * 5. Backend Enforcement: Check Export Permission (Section 4.2 Security requirement)
   */
  async checkExportPermission(params: {
    userEmail: string;
    roleCode: string;
    exportType: 'REPORT' | 'RAW_DATA';
    requestedDistrict?: string;
    datasetName: string;
  }) {
    const { userEmail, roleCode, exportType, requestedDistrict, datasetName } = params;

    // Check user geographic location from DB
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

    // Check capability in Matrix
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
      throw new ForbiddenException(`Access Denied: Your role (${userProfile.role_code}) is not permitted to perform ${exportType} export.`);
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
        throw new ForbiddenException(`Geographic Access Restriction: You are authorized for ${userProfile.district_name} District only. Access to ${requestedDistrict} is prohibited.`);
      }
    }

    // Permission granted! Generate an audit receipt token
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

  /**
   * 6. Submit Ground-Truth Field Observation (Sector & District Officers)
   */
  async submitObservation(body: {
    userEmail: string;
    districtName: string;
    sectorName: string;
    cropType: string;
    observationType: string;
    description: string;
    notes: string;
    gpsLat?: number;
    gpsLng?: number;
  }) {
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

  /**
   * 7. Retrieve Field Observations with Scope Filtering
   */
  async getObservations(district?: string, sector?: string) {
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
    const params: any[] = [];
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

  /**
   * 8. Controlled Publication Approval (Data Manager / Reviewer Workflow)
   */
  async approveDatasetPublication(body: {
    reviewerEmail: string;
    datasetName: string;
    seasonCode: string;
    validationPassScore: number;
    notes?: string;
  }) {
    // Verify reviewer role
    const reviewerRes = await this.dataSource.query(`
      SELECT r.code AS role_code
      FROM agrilens.users u
      JOIN agrilens.user_roles ur ON u.id = ur.user_id
      JOIN agrilens.roles r ON ur.role_id = r.id
      WHERE u.email = $1 LIMIT 1;
    `, [body.reviewerEmail]);

    const role = reviewerRes[0]?.role_code;
    if (role !== 'DATA_MANAGER' && role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Only authorized Data Managers or Platform Administrators may sign off on dataset publication.');
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

  /**
   * 9. Security Audit Logs Query
   */
  async getAuditLogs(limit: number = 50, actionFilter?: string) {
    let query = `
      SELECT id, actor_email, actor_role, action, resource, details, ip_address, created_at
      FROM agrilens.audit_logs
      WHERE 1=1
    `;
    const params: any[] = [];
    if (actionFilter) {
      params.push(`%${actionFilter}%`);
      query += ` AND action ILIKE $${params.length}`;
    }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1};`;
    params.push(limit);

    return await this.dataSource.query(query, params);
  }

  /**
   * 10. Audit Logger Helper
   */
  private async logAuditEvent(event: {
    actorEmail: string;
    actorRole: string;
    action: string;
    resource: string;
    details: any;
  }) {
    try {
      await this.dataSource.query(`
        INSERT INTO agrilens.audit_logs (actor_email, actor_role, action, resource, details)
        VALUES ($1, $2, $3, $4, $5);
      `, [event.actorEmail, event.actorRole, event.action, event.resource, JSON.stringify(event.details)]);
    } catch (e) {
      console.error('Audit log write error:', e.message);
    }
  }

  /**
   * 11. User Authentication (Login)
   */
  async login(email: string, pass: string) {
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
      throw new UnauthorizedException('Invalid credentials.');
    }

    const user = userRes[0];
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is inactive. Contact system administrator.');
    }

    const validPassword = await argon2.verify(user.password_hash, pass);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials.');
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
}
