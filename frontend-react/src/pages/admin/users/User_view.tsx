import { useEffect, useState, useRef, useCallback } from "react";
import { fetchUserById, uploadProfileImage, uploadCoverImage, fetchReviewById } from "../../../services/Auth";
import BrudCrumbs from "../../../components/BrudCrumbs";
import { motion } from "framer-motion";
import { Calendar, Mail, Shield, Wallet, Edit, Star } from "lucide-react";
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../../utils/cropHelper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import { Dialog } from "@headlessui/react";
import { displayDateFormat } from "../../../services/Helpers";
import { useParams } from "react-router-dom";

const User_View = () => {

    const { user_id } = useParams<({ user_id: string })>();
    const [editData, setEditData] = useState<any>(null);
    const [reviewData, setReviewData] = useState<any>(null);
    // Image crop/upload states
    const [showCrop, setShowCrop] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [currentType, setCurrentType] = useState<'profile' | 'cover' | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formUpi, setFormUpi] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [reviewDialog, setReviewDialog] = useState(false);

    const crumbs = [
        { label: "Home", path: "/dashboard" },
        { label: "Profile" },
    ];

    const fetchData = async () => {
        if (!user_id) return;
        const res = await fetchUserById(user_id);
        setEditData(res.userDetails);
    };

    const fetchReviewData = async () => {
        const ReviewData = await fetchReviewById(editData?._id, editData?.role);
        // Convert backend shape to usable array
        if (ReviewData && ReviewData.name) {
            const formatted = ReviewData.name.map((user_name: string, i: number) => ({
                name: user_name,
                profile_url: ReviewData.profile_url[i],
                rating: ReviewData.rating[i],
                review: ReviewData.review[i],
            }));
            setReviewData(formatted);
        } else {
            setReviewData([]);
        }

        console.log('Formatted Reviews:', ReviewData);
    };

    const openEditProfileModal = () => {
        setFormName(editData?.name || '');
        setFormDescription(editData?.profile_description || '');
        setFormUpi(editData?.upi_id || '');
        setShowEditProfileModal(true);
    };

    const saveProfileInfo = async () => {
        setSavingProfile(true);
        try {
            const payload: any = { name: formName, profile_description: formDescription, upi_id: formUpi };
            // import service function dynamically to avoid circular issues
            const { updateProfileInfo } = await import('../../../services/Auth');
            await updateProfileInfo(payload);
            const res = await fetchUserById(user_id as string);
            setEditData(res.userDetails);
            setShowEditProfileModal(false);
        } catch (err) {
            console.error('Save profile failed', err);
        } finally {
            setSavingProfile(false);
        }
    };

    const openImageDialog = (type: 'profile' | 'cover') => {
        setCurrentType(type);
        inputRef.current?.click();
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageSrc(reader.result as string);
            setShowCrop(true);
        });
        reader.readAsDataURL(file);
    };

    const onCropComplete = useCallback((_: any, croppedAreaPixelsLocal: any) => {
        setCroppedAreaPixels(croppedAreaPixelsLocal);
    }, []);

    const submitCroppedImage = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        setIsUploading(true);
        try {
            const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!blob) throw new Error('Failed to crop image');

            const file = new File([blob], `${currentType}_${Date.now()}.jpg`, { type: 'image/jpeg' });

            if (currentType === 'profile') {
                await uploadProfileImage(file);
            } else {
                await uploadCoverImage(file);
            }
            const res = await fetchUserById(user_id as string);
            setEditData(res.userDetails);

            // close
            setShowCrop(false);
            setImageSrc(null);
            setCurrentType(null);
        } catch (err) {
            console.error('Upload failed', err);
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user_id]);

    useEffect(() => {
        fetchReviewData();
    }, [user_id, editData]);

    console.log(reviewData);

    if (!editData)
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                    Loading profile...
                </p>
            </div>
        );

    // ✅ Default placeholder images
    const defaultCover =
        "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1350&q=80";
    const defaultProfile =
        "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    return (
        <div className="custom-scrollbar pb-10 w-full">
            <BrudCrumbs crumbs={crumbs} />

            <div className="relative sm:h-84 h-90 w-full rounded-xl  mt-4 shadow-md">
                <img
                    src={editData.cover_url ? `${import.meta.env.VITE_NODE_BASE_URL}${editData.cover_url}` : defaultCover}
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
                {/* Hidden file input used for both profile and cover */}
                <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                {/* Cover edit button (ensure it's above the overlay) */}
                <button
                    onClick={() => openImageDialog('cover')}
                    className="absolute top-4 right-4 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full shadow hover:scale-105 transition-all z-20"
                    title="Change cover"
                >
                    <Edit size={18} />
                </button>
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent"></div>

                {/* Profile Image & Info */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute -bottom-20 left-6 flex items-center space-x-5"
                >
                    <div className="relative">
                        <img
                            src={editData.profile_url ? `${import.meta.env.VITE_NODE_BASE_URL}${editData.profile_url}` : defaultProfile}
                            alt="Profile"
                            className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-2xl object-cover"
                        />
                        {/* Profile edit button */}
                        <button
                            onClick={() => openImageDialog('profile')}
                            className="absolute -right-0 bottom-3 bg-white text-black p-1 rounded-full shadow hover:scale-105 transition-all"
                            title="Change profile"
                        >
                            <Edit size={16} />
                        </button>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-10">
                            {editData.name}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                            @{editData.username}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* 🧊 Profile Info Card */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg shadow-xl mt-28 sm:mt-32 rounded-2xl p-6 max-w-6xl mx-auto border border-gray-200/40 dark:border-gray-700/60"
            >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-300/50 dark:border-gray-700/50 pb-2">
                    Profile Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                    <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                        <Mail className="text-blue-500" size={20} />
                        <span>{editData.email}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                        <Shield className="text-green-500" size={20} />
                        <span>
                            Role: {editData.role === 2 ? "Freelancer" : "Client"}
                        </span>
                    </div>

                    <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                        <Wallet className="text-purple-500" size={20} />
                        <span>UPI ID: {editData.upi_id || "Not Added"}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                        <Calendar className="text-orange-500" size={20} />
                        <span>Joined: {displayDateFormat(editData.created_at)}</span>
                    </div>
                </div>

                {/* 🧾 About Section */}
                {editData.profile_description && (
                    <div className="mt-6">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            About
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-justify">
                            {editData.profile_description}
                        </p>
                    </div>
                )}

                {/* ✏️ Edit Button */}
                <div className="flex justify-end mt-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={openEditProfileModal}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md transition-all cursor-pointer"
                    >
                        Edit Profile
                    </motion.button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg shadow-xl mt-2 sm:mt-6 rounded-2xl p-6 max-w-sm md:max-w-md lg:max-w-2xl xl:max-w-5xl 2xl:max-w-6xl mx-auto border border-gray-200/40 dark:border-gray-700/60"
            >
                <div className="flex justify-between">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white  dark:border-gray-700/50 pb-2">
                        Reviews
                    </h3>
                    <button
                        onClick={() => setReviewDialog(true)}
                        className="relative flex items-center font-medium cursor-pointer group transition-all duration-300 ease-in-out text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300"
                    >
                        {/* Icon wrapper */}
                        <span
                            className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] transition-all duration-300
                                border border-yellow-500/70 shadow-[0_0_6px_rgba(234,179,8,0.5)] group-hover:shadow-[0_0_12px_rgba(234,179,8,0.8)]
                               dark:border-yellow-400/60 dark:shadow-[0_0_6px_rgba(250,204,21,0.4)] dark:group-hover:shadow-[0_0_12px_rgba(250,204,21,0.7)]"
                        >
                            <Star
                                size={14}
                                className="animate-pulse text-yellow-500 fill-yellow-500 dark:text-yellow-400 dark:fill-yellow-400"
                            />
                        </span>

                        {/* Expanding text */}
                        <span
                            className=" max-w-0 overflow-hidden whitespace-nowrap text-xs ml-0 transition-all duration-300 ease-in-out text-yellow-600 group-hover:max-w-[100px] group-hover:ml-2 dark:text-yellow-400"
                        >
                            All reviews
                        </span>
                    </button>

                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-gray-700 mt-1 mb-5"></div>

                {reviewData && reviewData.length > 0 ? (
                    <Swiper
                        modules={[Navigation, Autoplay]}
                        loop={true}
                        autoplay={{
                            delay: 3000,
                            disableOnInteraction: false,
                        }}
                        navigation={true}
                        spaceBetween={15}
                        breakpoints={{
                            0: { slidesPerView: 1, spaceBetween: 10 },   // Mobile
                            768: { slidesPerView: 1, spaceBetween: 12 }, // Tablets still 1
                            1024: { slidesPerView: 2, spaceBetween: 15 }, // Laptop & Desktop = 2
                        }}
                        className="py-4 overflow-hidden"
                    >

                        {reviewData.map((review: any, index: number) => (
                            <SwiperSlide key={index} className="sm:w-full lg:w-1/2">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md 
                                    border border-gray-200 dark:border-gray-700 
                                    p-3 sm:p-4 md:p-5
                                    h-45 flex flex-col justify-between 
                                    transition-all duration-200 hover:scale-[1.02]"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 mb-3">
                                        <img
                                            src={
                                                review.profile_url
                                                    ? `${import.meta.env.VITE_NODE_BASE_URL}${review.profile_url}`
                                                    : defaultProfile
                                            }
                                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-red-500"
                                        />

                                        <div>
                                            <p className="text-sm sm:text-base font-medium">
                                                {review.name}
                                            </p>

                                            <div className="flex gap-1 text-yellow-400">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={18}
                                                        className={i + 1 <= review.rating
                                                            ? "text-yellow-400 fill-yellow-400"
                                                            : "text-gray-400"}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-gray-700 dark:text-gray-200 text-xs sm:text-sm italic line-clamp-3">
                                        “{review.review || "No review provided."}”
                                    </p>
                                </div>
                            </SwiperSlide>

                        ))}
                    </Swiper>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">No reviews yet.</p>
                )}


            </motion.div>

            {/* Crop & upload modal */}
            {showCrop && imageSrc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white dark:bg-gray-900 rounded-lg w-[90%] max-w-3xl p-4">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Crop image</h3>
                        <div className="relative w-full h-80 bg-gray-200">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={currentType === 'profile' ? 1 / 1 : 16 / 6}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-4">
                            <button
                                className="px-4 py-2 rounded bg-red-700 text-white"
                                onClick={() => { setShowCrop(false); setImageSrc(null); setCurrentType(null); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-blue-600 text-white"
                                onClick={submitCroppedImage}
                                disabled={isUploading}
                            >
                                {isUploading ? 'Uploading...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit profile modal */}
            {showEditProfileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white dark:bg-gray-900 rounded-lg w-[90%] max-w-lg p-6">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Edit Profile</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full p-2 border rounded bg-white/90 dark:bg-gray-800" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">About</label>
                                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={4} className="w-full p-2 border rounded bg-white/90 dark:bg-gray-800" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">UPI ID</label>
                                <input value={formUpi} onChange={(e) => setFormUpi(e.target.value)} className="w-full p-2 border rounded bg-white/90 dark:bg-gray-800" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setShowEditProfileModal(false)} className="px-4 py-2 rounded bg-red-700 text-white">Cancel</button>
                            <button onClick={saveProfileInfo} disabled={savingProfile} className="px-4 py-2 rounded bg-blue-600 text-white">{savingProfile ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            <Dialog
                open={reviewDialog}
                onClose={() => setReviewDialog(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-fadeIn">

                        <Dialog.Title className="flex items-center text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">
                            <Star
                                size={18}
                                className="text-yellow-500 fill-yellow-500 dark:text-yellow-400 dark:fill-yellow-400 me-2"
                            /> Ratings & Reviews
                        </Dialog.Title>

                        {reviewData && reviewData.length > 0 ? (
                            <div className="gap-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                                {reviewData.map((review: any, index: number) => (
                                    <div
                                        key={index}
                                        className="bg-red-50 dark:bg-gray-800 rounded-xl shadow-mdborder border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between transition-all duration-200 hover:scale-[1.02] my-2"
                                    >
                                        <div className="flex items-center gap-4 mb-3">
                                            <img
                                                src={
                                                    review.profile_url
                                                        ? `${import.meta.env.VITE_NODE_BASE_URL}${review.profile_url}`
                                                        : defaultProfile
                                                }
                                                className="w-14 h-14 rounded-full object-cover border-2 border-red-500 shadow-sm"
                                            />

                                            <div>
                                                <p className="text-base font-semibold text-gray-800 dark:text-white">
                                                    {review.name}
                                                </p>

                                                <div className="flex gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={18}
                                                            className={
                                                                i + 1 <= review.rating
                                                                    ? "text-yellow-400 fill-yellow-400"
                                                                    : "text-gray-400 dark:text-gray-600"
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-gray-700 dark:text-gray-300 text-sm italic">
                                            “{review.review || "No review provided."}”
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400">
                                No reviews yet.
                            </p>
                        )}
                    </Dialog.Panel>
                </div>
            </Dialog>

        </div>
    );
};

export default User_View;

