import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getLeftMenuData } from '../../../services/LeftMenu';
import BrudCrumbs from '../../../components/BrudCrumbs';
import Back_btn from '../../../components/Buttons/Back_btn';
import { useUserName } from '../../../utils/useUserName';
import { displayDateTimeFormat, getIsParent, getLeftmenuRole,useParentName } from '../../../services/Helpers';


const View = () => {
  const { id } = useParams<({ id: string })>();
  const [editData, setEditData] = useState<any>(null);

  const crumbs = [
    { label: "Home", path: "/dashboard" },
    { label: "Leftmenu", path: "/leftmenu/list" },
    { label: "View" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const res = await getLeftMenuData(id);
      setEditData(res);
    };

    fetchData();
  }, [id]);

  const parentName = useParentName(editData?.parentId);

  return (
    <div className=''>
      <BrudCrumbs crumbs={crumbs} />

      <div className='flex justify-between mt-3 p-3 bg-red-300 dark:bg-red-600/30 rounded-sm'>
        <h3 className='text-2xl font-bold'>Leftmenu View</h3>
        <Back_btn url={"/leftmenu/list"} />
      </div>
      <div className='px-3'>
        <div className='mt-6 p-2 border-l-4 border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-600/20 rounded-sm'>
          <h3 className='text-xl font-semibold text-red-700 dark:text-red-100'>Menu Details</h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-3'>

          <div className="mt-3">
            <label htmlFor="name" className="form-label">Name</label>
            <p>{editData?.name}</p>
          </div>

          <div className='mt-3'>
            <label htmlFor="" className='form-label'>Created By</label>
            <p>{useUserName(editData?.created_by)}</p>
          </div>

          <div className='mt-3'>
            <label htmlFor="" className='form-label'>Created At</label>
            <p>{displayDateTimeFormat(editData?.created_at)}</p>
          </div>

          <div className="mt-3">
            <label htmlFor="role" className="form-label">Role Permission</label>
            <p>{getLeftmenuRole(editData?.role)}</p>
          </div>


          <div className="mt-3">
            <label htmlFor="" className='form-label'>IsParent</label>
            <p>{getIsParent(editData?.IsParent)}</p>
          </div>

          {editData?.parentId  && (
            <div className="mt-3">
              <label htmlFor="parentId" className='form-label'>Parent</label>
              <p>{(parentName)}</p>
            </div>
          )}

          <div className="mt-3">
            <label htmlFor="sort_order" className="form-label">Sort Order</label>
            <p>{(editData?.sort_order)}</p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default View