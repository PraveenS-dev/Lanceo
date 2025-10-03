import apiClient from "./Auth";

type ProjectData = {
    title: string,
    description: string,
    category: number,
    skills: number[],
    attachment: File,
    experience: number,
    budget_type: number,
    estimated_budget: string | null,
    estimated_hour: string | null,
    deadline: string,
    no_of_freelancer: number,
    milestone: string,
    spl_instruction: string,
}

export const Store = async (data: ProjectData) => {
    try {
        const res = await apiClient.post('/projects/add', { data: data });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const ProjNameUnique = async (value: string, id: string) => {
    try {
        const res = await apiClient.post('/projects/uniqueCheck', { title: value, id: id });
        if (res.data.success) {
            return true;
        } else {
            return "You already posted a project with this title";
        }
    } catch (error) {
        return "Something went wrong while checking title";
    }
}