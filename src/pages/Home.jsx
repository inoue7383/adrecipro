import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, getDocs, doc, updateDoc, increment, onSnapshot, arrayUnion, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion'; 
import { Coins, PlusCircle, CheckCircle2, MessageCircle, Sparkles, X, ExternalLink, Clock } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import { Helmet } from 'react-helmet-async'; // 追加
const Home = () => {
  const { t, i18n } = useTranslation(); 
  const [ads, setAds] = useState([]);
  const [answeredAds, setAnsweredAds] = useState([]);
  const navigate = useNavigate();
  const { userData } = useOutletContext(); 
  const userCredits = userData?.credits ?? 0;

  const handleLinkClick = async (ad) => {
    if (!ad.linkUrl) return;
    window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    try {
      const adRef = doc(db, "advertisements", ad.id);
      await updateDoc(adRef, { clicks: increment(1) });
    } catch (err) { console.error("Click update failed:", err); }
  };

  const handleSkip = async (adId) => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { answeredAds: arrayUnion(adId) });
      setAds(prev => prev.filter(ad => ad.id !== adId));
    } catch (err) { console.error("Skip failed:", err); }
  };

  const handleAnswer = async (adId, selectedIndex, correctIndex) => {
    if (!auth.currentUser) return alert(t('login_required'));
    
    const isCorrect = selectedIndex === correctIndex;
    const userRef = doc(db, "users", auth.currentUser.uid);
    const adRef = doc(db, "advertisements", adId);

    try {
      if (isCorrect) {
        await updateDoc(userRef, { credits: increment(1), answeredAds: arrayUnion(adId) });
        alert(t('correct_msg'));
      } else {
        await updateDoc(userRef, { answeredAds: arrayUnion(adId) });
        alert(t('wrong_msg'));
      }
      await updateDoc(adRef, {
        attempts: increment(1),
        correctAnswers: isCorrect ? increment(1) : increment(0)
      });
      setAds(prev => prev.filter(ad => ad.id !== adId));
    } catch (err) { console.error("Answer update failed:", err); }
  };

  useEffect(() => {
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const unsub = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          setAnsweredAds(doc.data().answeredAds || []);
        }
      });
      return () => unsub();
    }
  }, []);

  useEffect(() => {
    if (ads[0] && ads[0].uid !== auth.currentUser?.uid) {
      const adRef = doc(db, "advertisements", ads[0].id);
      updateDoc(adRef, { impressions: increment(1) }).catch(err => console.error("Impression update failed:", err));
    }
  }, [ads[0]?.id]);

  useEffect(() => {
    const fetchAds = async () => {
      const now = new Date();
      const currentLang = i18n.language ? i18n.language.split('-')[0].toLowerCase() : 'ja';

      try {
        // 言語で絞り込み
        const q = query(
          collection(db, "advertisements"),
          where("detectedLanguage", "==", currentLang)
        );
        
        const snap = await getDocs(q);
        const allAds = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 1. 未回答 2. 期限内 3. 公開中(isActive) のものをフィルタ
        const filteredAds = allAds.filter(ad => {
          const isNotAnswered = !answeredAds.includes(ad.id);
          const isNotExpired = ad.expiresAt ? ad.expiresAt.toDate() > now : true;
          const isActive = ad.isActive !== false; // undefined または true なら表示
          return isNotAnswered && isNotExpired && isActive;
        });

        setAds(filteredAds.sort(() => Math.random() - 0.5));
      } catch (err) { 
        console.error("Ads fetch error:", err); 
      }
    };

    fetchAds();
  }, [answeredAds.length, i18n.language]);

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-start pb-20 pt-4">
      <Helmet>
        {/* 言語に合わせて ja.json または en.json の app_title を使う */}
        <title>{t('app_title')} | AdRecipro</title>
        <meta name="description" content={t('app_description')} />
        <meta name="keywords" content={t('app_keywords')} />

      {/* Twitter Card の多言語対応 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t('app_title')} | AdRecipro`} />
        <meta name="twitter:description" content={t('app_description')} />
        <meta name="twitter:image" content="https://adrecipro.com/adrecipro.svg" />

        {/* OGP の多言語対応 */}
        <meta property="og:title" content={`${t('app_title')} | AdRecipro`} />
        <meta property="og:description" content={t('app_description')} />
      </Helmet>
      {/* ステータスエリア */}
      <div className="w-full max-w-[400px] mb-8 px-4">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-1 flex items-stretch h-14">
          <div className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100/50">
            <Coins className="text-amber-500" size={16} />
            <span className="font-black text-amber-700 text-lg tabular-nums">{userCredits}</span>
          </div>
          <div className="w-px bg-gray-100 my-2 mx-1" />
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">{t('remaining')}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-gray-800">{ads.length}</span>
              <span className="text-[10px] font-bold text-gray-400">{t('ads')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* カードスタック */}
      <div className="relative w-full max-w-[380px] h-[520px] flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          {ads.length > 0 ? (
            ads.slice(0, 1).map((ad) => (
              <motion.div
                key={ad.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ x: 500, rotate: 20, opacity: 0 }}
                className="absolute inset-0 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
              >
                <div className="p-4 flex items-center justify-between border-b border-gray-50/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100">
                      <img src={ad.authorIcon || `https://ui-avatars.com/api/?name=${ad.authorName}`} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="text-xs font-bold text-gray-500">{ad.authorName}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-[10px] font-bold">
                    <Clock size={10} />
                    {ad.expiresAt?.toDate().toLocaleDateString()} {t('until')}
                  </div>
                </div>

                {ad.imageUrl && (
                  <div onClick={() => handleLinkClick(ad)} className={`aspect-video w-full overflow-hidden bg-gray-50 relative group ${ad.linkUrl ? 'cursor-pointer' : ''}`}>
                    <img src={ad.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                    {ad.linkUrl && (
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white">
                          <ExternalLink size={24} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6 flex flex-col flex-grow">
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">{ad.description}</p>
                  <div className="mt-auto space-y-2">
                    <p className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1 tracking-tighter">
                      <MessageCircle size={12} /> {ad.quiz?.question}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {ad.quiz?.options.map((opt, idx) => (
                        <button key={idx} onClick={() => handleAnswer(ad.id, idx, ad.quiz.answerIndex)} className="w-full py-3 px-4 bg-gray-50 hover:bg-blue-50 rounded-xl text-xs font-bold text-left transition-all active:scale-95">
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20">
              <Sparkles className="mx-auto text-blue-500 mb-4 opacity-20" size={64} />
              <p className="font-bold text-gray-300">{t('next_ad_msg')}</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 操作ボタン */}
      <div className="mt-12 flex items-center gap-12">
        <button onClick={() => ads[0] && handleSkip(ads[0].id)} className="group flex flex-col items-center gap-2 transition-transform active:scale-90">
          <div className="p-4 bg-white rounded-full shadow-lg border border-gray-100 text-gray-400 group-hover:text-red-500 group-hover:bg-red-50 transition-all">
            <X size={28} />
          </div>
          <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">{t('skip')}</span>
        </button>
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => navigate('/create')} className="p-5 bg-gray-900 text-white rounded-full shadow-2xl hover:bg-blue-600 transition-all active:scale-90">
            <PlusCircle size={32} />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-900 leading-none">{t('create')}</p>
            <p className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-100">
              3 {t('credits')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;