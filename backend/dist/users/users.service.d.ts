import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
export declare class UsersService implements OnModuleInit {
    private userRepository;
    private roleRepository;
    private readonly logger;
    constructor(userRepository: Repository<User>, roleRepository: Repository<Role>);
    onModuleInit(): Promise<void>;
    private seedRolesAndAdmin;
}
