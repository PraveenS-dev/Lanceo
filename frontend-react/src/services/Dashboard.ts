import { apiClient } from "./Auth";

export const getMonthWiseProjects = async (year?: string, userId?: string, role?: string) => {
  try {
    const response = await apiClient.get('/dashboard/MonthWiseProjects', {
      params: {
        year: year || new Date().getFullYear(),
        user_id: userId,
        role: role,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching month-wise projects:', error);
    throw error;
  }
};

export const getBittingsStats = async (userId?: string, role?: string, year?: string, month?: string) => {
  try {
    const response = await apiClient.get('/dashboard/BittingsStats', {
      params: {
        user_id: userId,
        role: role,
        year,
        month,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching bittings stats:', error);
    throw error;
  }
};

export const getContractsStats = async (userId?: string, role?: string, year?: string, month?: string) => {
  try {
    const response = await apiClient.get('/dashboard/ContractsStats', {
      params: {
        user_id: userId,
        role: role,
        year,
        month,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching contracts stats:', error);
    throw error;
  }
};

export const getTicketsStats = async (userId?: string, role?: string, year?: string, month?: string) => {
  try {
    const response = await apiClient.get('/dashboard/TicketsStats', {
      params: {
        user_id: userId,
        role: role,
        year,
        month,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tickets stats:', error);
    throw error;
  }
};

export const getTransactionStats = async (year?: string, month?: string, userId?: string, role?: string) => {
  try {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    if (userId) params.user_id = userId;
    if (role) params.role = role;

    const response = await apiClient.get('/dashboard/TransactionStats', {
      params: params,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    throw error;
  }
};