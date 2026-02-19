import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { signOut } from 'firebase/auth'; // 1. signOut をインポート
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUserPlan } from '../hooks/useUserPlan';
import { User, Camera, Save, Loader2, LogOut, RefreshCw } from 'lucide-react'; // 2. アイコンを追加
import { resizeImage } from '../lib/imageResizer';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // 3. navigate をインポート

const Profile = () => {
  const { t } = useTranslation();
  const { plan } = useUserPlan();
  const navigate = useNavigate(); // 4. navigate の初期化
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userData, setUserData] = useState({ displayName: '', photoURL: '' });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const snap = await getDoc(userRef);
        
        const defaultName = auth.currentUser.email ? auth.currentUser.email.split('@')[0] : 'User';
        const defaultIcon = `https://ui-avatars.com/api/?name=${defaultName}&background=random`;

        if (snap.exists()) {
          setUserData({
            displayName: snap.data().displayName || defaultName,
            photoURL: snap.data().photoURL || defaultIcon
          });
        } else {
          setUserData({ displayName: defaultName, photoURL: defaultIcon });
        }
      } else {
        navigate('/auth'); // 未ログインならログインへ
      }
      setLoading(false);
    };
    fetchUser();
  }, [navigate]);

  // 5. ログアウト処理
  const handleLogout = async () => {
    if (window.confirm(t('confirm_logout'))) {
      try {
        await signOut(auth);
        navigate('/'); // ログアウト後はトップへ
      } catch (error) {
        console.error(error);
      }
    }
  };

  // 6. アカウント切り替え処理（ログアウトしてログイン画面へ）
  const handleSwitchAccount = async () => {
    try {
      await signOut(auth);
      navigate('/auth'); // ログイン画面へ強制遷移
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      let finalPhotoURL = userData.photoURL;

      if (imageFile) {
        const resizedIcon = await resizeImage(imageFile, 100, 100, 0.8);
        const storageRef = ref(storage, `users/${auth.currentUser.uid}/icon`);
        await uploadBytes(storageRef, resizedIcon);
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName: userData.displayName,
        photoURL: finalPhotoURL
      });

      alert(t('update_success'));
    } catch (error) {
      console.error(error);
      alert(t('update_error'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">{t('loading')}</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-3xl shadow-xl mt-10 border border-gray-100 pb-12">
      <h1 className="text-2xl font-black mb-8 text-center tracking-tighter">{t('acc_settings')}</h1>

      <div className="flex flex-col items-center space-y-6">
        {/* プロフィール画像セクション */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-50 shadow-inner bg-gray-50 flex items-center justify-center">
            <img 
              src={previewUrl || userData.photoURL} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <label className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-md">
            <Camera size={14} />
            <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
          </label>
        </div>

        <div className="w-full space-y-1.5">
          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('display_name')}</label>
          <input 
            type="text" 
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 transition-all font-bold"
            value={userData.displayName}
            onChange={(e) => setUserData({...userData, displayName: e.target.value})}
          />
        </div>

        <div className="w-full p-4 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{t('plan')}</span>
          <span className="px-3 py-1 bg-black text-white text-[10px] font-black rounded-lg uppercase">
            {plan}
          </span>
        </div>

        <button 
          onClick={handleUpdate}
          disabled={updating}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:bg-gray-200 transition-all active:scale-[0.98]"
        >
          {updating ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          <span>{t('save')}</span>
        </button>

        {/* アカウント操作セクション */}
        <div className="w-full pt-6 border-t border-gray-100 space-y-3">
          <button 
            onClick={handleSwitchAccount}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all"
          >
            <RefreshCw size={14} />
            {t('switch_account')}
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={14} />
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;