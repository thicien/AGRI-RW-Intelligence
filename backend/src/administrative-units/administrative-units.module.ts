import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministrativeUnitsController } from './administrative-units.controller';
import { AdministrativeUnitsService } from './administrative-units.service';
import { Province } from './entities/province.entity';
import { District } from './entities/district.entity';
import { Sector } from './entities/sector.entity';
import { Cell } from './entities/cell.entity';
import { Village } from './entities/village.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Province, District, Sector, Cell, Village])],
  controllers: [AdministrativeUnitsController],
  providers: [AdministrativeUnitsService],
  exports: [AdministrativeUnitsService]
})
export class AdministrativeUnitsModule {}
