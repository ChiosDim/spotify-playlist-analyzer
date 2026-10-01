import {createContext, useCallback, useEffect, useReducer} from 'react';
import { authApi } from '../api/client';
import { authReducer, initialState } from '../reducers/authReducer';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const refreshUser = useCallback(async () => {
    dispatch({ type: "LOADING" });
    try {
      const user = await authApi.me();
      if (user)
        dispatch({
          type: "AUTHENTICATED",
          payload: user,
        });
    } catch (err) {
      dispatch({ type: "ERROR", payload: err.message });
    }
  }, []);

  const loginWithSpotify = useCallback(() => {
    // Full-page navigation, not an API call — the backend redirects to Spotify
    window.location.href = authApi.spotifyLoginUrl();
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  // Load the user on first mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handler = () => dispatch({ type: "ANONYMOUS" });
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, []);

  const value = {
    user: state.user,
    status: state.status,
    error: state.error,
    isAuthenticated: state.status === "authenticated",
    refreshUser,
    loginWithSpotify,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}