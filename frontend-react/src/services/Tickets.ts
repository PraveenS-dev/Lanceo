import { apiClient } from "./Auth";

type StoreData = {
    contract_id: String,
    reason: Number,
    remarks: String,
    created_by: String,
}

type ListData = {
    project_id: String,
    created_by: String,
    user_role: String,
    user_id: String,
    type: Number,
}

export const Store = async (data: StoreData) => {
    try {
        const res = await apiClient.post('/tickets/store', data);
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const getListData = async (data: ListData) => {
    try {
        const res = await apiClient.get('/tickets/list', { params: data });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const deleteItem = async (id: string) => {
    try {
        const res = await apiClient.post('/tickets/delete', { id });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const getData = async (ticket_id: string | undefined) => {
    try {
        const res = await apiClient.get('/tickets/getData', { params: { ticket_id } });
        return res.data.data;
    } catch (err: any) {
        throw err;
    }
}

export const CheckTicketExist = async (contract_id: string | undefined) => {
    try {
        const res = await apiClient.get('/tickets/getExitData', { params: { contract_id } });
        return res.data.data ? true : false;
    } catch (err: any) {
        throw err;
    }
}
