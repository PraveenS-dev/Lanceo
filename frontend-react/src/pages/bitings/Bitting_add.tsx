import { useForm, type SubmitHandler } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { ShowToast } from '../../utils/showToast';
import Submit_btn from '../../components/Buttons/Submit_btn';
import "flatpickr/dist/flatpickr.min.css";
import { Store } from '../../services/Bittings';

type FormInputs = {
    budget: string,
    message: string,
}

type Props = {
    setBittingVisible: (visible: boolean) => void,
    project_id: string
    fetchLastBitData: () => void,
}

const Bitting_add: React.FC<Props> = ({ setBittingVisible, project_id, fetchLastBitData }) => {
    const { register, reset, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInputs>({ mode: "onChange" });
    const { user } = useAuth();

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {

            const formData = new FormData();

            Object.entries(data).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach((v) => formData.append(`${key}[]`, String(v)));
                } else if (value !== null && value !== undefined) {
                    formData.append(key, String(value));
                }
            });

            formData.append("project_id", String(project_id));
            formData.append("created_by", String(user?.id));

            await Store(formData as any);

            ShowToast("Bit added successfully!", "success")
            setBittingVisible(false)
            fetchLastBitData()
            reset();
        } catch (err: any) {
            ShowToast(err.response?.data?.message || "Something went wrong", "error")

        }
    }

    return (
        <div className='w-full max-h-[70vh] md:w-auto bg-white dark:bg-gray-800 rounded-t-xl md:rounded-2xl border flex flex-col'>

            <div className='flex justify-between p-3 bg-red-300 dark:bg-red-600/30'>
                <h3 className='text-xl md:text-2xl font-bold'>Bitting</h3>
                <button onClick={() => setBittingVisible(false)} className="text-xl px-2 dark:text-white cursor-pointer">x</button>
            </div>

            <div className='px-3 overflow-auto pb-3'>
                <form onSubmit={handleSubmit(onSubmit)}>

                    <div className='grid grid-cols-1 gap-4 mt-3'>
                        <div className="mt-3">
                            <label htmlFor="budget" className="form-label">Budget</label>
                            <input
                                type="text" className="form-control" id='budget'
                                {...register("budget", {
                                    required: "budget is required",
                                })}
                            />

                            {errors.budget && (<span className="text-red-500 mt-1 text-sm"> {errors.budget.message}</span>)}
                        </div>

                        <div className="mt-3">
                            <label htmlFor="message" className='form-label'>Message</label>
                            <textarea id="message" className='form-control' rows={8}
                                {...register("message",
                                    {
                                        required: "message is required!",
                                        minLength: {
                                            value: 2,
                                            message: "message must be minimum 2 characters length!"
                                        }
                                    })}></textarea>

                            {errors.message && (<span className="text-red-500 mt-1 text-sm"> {errors.message.message}</span>)}

                        </div>
                    </div>

                    <div className='flex justify-end mt-5 mb-6'>
                        <Submit_btn isSubmitting={isSubmitting} />
                    </div>
                </form>
            </div>

        </div>
    )
}

export default Bitting_add