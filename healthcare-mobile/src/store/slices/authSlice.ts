import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, STORAGE_KEYS, clearTokens, extractApiError } from '../../api/client';
import { API } from '../../api/endpoints';
import type { AuthUser, LoginPayload, AuthResponse } from '../../types/auth.types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  hydrated: false,
};

export const hydrateAuth = createAsyncThunk('auth/hydrate', async () => {
  const [token, userJson] = await AsyncStorage.multiGet([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.USER,
  ]);
  return {
    accessToken: token[1],
    user: userJson[1] ? (JSON.parse(userJson[1]) as AuthUser) : null,
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
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
        [STORAGE_KEYS.USER, JSON.stringify(user)],
      ]);
      return { accessToken, user };
    } catch (err) {
      return rejectWithValue(extractApiError(err));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post(API.AUTH.LOGOUT);
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

    // logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
    });
  },
});

export const { setAccessToken } = authSlice.actions;
export default authSlice.reducer;
