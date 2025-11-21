import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export async function createContext(opts?: FetchCreateContextFnOptions) {
  // In a real app, we'd verify the session/token here
  // For now, we mock a logged-in user and org
  
  return {
    user: {
      id: 'user_mock_1',
      name: 'Demo User',
      email: 'demo@amplis.app',
    },
    org: {
      id: 'org_mock_1',
      role: 'OWNER',
    },
    headers: opts?.req.headers,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;


