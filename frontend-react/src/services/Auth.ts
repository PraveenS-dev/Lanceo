import axios from "axios";

// Type definitions
export interface LoginData {
    email: string;
    password: string;
}

export interface UserData {
    id: string;
    name: string;
    username: string;
    email: string;
    role: number;
    isVerified: boolean;
    status: number;
    created_at: string;
}

export interface LoginResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

const API_BASE_URL = import.meta.env.VITE_NODE_BASE_URL;

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const apiMultipart = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

// Add request interceptor to include token
apiMultipart.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token expiration
apiMultipart.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Upload profile image
export const uploadProfileImage = async (file: File) => {
    try {
        const form = new FormData();
        form.append('image', file);
        const res = await apiMultipart.post('/updateProfileImage', form);
        return res.data;
    } catch (err: any) {
        throw err;
    }
};

// Upload cover image
export const uploadCoverImage = async (file: File) => {
    try {
        const form = new FormData();
        form.append('image', file);
        const res = await apiMultipart.post('/updateCoverImage', form);
        return res.data;
    } catch (err: any) {
        throw err;
    }
};

// Update profile info
export const updateProfileInfo = async (data: { name?: string; profile_description?: string; upi_id?: string }) => {
    try {
        const res = await apiClient.post('/updateProfileInfo', data);
        return res.data;
    } catch (err: any) {
        throw err;
    }
};

export const UserLogin = async (data: LoginData): Promise<LoginResponse> => {
    try {
        const res = await apiClient.post('/login', {
            email: data.email,
            password: data.password,
        });
        return res.data;
    } catch (err: any) {
        throw err;
    }
};

export const getCurrentUser = async (): Promise<{ success: boolean; user: UserData }> => {
    try {
        const res = await apiClient.get('/me');
        return res.data;
    } catch (err: any) {
        throw err;
    }
};

export const fetchUserById = async (id: string): Promise<{ userDetails: UserData }> => {
    try {
        const res = await apiClient.get(`/fetchUser?id=${id}`);
        return res.data;
    } catch (err: any) {
        throw err;
    }
};

export { apiClient, apiMultipart };
