import { apiClient } from "./Auth";

type TransactionListData = {
    project_id: String,
    created_by: String,
    user_role: String,
    user_id: String,
    type: Number,
}

export const getListData = async (data: TransactionListData) => {
    try {
        const res = await apiClient.get('/transactions/list', { params: data });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const deleteItem = async (id: string) => {
    try {
        const res = await apiClient.post('/transactions/delete', { id });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const getData = async (transaction_id: string | undefined) => {
    try {
        const res = await apiClient.get('/transactions/getData', { params: { transaction_id } });
        return res.data.data;
    } catch (err: any) {
        throw err;
    }
}
