import Constants from 'expo-constants';

type GoogleExtra = {
  googleWebClientId?: string;
  googleAndroidClientId?: string;
  googleIosClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as GoogleExtra;

let googleModule: any | null | false = null;

function loadGoogleModule(): any | null {
  if (googleModule === false) return null;
  if (googleModule) return googleModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-google-signin/google-signin');
    googleModule = mod;
    return mod;
  } catch (e) {
    googleModule = false;
    return null;
  }
}

let configured = false;

export function configureGoogleSignIn() {
  if (configured) return;
  const mod = loadGoogleModule();
  if (!mod) return;
  try {
    mod.GoogleSignin.configure({
      webClientId: extra.googleWebClientId,
      iosClientId: extra.googleIosClientId,
      offlineAccess: false,
      forceCodeForRefreshToken: false,
    });
    configured = true;
  } catch (e) {
    console.warn('GoogleSignin.configure failed:', e);
  }
}

export function isGoogleSignInAvailable(): boolean {
  return loadGoogleModule() !== null;
}

export type GoogleSignInResult = {
  idToken: string;
  email: string;
  name: string | null;
  photo: string | null;
};

export async function signInWithGoogle(): Promise<GoogleSignInResult | null> {
  const mod = loadGoogleModule();
  if (!mod) {
    throw new Error(
      'تسجيل دخول Google غير متاح في Expo Go. الرجاء استخدام رقم الهاتف، أو تشغيل التطبيق عبر dev-build.',
    );
  }
  configureGoogleSignIn();
  const { GoogleSignin, statusCodes, isErrorWithCode } = mod;
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    try {
      await GoogleSignin.signOut();
    } catch {
    }
    const response = await GoogleSignin.signIn();
    if (response?.type === 'cancelled') return null;
    const data = response?.data;
    if (!data?.idToken) {
      throw new Error('Google sign-in returned no idToken');
    }
    return {
      idToken: data.idToken,
      email: data.user?.email ?? '',
      name: data.user?.name ?? null,
      photo: data.user?.photo ?? null,
    };
  } catch (error: unknown) {
    if (isErrorWithCode && isErrorWithCode(error)) {
      if (
        (error as any).code === statusCodes.SIGN_IN_CANCELLED ||
        (error as any).code === statusCodes.IN_PROGRESS
      ) {
        return null;
      }
    }
    throw error;
  }
}

export async function signOutGoogle() {
  const mod = loadGoogleModule();
  if (!mod) return;
  try {
    configureGoogleSignIn();
    await mod.GoogleSignin.signOut();
  } catch {
  }
}
