// Phone features inside the FunlyLearn app (Capacitor). The app opens
// the live website, and Capacitor gives the website access to these
// phone features through window.Capacitor. On the normal website they
// simply do nothing.

function plugins(): any | null {
  const cap = (window as any).Capacitor;
  if (!cap || typeof cap.isNativePlatform !== 'function' || !cap.isNativePlatform()) return null;
  return cap.Plugins || null;
}

export function isInsideApp(): boolean {
  return Boolean(plugins()) || navigator.userAgent.includes('FunlyLearnApp');
}

// FunlyLearn-green status bar with white icons, and hide the splash.
export function setupAppChrome(): void {
  const p = plugins();
  if (!p) return;
  try { p.StatusBar?.setBackgroundColor?.({ color: '#064E3B' }); } catch (_e) {}
  try { p.StatusBar?.setStyle?.({ style: 'DARK' }); } catch (_e) {}
  try { p.SplashScreen?.hide?.(); } catch (_e) {}
}

// The phone's own share menu, from inside the app. Returns false if the
// share feature isn't available (e.g. on the website).
export async function shareFromApp(data: { title: string; text: string; url: string }): Promise<boolean> {
  const p = plugins();
  if (!p?.Share?.share) return false;
  try {
    await p.Share.share({ title: data.title, text: data.text, url: data.url, dialogTitle: 'Share FunlyLearn' });
  } catch (_e) {
    // Closing the share menu counts as an error here; nothing to do.
  }
  return true;
}

// Listen for the phone's back button. Returns a function that stops listening.
export function onPhoneBackButton(handler: () => void): () => void {
  const p = plugins();
  if (!p?.App?.addListener) return () => {};
  const listener = p.App.addListener('backButton', handler);
  return () => {
    Promise.resolve(listener).then((l: any) => l?.remove?.()).catch(() => {});
  };
}

export function closeApp(): void {
  try { plugins()?.App?.exitApp?.(); } catch (_e) {}
}
