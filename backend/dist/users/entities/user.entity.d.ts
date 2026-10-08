import { Role } from './role.entity';
import { UserLocation } from './user-location.entity';
export declare class User {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    is_active: boolean;
    role: Role;
    locations: UserLocation[];
    created_at: Date;
    updated_at: Date;
}
