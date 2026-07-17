export function decodeJWT(token: string) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    return payload.sub ? { id: payload.sub, email: payload.email } : null;
  } catch { return null; }
}

export function formatCredits(n: number): string {
  return n.toLocaleString();
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const PLAN_LIMITS: Record<string, { name: string; credits: number; price: number }> = {
  free: { name: 'Free', credits: 10, price: 0 },
  starter: { name: 'Starter', credits: 100, price: 9 },
  pro: { name: 'Pro', credits: 400, price: 29 },
  business: { name: 'Business', credits: 1500, price: 79 },
};
