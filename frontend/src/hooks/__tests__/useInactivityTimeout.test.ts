import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInactivityTimeout } from '../useInactivityTimeout';

vi.mock('../../services/configService', () => ({
  getAppConfigSync: () => ({
    errorMessageDuration: 3,
    successMessageDuration: 2,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    tokenExpirationHours: 16,
    inactivityTimeout: 0.01,
    inactivityWarningMinutes: 0.005,
    cartExpirationMinutes: 30,
    autoCleanExpiredCarts: true,
    autoCleanFinishedGameCarts: true,
    warnOnUnsavedForm: true,
    autoSaveDraftSeconds: 0,
    passwordResetTokenMinutes: 30,
    emailVerificationTokenHours: 24,
  }),
}));

describe('useInactivityTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('não dispara warning/timeout quando enabled=false', () => {
    const onTimeout = vi.fn();
    const onWarning = vi.fn();

    renderHook(() =>
      useInactivityTimeout({
        onTimeout,
        onWarning,
        enabled: false,
      })
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onWarning).not.toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('dispara warning e timeout quando enabled=true', () => {
    const onTimeout = vi.fn();
    const onWarning = vi.fn();

    const { result } = renderHook(() =>
      useInactivityTimeout({
        onTimeout,
        onWarning,
        enabled: true,
      })
    );

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(onWarning).toHaveBeenCalledTimes(1);
    expect(result.current.showWarning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('resetTimer posterga timeout quando há atividade', () => {
    const onTimeout = vi.fn();

    const { result } = renderHook(() =>
      useInactivityTimeout({
        onTimeout,
        enabled: true,
      })
    );

    act(() => {
      vi.advanceTimersByTime(250);
      result.current.resetTimer();
      vi.advanceTimersByTime(250);
    });

    expect(onTimeout).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
});
