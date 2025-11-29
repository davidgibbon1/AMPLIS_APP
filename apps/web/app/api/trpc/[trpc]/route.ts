import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/routers';
import { createContext } from '@/server/trpc/context';

const handler = async (req: Request) => {
  console.log('🔷 [TRPC] Handling request:', req.url);
  
  // Log request body for mutations
  if (req.method === 'POST') {
    const clonedReq = req.clone();
    const body = await clonedReq.text();
    console.log('📨 [TRPC] POST body:', body);
  }
  
  try {
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext,
      onError: ({ path, error }) => {
        console.error('❌ [TRPC] Error on path:', path);
        console.error('❌ [TRPC] Error details:', error);
      },
    });
    
    console.log('✅ [TRPC] Request completed successfully');
    return response;
  } catch (error) {
    console.error('💥 [TRPC] Fatal error:', error);
    throw error;
  }
};

export { handler as GET, handler as POST };


