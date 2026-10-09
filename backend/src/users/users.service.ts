import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    this.logger.log('Checking database for roles and default admin user...');
    await this.seedRolesAndAdmin();
  }

  private async seedRolesAndAdmin() {
    const defaultRoles = [
      { name: 'System Administrator', description: 'Full system access and data management' },
      { name: 'Data Manager', description: 'Import and validate agricultural datasets' },
      { name: 'National Planner', description: 'National level agricultural analytics access' },
      { name: 'District Officer', description: 'District-level analytics and operations' },
      { name: 'Sector Officer', description: 'Sector-level analytics and operations' },
      { name: 'Researcher / Analyst', description: 'Statistical and analytical research access' },
      { name: 'Development Partner', description: 'Program-specific geographic data access' },
      { name: 'Viewer', description: 'Read-only access to approved intelligence' }
    ];

    for (const roleData of defaultRoles) {
      let role = await this.roleRepository.findOne({ where: { name: roleData.name } });
      if (!role) {
        role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
        this.logger.log(`Created Role: ${role.name}`);
      }

      // Generate a standardized email for the role (e.g., 'Data Manager' -> 'datamanager@agrilens.rw')
      const emailPrefix = roleData.name.toLowerCase().replace(/[^a-z0-default]/g, '');
      const userEmail = `${emailPrefix}@agrilens.rw`;
      
      const existingUser = await this.userRepository.findOne({ where: { email: userEmail } });
      
      if (!existingUser) {
        this.logger.log(`Default user for ${role.name} not found. Creating ${userEmail}...`);
        
        // System Admin gets the specific password, others get a generic secure password
        const plainPassword = roleData.name === 'System Administrator' ? 'Admin@2026!' : 'AgriLens@2026!';
        const hashedPassword = await argon2.hash(plainPassword);
        
        const newUser = this.userRepository.create({
          name: `Default ${role.name}`,
          email: userEmail,
          password_hash: hashedPassword,
          role: role,
          is_active: true
        });
        
        await this.userRepository.save(newUser);
        this.logger.log(`Default User created for ${role.name}: ${userEmail}`);
      }
    }
  }
}
