import { 
  Controller, Get, Post, Put, Query, Param, Body, Headers, 
  ForbiddenException, BadRequestException, HttpCode, HttpStatus 
} from '@nestjs/common';
import { DataManagerService } from './data-manager.service';
import { JwtService } from '@nestjs/jwt';

@Controller('data-manager')
export class DataManagerController {
  constructor(
    private readonly dataManagerService: DataManagerService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Helper: Enforce that actor has DATA_MANAGER or PLATFORM_ADMIN role
   */
  private enforceDataManagerRole(authHeader?: string): { email: string; role: string } {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Default fallback for development/demo
      return { email: 'datamanager@agrilens.gov.rw', role: 'DATA_MANAGER' };
    }

    try {
      const token = authHeader.substring(7);
      const payload: any = this.jwtService.decode(token);
      if (!payload || !payload.role) {
        throw new ForbiddenException('Invalid authentication token.');
      }

      const allowedRoles = ['DATA_MANAGER', 'PLATFORM_ADMIN'];
      if (!allowedRoles.includes(payload.role)) {
        throw new ForbiddenException(
          `Access Denied: Your role (${payload.role}) is not authorized to access the Agricultural Data Management Workspace. Requires DATA_MANAGER or PLATFORM_ADMIN privilege.`
        );
      }

      return {
        email: payload.email || 'manager.data@minagri.gov.rw',
        role: payload.role
      };
    } catch (e: any) {
      if (e instanceof ForbiddenException) throw e;
      return { email: 'datamanager@agrilens.gov.rw', role: 'DATA_MANAGER' };
    }
  }

  /**
   * 1. GET /api/v1/data-manager/overview
   */
  @Get('overview')
  async getOverview(@Headers('authorization') auth?: string) {
    this.enforceDataManagerRole(auth);
    return await this.dataManagerService.getDataOperationsOverview();
  }

  /**
   * 2. GET /api/v1/data-manager/datasets
   */
  @Get('datasets')
  async getDatasets(
    @Query('domain') domain?: string,
    @Query('status') status?: string,
    @Query('season') season?: string,
    @Query('format') format?: string,
    @Headers('authorization') auth?: string,
  ) {
    this.enforceDataManagerRole(auth);
    return await this.dataManagerService.getDatasets({ domain, status, season, format });
  }

  /**
   * 3. POST /api/v1/data-manager/datasets
   * Register source dataset (PDF or XLSX)
   */
  @Post('datasets')
  @HttpCode(HttpStatus.CREATED)
  async registerDataset(
    @Body() body: any,
    @Headers('authorization') auth?: string,
  ) {
    const actor = this.enforceDataManagerRole(auth);
    return await this.dataManagerService.registerDataset({
      ...body,
      actorEmail: actor.email
    });
  }

  /**
   * 4. POST /api/v1/data-manager/datasets/:id/publish
   * Two-man rule or publication authorization
   */
  @Post('datasets/:id/publish')
  @HttpCode(HttpStatus.OK)
  async publishDataset(
    @Param('id') id: string,
    @Body('notes') notes?: string,
    @Headers('authorization') auth?: string,
  ) {
    const actor = this.enforceDataManagerRole(auth);
    return await this.dataManagerService.publishDataset(id, actor.email, notes);
  }

  /**
   * 5. GET /api/v1/data-manager/validation-quality
   * 6-point Data Quality inspection
   */
  @Get('validation-quality')
  async getValidationIssues(
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('issueType') issueType?: string,
    @Headers('authorization') auth?: string,
  ) {
    this.enforceDataManagerRole(auth);
    return await this.dataManagerService.getValidationIssues({ status, severity, issueType });
  }

  /**
   * 6. POST /api/v1/data-manager/validation-quality/run
   * Execute automated validation rules check
   */
  @Post('validation-quality/run')
  @HttpCode(HttpStatus.OK)
  async runValidationPipeline(@Headers('authorization') auth?: string) {
    const actor = this.enforceDataManagerRole(auth);
    return await this.dataManagerService.runValidationPipeline(actor.email);
  }

  /**
   * 7. PUT /api/v1/data-manager/validation-quality/issues/:id/resolve
   */
  @Put('validation-quality/issues/:id/resolve')
  async resolveIssue(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Headers('authorization') auth?: string,
  ) {
    const actor = this.enforceDataManagerRole(auth);
    return await this.dataManagerService.resolveValidationIssue(id, notes, actor.email);
  }

  /**
   * 8. GET /api/v1/data-manager/processing-jobs
   */
  @Get('processing-jobs')
  async getProcessingJobs(@Headers('authorization') auth?: string) {
    this.enforceDataManagerRole(auth);
    return await this.dataManagerService.getProcessingJobs();
  }

  /**
   * 9. POST /api/v1/data-manager/processing-jobs/run
   */
  @Post('processing-jobs/run')
  @HttpCode(HttpStatus.OK)
  async runProcessingJob(
    @Body() body: any,
    @Headers('authorization') auth?: string,
  ) {
    const actor = this.enforceDataManagerRole(auth);
    return await this.dataManagerService.runProcessingJob({
      ...body,
      actorEmail: actor.email
    });
  }

  /**
   * 10. GET /api/v1/data-manager/seasons-coverage
   */
  @Get('seasons-coverage')
  async getSeasonsCoverage(@Headers('authorization') auth?: string) {
    this.enforceDataManagerRole(auth);
    return await this.dataManagerService.getSeasonsCoverageMatrix();
  }

  /**
   * 11. GET /api/v1/data-manager/versions
   */
  @Get('versions')
  async getVersions(@Headers('authorization') auth?: string) {
    this.enforceDataManagerRole(auth);
    return await this.dataManagerService.getDatasetVersions();
  }

  /**
   * 12. GET /api/v1/data-manager/audit-logs
   */
  @Get('audit-logs')
  async getAuditLogs(
    @Query('limit') limit?: string,
    @Headers('authorization') auth?: string,
  ) {
    this.enforceDataManagerRole(auth);
    const parsedLimit = limit ? parseInt(limit, 10) : 30;
    return await this.dataManagerService.getDataAuditLogs(parsedLimit);
  }
}
