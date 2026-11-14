// Netlify function: /api/login and /api/settings. Settings are kept in Netlify Blobs (free, built in).
// The password is the ADMIN_PASSWORD environment variable, set in the Netlify dashboard. It is never in the code.
import { getStore } from '@netlify/blobs';
import { createApi } from '../../server/core.mjs';

export default async (req, context) => {
  const blobs = getStore({ name: 'portfolio', consistency: 'strong' });
  const store = { get: k => blobs.get(k, { type: 'json' }), set: (k, v) => blobs.setJSON(k, v) };
  const api = createApi({ store, password: process.env.ADMIN_PASSWORD, secret: process.env.SESSION_SECRET });
  return api.handle(req, context.ip);
};

export const config = { path: ['/api/login', '/api/settings'] };
