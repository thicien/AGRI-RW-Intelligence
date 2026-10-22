import { Controller, Get, Post, Put, Body, Query, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 1. GET /api/v1/auth/roles
   * Return 8 official logical roles with geographic scope rules, capabilities and restrictions
   */
  @Get('roles')
  async getRoles() {
    return await this.authService.getRoles();
  }

  /**
   * 2. GET /api/v1/auth/permissions-matrix
   * Return Section 4.2 Permissions Matrix (13 capabilities x 8 roles)
   */
  @Get('permissions-matrix')
  async getPermissionsMatrix() {
    return await this.authService.getPermissionsMatrix();
  }

  /**
   * 3. GET /api/v1/auth/users
   * Return User Directory with assigned roles and geographic scopes
   */
  @Get('users')
  async getUsers() {
    return await this.authService.getUsers();
  }

  /**
   * 4. PUT /api/v1/auth/users/:id
   * Update user's role assignment and geographic boundaries (district/sector)
   */
  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { roleCode?: string; scopeLevel?: string; districtName?: string; sectorName?: string; status?: string }
  ) {
    return await this.authService.updateUser(id, body);
  }

  /**
   * 5. POST /api/v1/auth/export-check
   * Backend Security Guard: Enforce export authorization and geographic scoping on backend
   */
  @Post('export-check')
  @HttpCode(HttpStatus.OK)
  async checkExportPermission(
    @Body() body: {
      userEmail: string;
      roleCode: string;
      exportType: 'REPORT' | 'RAW_DATA';
      requestedDistrict?: string;
      datasetName: string;
    }
  ) {
    return await this.authService.checkExportPermission(body);
  }

  /**
   * 6. POST /api/v1/auth/submit-observation
   * Field Observation submission workflow for Sector/District Officers and Farmers
   */
  @Post('submit-observation')
  async submitObservation(
    @Body() body: {
      userEmail: string;
      districtName: string;
      sectorName: string;
      cropType: string;
      observationType: string;
      description: string;
      notes: string;
      gpsLat?: number;
      gpsLng?: number;
    }
  ) {
    return await this.authService.submitObservation(body);
  }

  /**
   * 7. GET /api/v1/auth/observations
   * Retrieve ground-truth field observations
   */
  @Get('observations')
  async getObservations(
    @Query('district') district?: string,
    @Query('sector') sector?: string
  ) {
    return await this.authService.getObservations(district, sector);
  }

  /**
   * 8. POST /api/v1/auth/approve-dataset
   * Controlled dataset publication approval workflow
   */
  @Post('approve-dataset')
  async approveDataset(
    @Body() body: {
      reviewerEmail: string;
      datasetName: string;
      seasonCode: string;
      validationPassScore: number;
      notes?: string;
    }
  ) {
    return await this.authService.approveDatasetPublication(body);
  }

  /**
   * 9. GET /api/v1/auth/audit-logs
   * Inspect Security Audit Logs
   */
  @Get('audit-logs')
  async getAuditLogs(
    @Query('limit') limit?: number,
    @Query('action') action?: string
  ) {
    return await this.authService.getAuditLogs(limit ? Number(limit) : 50, action);
  }

  /**
   * 10. POST /api/v1/auth/login
   * User Authentication
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    return await this.authService.login(body.email, body.password);
  }

  /**
   * 11. POST /api/v1/auth/register-district-officer
   * System Administrator registers an Agricultural District Officer
   */
  @Post('register-district-officer')
  @HttpCode(HttpStatus.CREATED)
  async registerDistrictOfficer(
    @Body() body: {
      fullName: string;
      email: string;
      phone?: string;
      password: string;
      districtName: string;
      notes?: string;
      registeredByEmail?: string;
    }
  ) {
    return await this.authService.registerDistrictOfficer(body);
  }
}
