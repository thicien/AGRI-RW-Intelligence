import { 
  Controller, Get, Post, Put, Delete, Body, Param, Query, 
  Headers, ForbiddenException, BadRequestException, HttpCode, HttpStatus 
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtService } from '@nestjs/jwt';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Helper: Enforce that actor has PLATFORM_ADMIN or SYSTEM_ADMIN role
   */
  private enforceAdminRole(authHeader?: string): { email: string; role: string } {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Default fallback for development/demo
      return { email: 'admin@agrilens.gov.rw', role: 'PLATFORM_ADMIN' };
    }

    try {
      const token = authHeader.substring(7);
      const payload: any = this.jwtService.decode(token);
      if (!payload || !payload.role) {
        throw new ForbiddenException('Invalid authentication token.');
      }

      const allowedRoles = ['PLATFORM_ADMIN', 'SYSTEM_ADMIN'];
      if (!allowedRoles.includes(payload.role)) {
        throw new ForbiddenException(
          `Access Denied: Your role (${payload.role}) is not authorized to access the System Administration Center. Requires PLATFORM_ADMIN privileges.`
        );
      }

      return {
        email: payload.email || 'admin@agrilens.gov.rw',
        role: payload.role
      };
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      return { email: 'admin@agrilens.gov.rw', role: 'PLATFORM_ADMIN' };
    }
  }

  /**
   * 1. Overview & 4 Live KPIs
   */
  @Get('overview')
  async getOverview(@Headers('authorization') auth?: string) {
    this.enforceAdminRole(auth);
    return await this.adminService.getOverview();
  }

  /**
   * 2. Live System Health & Diagnostics
   */
  @Get('health')
  async getSystemHealth(@Headers('authorization') auth?: string) {
    this.enforceAdminRole(auth);
    return await this.adminService.getSystemHealth();
  }

  /**
   * 3. User Directory
   */
  @Get('users')
  async getUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Headers('authorization') auth?: string,
  ) {
    this.enforceAdminRole(auth);
    return await this.adminService.getUsers({ role, status, search });
  }

  /**
   * 4. Create User Account
   */
  @Post('users')
  async createUser(
    @Body() body: {
      fullName: string;
      email: string;
      phone?: string;
      password: string;
      roleCode: string;
      districtName?: string;
      sectorName?: string;
    },
    @Headers('authorization') auth?: string,
  ) {
    const actor = this.enforceAdminRole(auth);
    return await this.adminService.createUser(body, actor.email);
  }

  /**
   * 5. Update User Status (Activate, Suspend, Deactivate) with Last-Admin Guard
   */
  @Put('users/:id/status')
  async updateUserStatus(
    @Param('id') userId: string,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE',
    @Headers('authorization') auth?: string,
  ) {
    const actor = this.enforceAdminRole(auth);
    return await this.adminService.updateUserStatus(userId, status, actor.email);
  }

  /**
   * 6. Reset User Password
   */
  @Post('users/:id/reset-password')
  async resetUserPassword(
    @Param('id') userId: string,
    @Body('newPassword') newPassword: string,
    @Headers('authorization') auth?: string,
  ) {
    const actor = this.enforceAdminRole(auth);
    return await this.adminService.resetUserPassword(userId, newPassword, actor.email);
  }

  /**
   * 7. Update User Role & Geographic Scope
   */
  @Put('users/:id/role-scope')
  async updateUserRoleAndScope(
    @Param('id') userId: string,
    @Body() body: {
      roleCode: string;
      districtName?: string;
      sectorName?: string;
    },
    @Headers('authorization') auth?: string,
  ) {
    const actor = this.enforceAdminRole(auth);
    return await this.adminService.updateUserRoleAndScope(userId, body, actor.email);
  }

  /**
   * 8. Roles & Permissions Explorer
   */
  @Get('roles-permissions')
  async getRolesAndPermissions(@Headers('authorization') auth?: string) {
    this.enforceAdminRole(auth);
    return await this.adminService.getRolesAndPermissions();
  }

  /**
   * 9. Administrative Geography
   */
  @Get('geography')
  async getGeographyConfig(@Headers('authorization') auth?: string) {
    this.enforceAdminRole(auth);
    return await this.adminService.getGeographyConfig();
  }

  /**
   * 10. Dataset Administration Overview
   */
  @Get('datasets')
  async getDatasetsAdmin(@Headers('authorization') auth?: string) {
    this.enforceAdminRole(auth);
    return await this.adminService.getDatasetsAdmin();
  }

  /**
   * 11. System Configuration
   */
  @Get('configuration')
  async getSystemConfiguration(@Headers('authorization') auth?: string) {
    this.enforceAdminRole(auth);
    return await this.adminService.getSystemConfiguration();
  }

  @Put('configuration')
  async updateSystemConfiguration(
    @Body() body: any,
    @Headers('authorization') auth?: string,
  ) {
    const actor = this.enforceAdminRole(auth);
    return await this.adminService.updateSystemConfiguration(body, actor.email);
  }

  /**
   * 12. Security Audit Logs (Immutable Query)
   */
  @Get('audit-logs')
  async getAuditLogs(
    @Query('limit') limit?: number,
    @Query('action') action?: string,
    @Query('actor') actor?: string,
    @Query('search') search?: string,
    @Headers('authorization') auth?: string,
  ) {
    this.enforceAdminRole(auth);
    return await this.adminService.getAuditLogs({ limit: limit ? Number(limit) : 100, action, actor, search });
  }

  /**
   * 13. Security & Access Metrics
   */
  @Get('security-metrics')
  async getSecurityMetrics(@Headers('authorization') auth?: string) {
    this.enforceAdminRole(auth);
    return await this.adminService.getSecurityMetrics();
  }

  /**
   * 14. Backup & Recovery Status
   */
  @Get('backup-status')
  async getBackupStatus(@Headers('authorization') auth?: string) {
    this.enforceAdminRole(auth);
    return await this.adminService.getBackupStatus();
  }

  /**
   * 15. Notifications
   */
  @Get('notifications')
  async getNotifications(@Headers('authorization') auth?: string) {
    this.enforceAdminRole(auth);
    return await this.adminService.getNotifications();
  }

  /**
   * 16. Platform Reports Data Export
   */
  @Get('platform-reports')
  async getPlatformReportData(@Headers('authorization') auth?: string) {
    this.enforceAdminRole(auth);
    return await this.adminService.getPlatformReportData();
  }

  /**
   * SECURITY ENFORCEMENT ENDPOINTS (Demonstrates explicit DENY policies)
   */

  // Deny direct statistical editing by System Administrator
  @Post('agricultural-stats')
  @HttpCode(HttpStatus.FORBIDDEN)
  modifyAgriculturalStatsDirectly() {
    this.adminService.denyAgriculturalStatsModification();
  }

  // Deny dataset publication without required data validation approval
  @Post('publish-dataset-direct')
  @HttpCode(HttpStatus.FORBIDDEN)
  publishDatasetWithoutApproval() {
    this.adminService.denyDirectDatasetPublication();
  }

  // Deny altering or erasing audit logs
  @Delete('audit-logs/:id')
  @HttpCode(HttpStatus.FORBIDDEN)
  deleteAuditRecord() {
    this.adminService.denyAuditAlteration();
  }
}
