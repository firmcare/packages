# Role System Migration Summary

## Schema Changes
- Removed `Role` enum
- Created `CustomRole` model with flexible role management
- Created `Permission` model for granular permissions
- Created `RolePermission` junction table for many-to-many relationship
- Updated `User` model to use `roleId` instead of `role` field
- Added `referralCode` field to User model

## Files Updated

### Core Auth & Permissions
1. **src/auth.ts**
   - Updated to fetch role from CustomRole table
   - Modified JWT callback to include role.name
   - Updated Google OAuth to create users with roleId

2. **src/lib/auth-utils.ts**
   - Updated requireAdmin() to redirect to /auth/admin/login
   - Updated requireSuperAdmin() to redirect to /auth/admin/login
   - Modified to check role.name from CustomRole table

3. **src/lib/permissions.ts**
   - Changed from role-based to userId-based permission checking
   - Updated to query User with role relation

4. **src/lib/api-middleware.ts**
   - Updated to use userId instead of role for permission checks

5. **src/lib/referral.ts**
   - Created function to generate unique 6-character referral codes
   - Uses timestamp-based generation for performance

### API Routes
6. **src/app/api/packages/route.ts**
   - Updated to use checkPermission with userId

7. **src/app/api/bookings/route.ts**
   - Updated to use checkPermission with userId
   - Modified to check role.name for admin access

8. **src/app/api/auth/signup/route.ts**
   - Created signup endpoint with referral code generation
   - Assigns USER role by default

9. **src/app/api/roles/route.ts** (NEW)
   - Create and list custom roles

10. **src/app/api/roles/[id]/route.ts** (NEW)
    - Update and delete custom roles

11. **src/app/api/permissions/route.ts** (NEW)
    - List all available permissions

12. **src/app/api/users/route.ts** (NEW)
    - List users with role filtering

13. **src/app/api/users/[id]/route.ts** (NEW)
    - Update user roles with hierarchy enforcement

### Admin Pages
14. **src/app/admin/page.tsx**
    - Updated to query users by roleId instead of role

15. **src/app/admin/analytics/page.tsx**
    - Updated to query users by roleId

16. **src/app/admin/users/page.tsx**
    - Updated to select role as object with id and name

17. **src/app/auth/admin/login/page.tsx** (NEW)
    - Created admin-specific login without Google auth

18. **src/app/auth/signup/page.tsx** (NEW)
    - Created user signup page with Google auth option

### Components
19. **src/components/admin/UserManagement.tsx**
    - Updated interface to handle role as object
    - Modified to use role.name instead of role string

### Database Seeds
20. **prisma/seed.ts**
    - Updated to create CustomRole records
    - Creates permissions and assigns to roles
    - Creates admin user with roleId and referralCode

21. **prisma/seed-roles.ts** (NEW)
    - Dedicated script for seeding roles and permissions

## Permission Structure

### USER Role
- bookings: create, read
- packages, categories, tests, promos: read

### ADMIN Role
- All resources except users, roles, permissions: full CRUD

### SUPERADMIN Role
- All resources: full CRUD
- Can manage ADMIN users
- Can create/modify any role

## Hierarchy Rules
- SUPERADMIN can manage all users including ADMINs
- ADMIN can manage non-ADMIN users
- ADMIN can create/modify custom roles (not ADMIN/SUPERADMIN)
- System roles (USER, ADMIN, SUPERADMIN) cannot be deleted

## Migration Steps
1. Run: `npx prisma generate`
2. Run: `npx prisma migrate dev --name flexible_roles_system`
3. Run: `npm run db:seed`

## Environment Variables
Added to .env:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
