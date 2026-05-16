import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import {
  TOKEN_KEY,
  USER_KEY,
  EXPIRY_KEY,
  clearAuthStorage,
  getStoredToken,
  isTokenValid,
} from '../../utils/authStorage';

const savedUser = localStorage.getItem(USER_KEY);
const savedToken = getStoredToken();

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser && isTokenValid() ? JSON.parse(savedUser) : null,
    token: isTokenValid() ? savedToken : null,
    loading: false,
    error: null,
    initialized: false,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      clearAuthStorage();
    },
    setInitialized: (state) => {
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
        let ms = 8 * 60 * 60 * 1000;
        const exp = action.payload.expiresIn;
        if (typeof exp === 'string' && exp.endsWith('h')) {
          ms = parseInt(exp, 10) * 60 * 60 * 1000;
        } else if (typeof exp === 'number') {
          ms = exp * 1000;
        }
        localStorage.setItem(EXPIRY_KEY, new Date(Date.now() + ms).toISOString());
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload));
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.token = null;
        clearAuthStorage();
      });
  },
});

export const { logout, setInitialized } = authSlice.actions;
export default authSlice.reducer;
