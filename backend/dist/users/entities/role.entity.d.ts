import { Permission } from './permission.entity';
import { User } from './user.entity';
export declare class Role {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    users: User[];
}
