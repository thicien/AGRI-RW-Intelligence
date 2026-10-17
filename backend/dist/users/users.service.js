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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const argon2 = __importStar(require("argon2"));
const user_entity_1 = require("./entities/user.entity");
const role_entity_1 = require("./entities/role.entity");
let UsersService = UsersService_1 = class UsersService {
    userRepository;
    roleRepository;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(userRepository, roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }
    async onModuleInit() {
        this.logger.log('Checking database for roles and default admin user...');
        await this.seedRolesAndAdmin();
    }
    async seedRolesAndAdmin() {
        const defaultRoles = [
            { name: 'Platform Administrator', description: 'Highest privilege. Manages accounts, role assignments, permissions, system configuration and security.' },
            { name: 'Data Manager', description: 'Manages dataset uploads, extraction jobs, metadata, data validation, corrections and publication of approved datasets.' },
            { name: 'National Agricultural Planner', description: 'Views national and district-level indicators, compares seasons, reviews opportunity rankings, generates reports.' },
            { name: 'District Agricultural Officer', description: 'Views the assigned district and its sectors, analyzes local agricultural trends, reviews intervention priorities.' },
            { name: 'Sector Agricultural Officer', description: 'Views the assigned sector, available local indicators and aggregated agricultural statistics.' },
            { name: 'Researcher or Data Analyst', description: 'Explores authorized datasets, filters seasonal and geographic data, conducts comparisons and exports records.' },
            { name: 'Cooperative or Farmer User', description: 'Views accessible crop trends, seasonal guidance, nearby verified facilities and relevant market information.' },
            { name: 'Partner, Policymaker or Viewer', description: 'Accesses approved dashboards, public maps and published reports. Cannot upload datasets or alter records.' }
        ];
        for (const roleData of defaultRoles) {
            let role = await this.roleRepository.findOne({ where: { name: roleData.name } });
            if (!role) {
                role = this.roleRepository.create(roleData);
                await this.roleRepository.save(role);
                this.logger.log(`Created Role: ${role.name}`);
            }
            const emailPrefix = roleData.name.toLowerCase().replace(/[^a-z0-default]/g, '');
            const userEmail = `${emailPrefix}@agrilens.rw`;
            const existingUser = await this.userRepository.findOne({ where: { email: userEmail } });
            if (!existingUser) {
                this.logger.log(`Default user for ${role.name} not found. Creating ${userEmail}...`);
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map