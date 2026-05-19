import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '../../types/auth.types';

export interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  isLoading: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ accessToken: string; user: UserProfile }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isInitialized = true;
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    setUser(state, action: PayloadAction<UserProfile | null>) {
      state.user = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setInitialized(state, action: PayloadAction<boolean>) {
      state.isInitialized = action.payload;
    },
    clearAuth(state) {
      state.accessToken = null;
      state.user = null;
      state.isInitialized = true;
    },
  },
});

export const { setAuth, setAccessToken, setUser, setLoading, setInitialized, clearAuth } = authSlice.actions;
export default authSlice.reducer;
