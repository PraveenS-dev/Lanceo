import { apiClient, apiMultipart } from "./Auth";

type ProjectData = {
    title: string,
    description: string,
    category: number,
    skills: string,
    attachment: File,
    experience: number,
    budget_type: number,
    estimated_budget: string | null,
    estimated_hour: string | null,
    deadline: Date,
    no_of_freelancer: number,
    milestone: string,
    spl_instruction: string,
    created_by: string,
}

type ProjecListtData = {
    title: string | null,
    description: string | null,
    category: number | null,
    skills: string | null,
    attachment: File | null,
    experience: number | null,
    budget_type: number | null,
    estimated_budget: string | null,
    estimated_hour: string | null,
    deadline: Date | null,
    no_of_freelancer: number | null,
    milestone: string | null,
    spl_instruction: string | null,
    created_by: string | null,
    user_role: string | null,
    user_id: string | null,
}

export const Store = async (data: ProjectData) => {
    try {
        const res = await apiMultipart.post('/projects/store', data);
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const Update = async (data: ProjectData) => {
    try {
        const res = await apiMultipart.post('/projects/update', data);
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const ProjNameUnique = async (value: string, id: string) => {
    try {
        const res = await apiClient.post('/projects/uniqueCheck', { title: value, id: id });

        if (res.data.data) {
            return true;
        } else {
            return "You already posted a project with this title";
        }
    } catch (error) {
        return "Something went wrong while checking title";
    }
}

export const ProjNameExistUnique = async (value: string, id: string, project_id: string) => {
    try {
        const res = await apiClient.post('/projects/ExistUniqueCheck', { title: value, id: id, project_id: project_id });

        if (res.data.data) {
            return true;
        } else {
            return "You already posted a project with this title";
        }
    } catch (error) {
        return "Something went wrong while checking title";
    }
}

export const getProjectListData = async (data: ProjecListtData) => {
    try {
        const res = await apiClient.get('/projects/list', { params: data });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const deleteItem = async (id: string) => {
    try {
        const res = await apiClient.post('/projects/delete', { id });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const getProjectData = async (id: string | undefined) => {
    try {
        const res = await apiClient.get('/projects/getData', { params: { id } });
        return res.data.data;
    } catch (err: any) {
        throw err;
    }
}

export const getAllProjectName = async () => {
    try {
        const res = await apiClient.get('/projects/getAllName');
        return res.data.data;
    } catch (err: any) {
        throw err;
    }
}

export const getAllNameBasedonRole = async (user_role: number, user_id: string) => {
    try {
        const res = await apiClient.get('/projects/getAllNameBasedonRole', { params: { user_role, user_id } });
        return res.data.data;
    } catch (err: any) {
        throw err;
    }
}