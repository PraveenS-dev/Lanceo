import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { getContractData, submitPayment } from "../../services/Contract";
import DarkModeSelect from "../../components/DarkModeSelect";
import Back_btn from "../../components/Buttons/Back_btn";
import BrudCrumbs from "../../components/BrudCrumbs";
import { ShowToast } from "../../utils/showToast";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient } from "../../services/Auth";

interface ContractType {
    _id: string;
    budget: number;
    payed_percentage: number;
    payed_amount: number;
}

interface FormValues {
    percent: number | { value: number; label: string } | null;
}

const Payment = () => {
    const { contract_id } = useParams<{ contract_id: string }>();
    const [contract, setContract] = useState<ContractType | null>(null);
    const [availablePercents, setAvailablePercents] = useState<
        { value: number; label: string }[]
    >([]);

	const { control, watch, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
        defaultValues: { percent: null },
    });
    const navigate = useNavigate();
	const [isRazorpayReady, setIsRazorpayReady] = useState(false);

    const selectedPercent = watch("percent");
    const { user } = useAuth();

    const crumbs = [
        { label: "Home", path: "/dashboard" },
        { label: "Payment" },
    ];
    // 🧠 Fetch contract data
    useEffect(() => {
        const fetchContract = async () => {
            try {
                const res = await getContractData(contract_id);
                setContract(res);

                const allPercents = [25, 50, 75, 100];
                const prevPercent = res.payed_percentage || 0;
                const available = allPercents
                    .filter((p) => p > prevPercent)
                    .map((p) => ({ value: p, label: `${p}%` }));
                setAvailablePercents(available);
            } catch (error) {
                console.error("Error fetching contract:", error);
            }
        };

        fetchContract();
    }, [contract_id]);

	// Load Razorpay checkout script once
	useEffect(() => {
		if ((window as any).Razorpay) {
			setIsRazorpayReady(true);
			return;
		}
		const script = document.createElement("script");
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.async = true;
		script.onload = () => setIsRazorpayReady(true);
		script.onerror = () => {
			setIsRazorpayReady(false);
			ShowToast("Failed to load Razorpay. Check your network.", "error");
		};
		document.body.appendChild(script);
		return () => {
			// don't remove script globally; leaving it is safe for SPA navigation
		};
	}, []);

    const payableAmount = useMemo(() => {
        if (!contract || !selectedPercent) return 0;

        const selVal = Number(
            typeof selectedPercent === "object" && selectedPercent !== null
                ? (selectedPercent as any).value
                : selectedPercent
        );

        const prevPercent = Number(contract.payed_percentage || 0);
        const diffPercent = selVal - prevPercent;
        const budget = Number(contract.budget || 0);
        return diffPercent > 0 ? (diffPercent / 100) * budget : 0;
    }, [contract, selectedPercent]);



	const onSubmit = async () => {
        if (!selectedPercent || !contract) return;
		if (!isRazorpayReady || !(window as any).Razorpay) {
			ShowToast("Payment system isn't ready yet. Please wait a moment.", "error");
			return;
		}

		const percentToSend =
            typeof selectedPercent === "object" && selectedPercent
                ? (selectedPercent as any).value
                : selectedPercent;

		const paymentPayload = {
			contract_id: contract._id,
			user_id: String(user?.id),
			percentage: Number(percentToSend),
			amount: String(payableAmount.toFixed(2)), // server expects string in rupees
		};

		try {
			// Amount must be in paise for Razorpay
			const amountInPaise = Math.round(Number(payableAmount) * 100);
			if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
				ShowToast("Minimum payable is ₹1.00", "error");
				return;
			}

			// 1️⃣ Create order from backend (expects integer paise)
			const createOrderResp = await apiClient.post("/contracts/razorpay/create-order", {
				amount: amountInPaise,
				currency: "INR",
				// do not send long receipt; server will generate a safe one
				notes: { contract_id: contract._id, percentage: String(percentToSend) },
			});
			const order = createOrderResp?.data?.order || createOrderResp?.data;
			if (!order?.id || !order?.amount) {
				ShowToast("Invalid order response from server.", "error");
				return;
			}

			const keyId = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
			if (!keyId) {
				ShowToast("Razorpay key is missing. Set VITE_RAZORPAY_KEY_ID.", "error");
				return;
			}

			// 2️⃣ Open Razorpay checkout popup
			const options = {
				key: keyId,
				amount: order.amount, // already in paise
				currency: order.currency || "INR",
				name: "Lanceo Platform",
				description: "Freelancer Payment",
				order_id: order.id,
				handler: async function (response: any) {
					try {
						const verifyRes = await apiClient.post("/contracts/razorpay/verify-payment", response);
						const verified = Boolean(verifyRes?.data?.verified || (verifyRes?.data?.message || "").toLowerCase().includes("verified"));
						if (verified) {
							await submitPayment(paymentPayload);
							ShowToast("Payment successful!", "success");
							navigate(`/contracts/view/${contract._id}`);
						} else {
							ShowToast("Payment verification failed!", "error");
						}
					} catch (e) {
						ShowToast("Error verifying payment.", "error");
					}
				},
				prefill: {
					name: user?.name,
					email: user?.email,
				},
				notes: {
					contract_id: contract._id,
					percentage: String(percentToSend),
				},
				theme: { color: "#3399cc" },
			};

			const rzp = new (window as any).Razorpay(options);
			rzp.on("payment.failed", function (resp: any) {
				ShowToast(resp?.error?.description || "Payment failed.", "error");
			});
			rzp.open();
		} catch (err) {
			ShowToast("Something went wrong with Razorpay payment!", "error");
		}
    };

    if (!contract) return <p className="text-center mt-10">Loading contract...</p>;

    return (
        <div>
            <BrudCrumbs crumbs={crumbs} />

            <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
                <h3 className='text-2xl font-bold'>Contract View</h3>
                <Back_btn url={`/contracts/view/${contract._id}`} />
            </div>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="max-w-xl mx-auto bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-md mt-10"
            >
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                    Payment for Contract #{contract._id}
                </h2>

                <div className="mb-4 space-y-1">
                    <p className="text-gray-600 dark:text-gray-300">
                        <strong>Total Budget:</strong> ₹
                        {contract?.budget ? contract.budget.toLocaleString() : "0"}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                        <strong>Already Paid:</strong> {contract?.payed_percentage ?? 0}% (
                        ₹{contract?.payed_amount
                            ? contract.payed_amount.toLocaleString()
                            : "0"}
                        )
                    </p>
                </div>

                <label className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
                    Select Payment Percentage:
                </label>
                <Controller
                    name="percent"
                    control={control}
                    render={({ field }) => (
                        <DarkModeSelect
                            {...field}
                            options={availablePercents}
                            placeholder="Select percentage..."
                        />
                    )}
                />

                {selectedPercent && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                        <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                            Payable Amount: ₹
                            {payableAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                            })}
                        </p>
                    </div>
                )}

				<button
                    type="submit"
					disabled={!selectedPercent || isSubmitting || !isRazorpayReady}
                    className={`mt-6 w-full py-2 rounded-xl font-semibold transition-all duration-300 ${selectedPercent
						? (isRazorpayReady ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-400 text-gray-200 cursor-not-allowed")
						: "bg-gray-400 text-gray-200 cursor-not-allowed"
                        }`}
                >
					{isSubmitting ? "Processing..." : (isRazorpayReady ? "Proceed to Payment" : "Loading payment...")}
                </button>
            </form>
        </div>
    );
};

export default Payment;
