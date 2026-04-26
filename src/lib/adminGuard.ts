/** Shared admin guard — import this instead of AdminPanel to avoid bundle split issues */
export const ADMIN_EMAIL = 'anandakiccha240@gmail.com';

export function isAdmin(email: string | undefined): boolean {
  return email?.toLowerCase().trim() === ADMIN_EMAIL;
}
