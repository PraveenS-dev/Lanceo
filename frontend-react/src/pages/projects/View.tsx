import { useParams } from 'react-router-dom';
import Back_btn from '../../components/Buttons/Back_btn';
import BrudCrumbs from '../../components/BrudCrumbs';
import { useEffect, useState } from 'react';
import { displayDateFormat, displayDateTimeFormat, getProjectBudgetType, getProjectCategory, getProjectExperience, getProjectSkill } from '../../services/Helpers';
import { getProjectData } from '../../services/Project';
import { useUserName } from '../../utils/useUserName';
import { useAuth } from '../../contexts/AuthContext';
import ChatWindow from '../../components/ChatDropdown/ChatWindow';
import Bitting_add from '../bitings/Bitting_add';
import { getLastBitting } from '../../services/Bittings';

const View = () => {
  const { id } = useParams<({ id: string })>();
  const { user } = useAuth();
  const [files, setFiles] = useState<
    {
      id?: string;
      file?: File;
      preview: string;
      isNew?: boolean;
      isRemoved?: boolean;
      file_name: string;
      extention: string;
      file_path: string;
    }[]
  >([]);

  const [editData, setEditData] = useState<any>(null);
  const [openChat, setOpenChat] = useState(false);
  const [bittingVisible, setBittingVisible] = useState(false);
  const [chatUser, setChatUser] = useState<any>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [chatDebug, setChatDebug] = useState<any>({ lastEvent: null, status: null, body: null, error: null });
  const [lastBitData, setLastBitData] = useState<any>(null);

  const userId = user?.id;

  const handleStartMessaging = async () => {
    const contactId = editData?.created_by;
    if (!contactId) {
      alert("Contact not found for this project.");
      return;
    }
    if (!userId) {
      alert("Please login to start messaging.");
      console.warn("User not logged in, cannot start chat");
      return;
    }

    console.log("Starting chat", { userId, contactId });
    setChatDebug({ lastEvent: 'starting', status: null, body: null, error: null });
    setIsStartingChat(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_NODE_BASE_URL}/chatlist/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, contactId }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Chatlist API error:", res.status, text);
        setChatDebug({ lastEvent: 'http_error', status: res.status, body: text, error: null });
        alert("Unable to start chat. Server returned an error.");
        return;
      }

      const data = await res.json();
      if (!data?.success) {
        console.warn("Chatlist response missing success:", data);
        setChatDebug({ lastEvent: 'invalid_response', status: 200, body: data, error: null });
        alert("Unable to start chat. Unexpected server response.");
        return;
      }

      console.log("Chat started", data);
      setChatDebug({ lastEvent: 'started', status: 200, body: data, error: null });
      setChatUser({
        userId: contactId,
        name: data.contactName,
      });
      setOpenChat(true);
    } catch (err) {
      console.error("Error starting chat:", err);
      setChatDebug((d: any) => ({ ...d, lastEvent: 'exception', error: String(err) }));
      alert("Network error while starting chat.");
    }
    finally {
      setIsStartingChat(false);
    }
  };

  const crumbs = [
    { label: "Home", path: "/dashboard" },
    { label: "Projects", path: "/projects/list" },
    { label: "View" },
  ];

  const fetchLastBitData = async () => {
    const res = await getLastBitting(id, user?.id);
    console.log(res);
    
    setLastBitData(res);
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await getProjectData(id);
      setEditData(res);
    };

    fetchData();
    fetchLastBitData();
  }, [id]);

  useEffect(() => {
    if (editData?.attachmentDetails) {
      const existing = editData.attachmentDetails.map((a: any) => ({
        id: a._id,
        preview: `${import.meta.env.VITE_NODE_BASE_URL}${a.file_path}`,
        isNew: false,
        isRemoved: false,
        extention: a.extention,
        file_name: a.file_name,
        file_path: a.file_path,
      }));
      setFiles(existing);

    }
  }, [editData]);


  return (
    <div className=''>
      <BrudCrumbs crumbs={crumbs} />

      <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
        <h3 className='text-2xl font-bold'>Project View</h3>
        <Back_btn url={"/projects/list"} />
      </div>
      <div className='px-3'>
        <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
          <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Project Details</h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="title" className="form-label">Title</label>
            <p>{editData?.title}</p>
          </div>

          <div className='mt-3'>
            <label htmlFor="" className='form-label'>Posted By</label>
            <p>{useUserName(editData?.created_by)}</p>
          </div>

          <div className='mt-3'>
            <label htmlFor="" className='form-label'>Posted At</label>
            <p>{displayDateTimeFormat(editData?.created_at)}</p>
          </div>

        </div>
        <div className='grid grid-cols-1 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="description" className='form-label'>Description</label>
            <p>{editData?.description}</p>
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="category" className="form-label">Category</label>
            <p>{getProjectCategory(editData?.category)}</p>
          </div>

          <div className="mt-3">
            <label htmlFor="skills" className="form-label">Skills</label>
            <p>{getProjectSkill(editData?.skills)}</p>
          </div>

          <div className="mt-3">
            <label htmlFor="experience" className="form-label">Experience</label>
            <p>{getProjectExperience(editData?.experience)}</p>
          </div>

        </div>

        <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
          <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Budget & Time</h3>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="" className='form-label'>Budget Type</label>
            <p>{getProjectBudgetType(editData?.budget_type)}</p>
          </div>

          {editData?.budget_type === 1 && (
            <div className="mt-3">
              <label htmlFor="estimated_hour" className='form-label'>Estimated Houre</label>
              <p>{(editData?.estimated_hour)} hours</p>
            </div>
          )}

          {editData?.budget_type === 2 && (
            <div className="mt-3">
              <label htmlFor="estimated_budget" className='form-label'>Estimated Budget</label>
              <p>{(editData?.estimated_budget)}</p>
            </div>
          )}

          <div className="mt-3">
            <label htmlFor="deadline" className="form-label">Deadline</label>

            <p>{displayDateFormat(editData?.deadline)}</p>

          </div>
        </div>

        <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
          <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Team Requirements</h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="no_of_freelancer" className="form-label">How many freelancers required</label>
            <p>{(editData?.no_of_freelancer)}</p>
          </div>
        </div>

        <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
          <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Attachments</h3>
        </div>

        <div className="mt-3">
          <label className="form-label">
            Attachments <small className="text-red-400">(optional)</small>
          </label>

          <div className="flex flex-wrap gap-4 mt-5">
            {files
              .filter(f => !f.isRemoved)
              .map((f, i) => {
                const ext = (f.extention || f.file?.name.split(".").pop() || "").toLowerCase();
                const isImage = ["jpg", "jpeg", "png", "heif", "heic"].includes(ext);

                const downloadUrl = f.file_path
                  ? `${import.meta.env.VITE_NODE_BASE_URL}${f.file_path}`
                  : f.preview || "";

                return (
                  <div
                    key={i}
                    className="relative border rounded p-2 flex flex-col items-center justify-center w-32 h-32"
                  >
                    {isImage ? (
                      <img
                        src={downloadUrl}
                        alt={f.file_name || f.file?.name}
                        className="w-28 h-28 object-cover rounded cursor-pointer"
                        onClick={() => window.open(downloadUrl, "_blank")}
                        title="Click to view full image"
                      />
                    ) : (
                      <a
                        href={downloadUrl}
                        download={f.file_name || f.file?.name}
                        className="text-sm text-blue-500 dark:text-blue-300 text-center underline hover:text-blue-600"
                      >
                        {f.file_name || f.file?.name}
                      </a>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
          <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Optional Details</h3>
        </div>

        <div className='grid grid-cols-1 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="milestone" className='form-label'>Milestone <small className="text-red-400">(optional)</small></label>
            <p>{(editData?.milestone ?? "NA")}</p>
          </div>

          <div className="mt-3">
            <label htmlFor="spl_instruction" className='form-label'>Special Instruction <small className="text-red-400">(optional)</small></label>
            <p>{editData?.spl_instruction ?? "NA"}</p>
          </div>
        </div>

        <hr className='mt-5' />

        {editData?.created_by != user?.id &&
          <div className="flex justify-end gap-3">
            {/* Start Biting */}
            {lastBitData &&
              <button
                disabled={isStartingChat}
                onClick={() => setBittingVisible(true)}
                className={`
              mt-3 px-5 py-2.5 rounded-xl font-semibold text-sm sm:text-base
              transition-all duration-300
              bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500
              text-white shadow-[0_0_12px_rgba(99,102,241,0.6)]
              hover:shadow-[0_0_20px_rgba(99,102,241,0.8)]
              hover:scale-105 active:scale-95
              dark:from-indigo-600 dark:via-purple-600 dark:to-pink-500
              ${isStartingChat ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            `}
              >
                {isStartingChat ? 'Starting...' : 'Start Biting'}
              </button>
            }
            {/* Start Messaging */}
            <button
              onClick={handleStartMessaging}
              disabled={isStartingChat}
              className={`
              mt-3 px-5 py-2.5 rounded-xl font-semibold text-sm sm:text-base
              transition-all duration-300
              bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500
              text-white shadow-[0_0_12px_rgba(16,185,129,0.6)]
              hover:shadow-[0_0_20px_rgba(16,185,129,0.8)]
              hover:scale-105 active:scale-95
              dark:from-emerald-600 dark:via-cyan-600 dark:to-sky-500
              ${isStartingChat ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            `}
            >
              {isStartingChat ? 'Starting...' : 'Start Messaging'}
            </button>
          </div>
        }

        {openChat && chatUser && (
          <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center md:inset-auto md:bottom-20 md:right-5 md:left-auto md:justify-end">
            <div className="w-full md:w-96 max-w-[90vw] md:rounded-xl bg-white dark:bg-zinc-900 shadow-lg md:shadow-lg md:static rounded-t-xl md:rounded-t-none overflow-hidden md:overflow-visible custom-scrollbar">
              <ChatWindow
                chat={chatUser}
                userId={userId || ""}
                onClose={() => setOpenChat(false)}
              />
            </div>
          </div>
        )}

        {bittingVisible && (
          <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center md:inset-auto md:bottom-20 md:right-5 md:left-auto md:justify-end">
            <div className="w-full md:w-96 max-w-[90vw] md:rounded-xl bg-white dark:bg-zinc-900 shadow-lg md:shadow-lg md:static rounded-t-xl md:rounded-t-none overflow-auto md:overflow-visible custom-scrollbar">
              <Bitting_add
                setBittingVisible={setBittingVisible}
                project_id={editData?._id as string}
                fetchLastBitData={fetchLastBitData}
              />
            </div>
          </div>
        )}


      </div>
    </div>
  )
}

export default View