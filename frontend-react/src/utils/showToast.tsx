import toast from "react-hot-toast";
import CustomToast, {type ToastType } from "../components/CustomToast";

export const ShowToast = (message: string, type: ToastType = "info") => {
    toast.custom(() =>
        <CustomToast message={message} type={type} />, {
        duration: 3000,
        position: "top-right",
    }
    );
}