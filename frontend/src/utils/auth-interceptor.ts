import { TOKEN_KEY } from './constants';

/**
 * Auth interceptor for brain client requests
 * Adds the Authorization header to requests if a token is available
 */
export const authInterceptor = (req: Request): Request => {
  // Clone the request to avoid modifying the original
  const modifiedReq = req.clone();
  
  // Get the auth token from local storage
  const token = localStorage.getItem(TOKEN_KEY);
  
  // If we have a token and request doesn't already have an Authorization header
  if (token && !modifiedReq.headers.has('Authorization')) {
    // Add the token to the Authorization header
    modifiedReq.headers.set('Authorization', `Bearer ${token}`);
    console.log('Auth interceptor: Added token to request');
  }
  
  return modifiedReq;
};
