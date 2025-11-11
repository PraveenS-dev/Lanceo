import { apiClient, apiMultipart } from "./Auth";

type ContractAttachmentData = {
    Contract_id: string,
    remarks: string,
    created_by: string,
    attachment: File,
    percentage: number,
}

type paymentData = {
    percentage: number,
    amount: string,
    contract_id: string,
    user_id: string,
}

type ContractListData = {
    user_role: string | null,
    project_id: string | null,
    user_id: string | null,
}

type ApprovalData = {
    Contract_id: string,
    remarks: string,
    action: string,
}

export const AttachmentSubmition = async (data: ContractAttachmentData) => {
    try {
        const res = await apiMultipart.post('/contracts/attachmentSubmittion', data);
        return res;
    } catch (err: any) {
        throw err;
    }
}
export const submitPayment = async (data: paymentData) => {
    try {
        const res = await apiClient.post('/contracts/submitPayment', data);
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const getContractListData = async (data: ContractListData) => {
    try {
        const res = await apiClient.get('/contracts/list', { params: data });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const deleteItem = async (id: string) => {
    try {
        const res = await apiClient.post('/contracts/delete', { id });
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const getContractData = async (contract_id: string | undefined) => {
    try {
        const res = await apiClient.get('/contracts/getData', { params: { contract_id } });
        return res.data.data;
    } catch (err: any) {
        throw err;
    }
}

export const ContractApproval = async (data: ApprovalData) => {
    try {
        const res = await apiClient.post('/contracts/approval',  data );
        return res;
    } catch (err: any) {
        throw err;
    }
}

export const getLastContract = async (id: string | undefined) => {
    try {
        const res = await apiClient.get('/contracts/getLastData', { params: { id } });
        if (res.data.data) {
            return false;
        }
        return true;
    } catch (err: any) {
        throw err;
    }
}

export const getContractAttachmentsByPercentage = async (
    contract_id: string,
    percentage: number
) => {
    try {
        const res = await apiClient.get('/contracts/getAllAttachment', {
            params: { contract_id, percentage }
        });
        return res.data.data as Array<{
            _id: string;
            file_name: string;
            extention: string;
            file_path: string;
            percentage: number;
            freelancer_remarks?: string;
            client_remarks?: string;
        }>;
    } catch (err: any) {
        throw err;
    }
}

export const getApprovalLogs = async (contract_id: string) => {
    try {
        const res = await apiClient.get('/contracts/approvalLogs', { params: { contract_id } });
        return res.data.data as Array<{
            _id: string;
            percentage: number;
            action: 1 | 0 | 2;
            remarks: string;
            acted_by?: string;
            acted_by_role?: number;
            created_at?: string;
            attachment_count?: number;
        }>;
    } catch (err: any) {
        throw err;
    }
}