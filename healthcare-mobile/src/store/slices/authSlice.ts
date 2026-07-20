import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, STORAGE_KEYS, clearTokens, extractApiError } from '../../api/client';
import { API } from '../../api/endpoints';
import { getDeviceId } from '../../utils/deviceId';
import type { AuthUser, LoginPayload, RegisterPayload, AuthResponse } from '../../types/auth.types';
import type { AuthState } from '../../types/authSlice.types';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  hydrated: false,
};

// The mobile app has no Admin experience — only Customer and Staff navigators exist.
// Admin accounts must be blocked here rather than falling through to CustomerNavigator,
// which would otherwise expose every customer's bookings/addresses/reports (the backend
// intentionally skips the customerUserId scope for ADMIN, correct for the web admin panel
// but not something the mobile client is equipped to present safely).
export const ADMIN_BLOCKED_MESSAGE =
  'Admin accounts cannot sign in from the mobile app. Please use the web admin panel.';

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const stored = await AsyncStorage.getMany([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.USER,
  ]);
  const userJson = stored[STORAGE_KEYS.USER];
  const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;

  if (user?.role === 'ADMIN') {
    await clearTokens();
    return { accessToken: null, user: null };
  }

  return {
    accessToken: stored[STORAGE_KEYS.ACCESS_TOKEN],
    user,
  };
});

export const login = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      // Normalise phone to E.164
      const stripped = payload.phone.replace(/\D/g, '');
      const local = stripped.startsWith('92') ? stripped.slice(2) : stripped.replace(/^0/, '');
      const phone = `+92${local}`;

      const { data } = await api.post<{ success: true; data: AuthResponse }>(
        API.AUTH.LOGIN,
        { phone, password: payload.password },
      );
      const { accessToken, refreshToken, user } = data.data;

      if (user.role === 'ADMIN') {
        return rejectWithValue(ADMIN_BLOCKED_MESSAGE);
      }

      await AsyncStorage.setMany({
        [STORAGE_KEYS.ACCESS_TOKEN]: accessToken,
        [STORAGE_KEYS.REFRESH_TOKEN]: refreshToken,
        [STORAGE_KEYS.USER]: JSON.stringify(user),
      });
      return { accessToken, user };
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      // Normalise phone to E.164 — same transform as login().
      const stripped = payload.phone.replace(/\D/g, '');
      const local = stripped.startsWith('92') ? stripped.slice(2) : stripped.replace(/^0/, '');
      const phone = `+92${local}`;

      const body: Record<string, unknown> = {
        fullName: payload.fullName,
        phone,
        password: payload.password,
      };
      if (payload.email) body.email = payload.email;

      const { data } = await api.post<{ success: true; data: AuthResponse }>(API.AUTH.REGISTER, body);
      const { accessToken, refreshToken, user } = data.data;
      await AsyncStorage.setMany({
        [STORAGE_KEYS.ACCESS_TOKEN]: accessToken,
        [STORAGE_KEYS.REFRESH_TOKEN]: refreshToken,
        [STORAGE_KEYS.USER]: JSON.stringify(user),
      });
      return { accessToken, user };
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    // Pass deviceId so the backend removes this device's push token on sign-out
    // (best-effort — logout proceeds regardless).
    const deviceId = await getDeviceId();
    await api.post(API.AUTH.LOGOUT, { deviceId });
  } catch {
    // ignore — clear locally regardless
  }
  await clearTokens();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
  },
  extraReducers: (builder) => {
    // hydrate
    builder.addCase(hydrateAuth.fulfilled, (state, { payload }) => {
      state.accessToken = payload.accessToken;
      state.user = payload.user;
      state.hydrated = true;
    });
    builder.addCase(hydrateAuth.rejected, (state) => {
      state.hydrated = true;
    });

    // login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.accessToken = payload.accessToken;
      state.user = payload.user;
    });
    builder.addCase(login.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload as string;
    });

    // register
    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.accessToken = payload.accessToken;
      state.user = payload.user;
    });
    builder.addCase(register.rejected, (state, { payload }) => {
      state.loading = false;
      state.error = payload as string;
    });

    // logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
    });
  },
});

export const { setAccessToken } = authSlice.actions;
export default authSlice.reducer;
