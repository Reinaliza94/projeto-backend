import { useState } from "react";
import { createSession } from "../api/client";
import AuthContext from "./auth-context";

const TOKEN_STORAGE_KEY = "drip-store-token";

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() =>
        window.localStorage.getItem(TOKEN_STORAGE_KEY)
    );

    async function login(email, password) {
        const session = await createSession({ email, password });
        window.localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
        setToken(session.token);
    }

    function logout() {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
    }

    return (
        <AuthContext.Provider value={{ token, isAuthenticated: Boolean(token), login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
