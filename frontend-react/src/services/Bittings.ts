import { apiClient } from "./Auth";

type BittingData = {
    budget: string,
    message: string,
    created_by: string,
}

type BittingListtData = {
    budget: string | null,
    message: string | null,
    user_id: string | null,
}

type ApprovalData = {
    bitting_id: string,
    reason: string,
    action: string,
}

export const Store = async (data: BittingData) => {
    try {
        const res = await apiClient.post('/bittings/store', data);
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const getBittingListData = async (data: BittingListtData) => {
    try {
        const res = await apiClient.get('/bittings/list', { params: data });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const deleteItem = async (id: string) => {
    try {
        const res = await apiClient.post('/bittings/delete', { id });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const getBittingData = async (project_id: string, user_id: string | undefined) => {
    try {
        const res = await apiClient.get('/bittings/getData', { params: { project_id, user_id } });
        return res.data.data;
    } catch (err: any) {
        throw err;
    }
}

export const getLastBittingData = async (id: string | undefined) => {
    try {
        const res = await apiClient.get('/bittings/getLastData', { params: { id } });
        return res.data.data;
    } catch (err: any) {
        throw err;
    }
}

export const bittingApproval = async (data: ApprovalData) => {
    try {
        const res = await apiClient.post('/bittings/approval',  data );
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const getLastBitting = async (id: string | undefined) => {
    try {
        const res = await apiClient.get('/bittings/getLastData', { params: { id } });
        if (res.data.data) {
            return false;
        }
        return true;
    } catch (err: any) {
        throw err;
    }
}