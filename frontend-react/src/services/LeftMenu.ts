import { apiClient } from "./Auth";

type LeftMenuData = {
    name: string,
    link: string,
    role: string,
    icon: string | null,
    isParent: number,
    parentId: string,
    sort_order: number,
    created_by: string,
}

type LeftMenuListtData = {
    name: string | null,
    link: string | null,
    role: string | null,
    icon: string | null,
    isParent: number | null,
    parentId: string | null,
    sort_order: number | null,
    created_by: string | null,
}

export const Store = async (data: LeftMenuData) => {
    try {
        const res = await apiClient.post('/LeftMenu/store', data);
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const Update = async (data: LeftMenuData) => {
    try {
        const res = await apiClient.post('/LeftMenu/update', data);
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const MenuNameUnique = async (value: string) => {
    try {
        const res = await apiClient.post('/LeftMenu/uniqueCheck', { title: value });

        if (res.data.data) {
            return true;
        } else {
            return "You already posted a LeftMenu with this title";
        }
    } catch (error) {
        return "Something went wrong while checking title";
    }
}

export const MenuNameExistUnique = async (value: string, LeftMenu_id: string) => {
    try {
        const res = await apiClient.post('/LeftMenu/ExistUniqueCheck', { title: value, LeftMenu_id: LeftMenu_id });

        if (res.data.data) {
            return true;
        } else {
            return "You already posted a LeftMenu with this title";
        }
    } catch (error) {
        return "Something went wrong while checking title";
    }
}

export const getLeftMenuListData = async (data: LeftMenuListtData) => {
    try {
        const res = await apiClient.get('/LeftMenu/list', { params: data });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const getLeftMenuAllData = async (user_role: number) => {
    try {
        const res = await apiClient.get('/LeftMenu/getAllData', { params: { user_role } });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const deleteItem = async (id: string) => {
    try {
        const res = await apiClient.post('/LeftMenu/delete', { id });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const getLeftMenuData = async (id: string | undefined) => {
    try {
        const res = await apiClient.get('/LeftMenu/getData', { params: { id } });
        return res.data.data;
    } catch (err: any) {
        throw err;
    }
}

export const getAllParents = async () => {
    try {
        const res = await apiClient.get('/LeftMenu/getAllParents');
        return res.data.data;
    } catch (err: any) {
        throw err;
    }
}