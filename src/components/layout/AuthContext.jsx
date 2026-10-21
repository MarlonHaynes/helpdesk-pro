import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { observeAuthState, getUserRole, logout as doLogout } from "../../services/authService";
import { ROLES, can as roleCan, isStaffRole } from "../../auth/roles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const hydrate = useCallback(async (user) => {
    if (!user) {
      setCurrentUser(null);
      setRole(null);
      setProfile(null);
      return;
    }
    setCurrentUser(user);
    const resolvedRole = await getUserRole(user);
    setRole(resolvedRole);
    // Best-effort profile load; rules allow a user to read their own doc.
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsub = observeAuthState(async (user) => {
      await hydrate(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [hydrate]);

  const logout = useCallback(async () => {
    await doLogout();
  }, []);

  const value = {
    currentUser,
    role,
    profile,
    authLoading,
    isAuthenticated: !!currentUser,
    isStaff: isStaffRole(role),
    isAdmin: role === ROLES.ADMIN,
    can: (permission) => roleCan(role, permission),
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
