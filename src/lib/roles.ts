// Centralized role helpers for SAINTRIX

export function isAdmin(
  user: { user_metadata?: { role?: string } } | null | undefined
): boolean {
  return !!user && user.user_metadata?.role === "admin";
}

export function isClient(
  user: { user_metadata?: { role?: string } } | null | undefined
): boolean {
  return !!user && user.user_metadata?.role === "client";
}

export function getUserRole(
  user: { user_metadata?: { role?: string } } | null | undefined
): "admin" | "client" | null {
  return (user?.user_metadata?.role as "admin" | "client" | null) || null;
}

export function isApproved(
  user: { user_metadata?: { approved?: boolean } } | null | undefined
): boolean {
  return user?.user_metadata?.approved !== false;
}
