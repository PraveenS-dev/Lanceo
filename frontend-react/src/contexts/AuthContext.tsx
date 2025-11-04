import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type UserData, getCurrentUser } from '../services/Auth';

interface AuthContextType {
    user: UserData | null;
    loading: boolean;
    error: string | null;
    login: (userData: UserData, token: string) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAuthenticated = !!user;

    const login = (userData: UserData, token: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setError(null);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setError(null);
    };

    const refreshUser = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getCurrentUser();
            if (response.success) {
                setUser(response.user);
                localStorage.setItem('user', JSON.stringify(response.user));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch user data');
            logout();
        } finally {
            setLoading(false);
        }
    };

    // useEffect(() => {
    //     const initializeAuth = async () => {
    //         const token = localStorage.getItem('token');
    //         const storedUser = localStorage.getItem('user');

    //         if (token && storedUser) {
    //             try {
    //                 const userData = JSON.parse(storedUser);
    //                 setUser(userData);

    //                 // Verify token is still valid by fetching current user
    //                 await refreshUser();
    //             } catch (err) {
    //                 console.error('Error initializing auth:', err);
    //                 logout();
    //             }
    //         } else {
    //             setLoading(false);
    //         }
    //     };

    //     initializeAuth();
    // }, []);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                try {
                    // 🧠 Don't set user here immediately
                    await refreshUser(); // this will set the real user
                } catch (err) {
                    console.error('Error initializing auth:', err);
                    logout();
                }
            } else {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);


    const value: AuthContextType = {
        user,
        loading,
        error,
        login,
        logout,
        refreshUser,
        isAuthenticated,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
