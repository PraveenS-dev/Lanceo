import { useEffect, useState, useRef, useCallback } from "react";
import { fetchUserById, uploadProfileImage, uploadCoverImage } from "../services/Auth";
import BrudCrumbs from "../components/BrudCrumbs";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { Calendar, Mail, Shield, Wallet, Edit } from "lucide-react";
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropHelper';
import { displayDateFormat } from "../services/Helpers";

const Profile = () => {
    const { user, refreshUser } = useAuth();
    const [editData, setEditData] = useState<any>(null);
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

    const crumbs = [
        { label: "Home", path: "/dashboard" },
        { label: "Profile" },
    ];

    const user_id = user?.id;

    const fetchData = async () => {
        if (!user_id) return;
        const res = await fetchUserById(user_id);
        setEditData(res.userDetails);
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
                const { updateProfileInfo } = await import('../services/Auth');
                await updateProfileInfo(payload);
                await refreshUser();
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

            // Refresh user data and local editData
            await refreshUser();
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

    console.log(editData);


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
        <div className="custom-scrollbar pb-10">
            <BrudCrumbs crumbs={crumbs} />

            {/* 🌈 Cover Section */}
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
                                className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md transition-all"
                    >
                        Edit Profile
                    </motion.button>
                </div>
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
        </div>
    );
};

export default Profile;

