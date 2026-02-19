import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { 
  collection, query, where, getDocs, orderBy, 
  doc, deleteDoc, updateDoc 
} from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { 
  Eye, MousePointer2, CheckCircle2, HelpCircle, 
  TrendingUp, ExternalLink, Trash2, Power, PowerOff, Languages 
} from 'lucide-react';

const MyAds = () => {
  const { t } = useTranslation();
  const [myAds, setMyAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAds = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, "advertisements"),
        where("uid", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const adsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyAds(adsData);
    } catch (err) {
      console.error("Error fetching my ads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAds();
  }, []);

  // 削除機能
  const handleDelete = async (adId) => {
    if (!window.confirm(t('confirm_delete') || '本当に削除しますか？')) return;
    try {
      await deleteDoc(doc(db, "advertisements", adId));
      setMyAds(prev => prev.filter(ad => ad.id !== adId));
    } catch (err) {
      alert("削除に失敗しました");
    }
  };

  // 公開・停止切り替え機能
  const toggleStatus = async (adId, currentStatus) => {
    try {
      const adRef = doc(db, "advertisements", adId);
      // isActive フィールドがない場合は false に、ある場合は反転させる
      const newStatus = currentStatus === undefined ? false : !currentStatus;
      await updateDoc(adRef, { isActive: newStatus });
      
      setMyAds(prev => prev.map(ad => 
        ad.id === adId ? { ...ad, isActive: newStatus } : ad
      ));
    } catch (err) {
      alert("更新に失敗しました");
    }
  };

  const StatCard = ({ icon: Icon, label, value, colorClass }) => (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-black text-gray-900 leading-none mt-1">{value}</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-4">
      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="font-bold">{t('analyzing')}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-2">
            {t('stats_dashboard')} <TrendingUp className="text-blue-600" />
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1">{t('stats_desc')}</p>
        </div>
      </div>

      {myAds.length === 0 ? (
        <div className="bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 p-20 text-center">
          <p className="text-gray-400 font-bold">{t('no_ads_yet')}</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {myAds.map((ad) => {
            const successRate = ad.attempts > 0 
              ? Math.round((ad.correctAnswers / ad.attempts) * 100) 
              : 0;
            // 未設定の場合は true とみなす
            const isActive = ad.isActive !== false;

            return (
              <div key={ad.id} className={`bg-white rounded-[2.5rem] border transition-all overflow-hidden ${!isActive ? 'opacity-60 grayscale-[0.5]' : 'shadow-xl border-gray-100'}`}>
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 aspect-video md:aspect-auto bg-gray-100 relative">
                    {ad.imageUrl ? (
                      <img src={ad.imageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold uppercase">No Image</div>
                    )}
                    {/* 言語バッジ */}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-lg">
                      <Languages size={12} />
                      <span className="uppercase">{ad.detectedLanguage || '??'}</span>
                    </div>
                  </div>

                  <div className="md:w-2/3 p-6 md:p-8 space-y-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h2 className="text-lg font-black text-gray-900 leading-tight line-clamp-1">{ad.description}</h2>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                            {isActive ? '● Active' : '○ Paused'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {/* 停止/再開ボタン */}
                        <button 
                          onClick={() => toggleStatus(ad.id, ad.isActive)}
                          className={`p-2 rounded-xl border transition-colors ${isActive ? 'text-amber-500 border-amber-100 hover:bg-amber-50' : 'text-emerald-500 border-emerald-100 hover:bg-emerald-50'}`}
                          title={isActive ? 'Pause' : 'Resume'}
                        >
                          {isActive ? <PowerOff size={18} /> : <Power size={18} />}
                        </button>
                        
                        {/* 削除ボタン */}
                        <button 
                          onClick={() => handleDelete(ad.id)}
                          className="p-2 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard icon={Eye} label={t('impressions')} value={ad.impressions || 0} colorClass="bg-blue-50 text-blue-600" />
                      <StatCard icon={MousePointer2} label={t('clicks')} value={ad.clicks || 0} colorClass="bg-purple-50 text-purple-600" />
                      <StatCard icon={HelpCircle} label={t('attempts')} value={ad.attempts || 0} colorClass="bg-amber-50 text-amber-600" />
                      <StatCard icon={CheckCircle2} label={t('success_rate')} value={`${successRate}%`} colorClass="bg-emerald-50 text-emerald-600" />
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100/50 flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('active_quiz')}</p>
                        <p className="text-xs font-bold text-gray-700">{ad.quiz?.question}</p>
                      </div>
                      {ad.linkUrl && (
                        <a href={ad.linkUrl} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-xl shadow-sm text-gray-400 hover:text-blue-500 transition-colors">
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyAds;