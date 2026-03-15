import { auth } from '@/auth';
import { checkPermission } from '@/lib/permissions';
import { NextResponse } from 'next/server';

type Action = 'create' | 'read' | 'update' | 'delete';
type Resource = 'bookings' | 'users' | 'packages' | 'categories' | 'tests' | 'promos' | 'transactions' | 'roles' | 'permissions';

export async function withPermission(
  resource: Resource,
  action: Action,
  handler: (req: Request, session: any) => Promise<Response>
) {
  return async (req: Request) => {
    const session = await auth();
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const hasPermission = await checkPermission(
      session.user.id,
      resource,
      action
    );

    if (!hasPermission) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    return handler(req, session);
  };
}
