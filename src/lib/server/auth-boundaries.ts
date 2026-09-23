export function adminErrorStatus(error: string): 401 | 403 {
  return error === 'Authentication required' ? 401 : 403;
}
