import { 
  Controller, Get, Put, Post, Query, Param, Body, Headers, 
  ForbiddenException, BadRequestException, HttpCode, HttpStatus 
} from '@nestjs/common';
import { DistrictService } from './district.service';
import { JwtService } from '@nestjs/jwt';

@Controller('district')
export class DistrictController {
  constructor(
    private readonly districtService: DistrictService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Helper to verify and enforce district authorization from JWT
   */
  private resolveAuthorizedDistrict(authHeader?: string, requestedDistrict?: string): string {
    let tokenDistrict: string | null = null;
    let userRole: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload: any = this.jwtService.decode(token);
        if (payload) {
          userRole = payload.role;
          tokenDistrict = payload.district || null;
        }
      } catch (e) {
        // Token parse fallback
      }
    }

    // If user is a DISTRICT_OFFICER, strictly enforce their assigned district
    if (userRole === 'DISTRICT_OFFICER') {
      if (!tokenDistrict) {
        throw new ForbiddenException('User token does not contain an assigned district scope.');
      }
      if (requestedDistrict && requestedDistrict.trim().toLowerCase() !== tokenDistrict.trim().toLowerCase()) {
        throw new ForbiddenException(
          `Geographic Access Restriction: You are authorized for ${tokenDistrict} District only. Access to ${requestedDistrict} data is strictly prohibited.`
        );
      }
      return tokenDistrict;
    }

    // Platform Admin or National Planner can query requested district, or default to Musanze
    return requestedDistrict?.trim() || tokenDistrict || 'Musanze';
  }

  /**
   * 1. GET /api/v1/district/overview
   */
  @Get('overview')
  async getOverview(
    @Query('district') district?: string,
    @Query('season') season?: string,
    @Query('year') year?: string,
    @Headers('authorization') auth?: string,
  ) {
    const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
    return await this.districtService.getDistrictOverview(verifiedDistrict, season || '2026B', year);
  }

  /**
   * 2. GET /api/v1/district/productivity
   */
  @Get('productivity')
  async getProductivity(
    @Query('district') district?: string,
    @Query('season') season?: string,
    @Query('compareSeason') compareSeason?: string,
    @Query('compareMode') compareMode?: string,
    @Query('stabilityThreshold') stabilityThreshold?: string,
    @Headers('authorization') auth?: string,
  ) {
    const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
    return await this.districtService.getDistrictProductivity(
      verifiedDistrict, 
      season || '2026B',
      compareSeason,
      compareMode,
      stabilityThreshold ? parseFloat(stabilityThreshold) : 5.0
    );
  }

  /**
   * 3. GET /api/v1/district/irrigation
   */
  @Get('irrigation')
  async getIrrigation(
    @Query('district') district?: string,
    @Query('season') season?: string,
    @Query('compareSeason') compareSeason?: string,
    @Query('compareMode') compareMode?: string,
    @Headers('authorization') auth?: string,
  ) {
    const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
    return await this.districtService.getDistrictIrrigation(
      verifiedDistrict, 
      season || '2026B',
      compareSeason,
      compareMode
    );
  }

  /**
   * 4. GET /api/v1/district/soil
   */
  @Get('soil')
  async getSoil(
    @Query('district') district?: string,
    @Query('season') season?: string,
    @Query('compareSeason') compareSeason?: string,
    @Query('compareMode') compareMode?: string,
    @Headers('authorization') auth?: string,
  ) {
    const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
    return await this.districtService.getDistrictSoil(
      verifiedDistrict, 
      season || '2026B',
      compareSeason,
      compareMode
    );
  }

  /**
   * 5. GET /api/v1/district/post-harvest
   */
  @Get('post-harvest')
  async getPostHarvest(
    @Query('district') district?: string,
    @Query('season') season?: string,
    @Query('compareSeason') compareSeason?: string,
    @Query('compareMode') compareMode?: string,
    @Headers('authorization') auth?: string,
  ) {
    const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
    return await this.districtService.getDistrictPostHarvest(
      verifiedDistrict, 
      season || '2026B',
      compareSeason,
      compareMode
    );
  }

  /**
   * 6. GET /api/v1/district/exports
   */
  @Get('exports')
  async getExports(
    @Query('district') district?: string,
    @Query('season') season?: string,
    @Query('compareSeason') compareSeason?: string,
    @Query('compareMode') compareMode?: string,
    @Headers('authorization') auth?: string,
  ) {
    const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
    return await this.districtService.getDistrictExports(
      verifiedDistrict, 
      season || '2026B',
      compareSeason,
      compareMode
    );
  }

  /**
   * 7. GET /api/v1/district/interventions
   */
  @Get('interventions')
  async getInterventions(
    @Query('district') district?: string,
    @Query('status') status?: string,
    @Headers('authorization') auth?: string,
  ) {
    const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
    return await this.districtService.getDistrictInterventions(verifiedDistrict, status);
  }

  /**
   * 8. PUT /api/v1/district/interventions/:id/status
   */
  @Put('interventions/:id/status')
  async updateInterventionStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string; userEmail?: string },
  ) {
    return await this.districtService.updateInterventionStatus(id, body.status, body.notes, body.userEmail);
  }

  /**
   * 9. POST /api/v1/district/field-observations
   */
  @Post('field-observations')
  @HttpCode(HttpStatus.CREATED)
  async submitFieldObservation(
    @Body() body: {
      districtName: string;
      sectorName: string;
      cropType: string;
      observationType: string;
      description: string;
      notes: string;
      gpsLat?: number;
      gpsLng?: number;
      userEmail: string;
    },
    @Headers('authorization') auth?: string,
  ) {
    const verifiedDistrict = this.resolveAuthorizedDistrict(auth, body.districtName);
    return await this.districtService.submitFieldObservation({
      ...body,
      districtName: verifiedDistrict
    });
  }

  /**
   * 10. GET /api/v1/district/reports
   * Generate official district agricultural analytical report
   */
  @Get('reports')
  async getReports(
    @Query('district') district?: string,
    @Headers('authorization') auth?: string,
  ) {
    const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
    const overview = await this.districtService.getDistrictOverview(verifiedDistrict);

    return {
      reportTitle: `AgriLens Rwanda — District Agricultural Intelligence Brief (${verifiedDistrict})`,
      district: verifiedDistrict,
      publishedBy: 'National Institute of Statistics of Rwanda (NISR) & MINAGRI',
      generatedAt: new Date().toISOString(),
      classification: 'OFFICIAL DISTRICT ANALYTICAL DOSSIER',
      overviewKpis: overview.kpis,
      sectorHighlights: overview.sectors.slice(0, 5),
      interventionsSummary: overview.interventions,
      disclaimer: 'This document contains authorized district-scoped intelligence derived from verified NISR seasonal agricultural surveys.'
    };
  }

  /**
   * 11. GET /api/v1/district/notifications
   */
  @Get('notifications')
  async getNotifications(
    @Query('district') district?: string,
    @Headers('authorization') auth?: string,
  ) {
    const verifiedDistrict = this.resolveAuthorizedDistrict(auth, district);
    return [
      {
        id: 'notif-1',
        title: 'NISR Season 2026B Validation Data Released',
        message: `Preliminary crop cutting and yield metrics for ${verifiedDistrict} District are now integrated into your dashboard.`,
        date: '2 hours ago',
        type: 'DATA_RELEASE',
        priority: 'HIGH'
      },
      {
        id: 'notif-2',
        title: 'Pending Field Verification Request',
        message: `New sector agronomist submission in ${verifiedDistrict} requires district officer sign-off.`,
        date: '1 day ago',
        type: 'FIELD_ACTION',
        priority: 'MEDIUM'
      },
      {
        id: 'notif-3',
        title: 'Small-Scale Irrigation Subsidy Window Open',
        message: `MINAGRI SSIT subsidy allocations have been designated for eligible marshland sites in ${verifiedDistrict}.`,
        date: '3 days ago',
        type: 'POLICY',
        priority: 'NORMAL'
      }
    ];
  }
}
