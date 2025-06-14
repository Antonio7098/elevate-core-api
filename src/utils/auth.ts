export function generateToken(user: { id: number }) {
  // For testing, just return a dummy string
  return `test-token-for-user-${user.id}`;
} 