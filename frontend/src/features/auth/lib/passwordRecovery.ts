export type PasswordRecoveryState = {
  requestId: string;
  email: string;
  resetToken?: string;
};

const RECOVERY_KEY = 'campusHub.auth.passwordRecovery';

export function savePasswordRecovery(state: PasswordRecoveryState) {
  window.sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(state));
}

export function getPasswordRecovery(): PasswordRecoveryState | null {
  const raw = window.sessionStorage.getItem(RECOVERY_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PasswordRecoveryState>;
    if (
      typeof parsed.requestId !== 'string' ||
      typeof parsed.email !== 'string'
    ) {
      return null;
    }
    return {
      requestId: parsed.requestId,
      email: parsed.email,
      resetToken:
        typeof parsed.resetToken === 'string' ? parsed.resetToken : undefined,
    };
  } catch {
    return null;
  }
}

export function clearPasswordRecovery() {
  window.sessionStorage.removeItem(RECOVERY_KEY);
}
