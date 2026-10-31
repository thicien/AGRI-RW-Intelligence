import { Controller, Get, Query } from '@nestjs/common';
import { TradeService } from './trade.service';

@Controller('trade')
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Get('decision-workspace')
  async getDecisionWorkspace(
    @Query('season') season: string = '2025A',
    @Query('compareSeason') compareSeason?: string,
    @Query('commodity') commodity: string = 'ALL',
    @Query('destination') destination: string = 'ALL',
    @Query('province') province: string = 'ALL',
    @Query('layer') layer: string = 'export_value',
  ) {
    return this.tradeService.getDecisionWorkspace(
      season,
      compareSeason,
      commodity,
      destination,
      province,
      layer,
    );
  }

  @Get('summary')
  async getSummary(@Query('season') season: string = '2026B') {
    return this.tradeService.getSummary(season);
  }

  @Get('products-trade')
  async getProductsTrade(@Query('season') season: string = '2026B') {
    return this.tradeService.getProductsTrade(season);
  }

  @Get('districts')
  async getDistricts(@Query('season') season: string = '2026B') {
    return this.tradeService.getDistricts(season);
  }

  @Get('seasons')
  async getSeasons() {
    return this.tradeService.getSeasons();
  }

  @Get('opportunity-screening')
  async getOpportunityScreening() {
    return this.tradeService.getOpportunityScreening();
  }

  @Get('commercial-dossier')
  async getCommercialDossier(
    @Query('product') product: string = 'Hass Avocado',
    @Query('destination') destination: string = 'Netherlands',
  ) {
    return this.tradeService.getCommercialDossier(product, destination);
  }
}
