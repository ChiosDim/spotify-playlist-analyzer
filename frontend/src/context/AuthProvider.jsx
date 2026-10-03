import { useCallback, useEffect, useReducer } from "react";
import { authApi } from "../api/client";
import { authReducer, initialState } from "./authReducer";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const refreshUser = useCallback(async () => {
    dispatch({ type: "LOADING" });
    try {
      const user = await authApi.me();
      if (user) dispatch({ type: "AUTHENTICATED", payload: user });
      else dispatch({ type: "ANONYMOUS" });
    } catch (err) {
      dispatch({ type: "ERROR", payload: err.message });
    }
  }, []);

  const loginWithSpotify = useCallback(() => {
    window.location.href = authApi.spotifyLoginUrl();
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      dispatch({ type: "LOGOUT" });
    }
  }, []);

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
