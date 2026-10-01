export const initialState = {
  user: null,
  status: "loading", // "loading" | "authenticated" | "anonymous" | "error"
  error: null,
};

export function authReducer(state, action) {
  switch (action.type) {
    case "LOADING":
      return { ...state, status: "loading", error: null };
    case "AUTHENTICATED":
      return { user: action.payload, status: "authenticated", error: null };
    case "ANONYMOUS":
      return { user: null, status: "anonymous", error: null };
    case "ERROR":
      return { ...state, status: "error", error: action.payload };
    case "LOGOUT":
      return { user: null, status: "anonymous", error: null };
    default:
      return state;
  }
}
