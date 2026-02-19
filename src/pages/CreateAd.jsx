import React, { useState, useEffect } from 'react';
import { generateQuizFromAI } from '../lib/gemini';
import { db, auth, storage } from '../lib/firebase';
import { 
  collection, addDoc, serverTimestamp, getDocs, query, 
  limit, doc, getDoc, updateDoc, increment 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { useUserPlan } from '../hooks/useUserPlan';
import { Loader2, Sparkles, CheckCircle, Send, Image as ImageIcon, X, Link as LinkIcon, MessageSquare, Languages } from 'lucide-react';
import { resizeImage } from '../lib/imageResizer';
import { useTranslation } from 'react-i18next';

const CreateAd = () => {
  const { t, i18n } = useTranslation();
  const { plan, loading: planLoading } = useUserPlan();
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState(null); 
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [adCount, setAdCount] = useState(0);
  // 言語状態を追加 (初期値は現在のアプリの言語)
  const [detectedLanguage, setDetectedLanguage] = useState(i18n.language.split('-')[0]);
  
  const navigate = useNavigate();

  // 対応言語リスト
  const languages = [
    { code: 'ja', name: '日本語' },
    { code: 'en', name: 'English' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' }
  ];

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/auth');
      return;
    }
    const fetchAdCount = async () => {
      const q = query(collection(db, "advertisements"), limit(4));
      const snap = await getDocs(q);
      setAdCount(snap.size);
    };
    fetchAdCount();
  }, [navigate]);

  const charLimit = plan === 'free' ? 140 : 1000;
  const isLucky = adCount < 3;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!description) return alert(t('desc_placeholder'));
    setLoading(true);
    try {
      const data = await generateQuizFromAI(description);
      setQuiz(data);
      // Geminiからの返答があれば言語を自動セット
      if (data.detectedLanguage) {
        setDetectedLanguage(data.detectedLanguage.toLowerCase());
      }
    } catch (error) {
      console.error(error);
      alert(t('ai_error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!quiz) return;
    setSaving(true);
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      const currentCredits = userData?.credits || 0;
      if (!isLucky && currentCredits < 3) {
        alert(t('no_credits'));
        setSaving(false);
        return;
      }

      const planDurationDays = {
        'free': 7,
        'standard': 30,
        'premium': 90
      }[plan] || 7;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + planDurationDays);

      let finalImageUrl = "";
      if (imageFile) {
        const resizedBlob = await resizeImage(imageFile, 1000, 1000, 0.7);
        const storageRef = ref(storage, `ads/${Date.now()}_${auth.currentUser.uid}`);
        await uploadBytes(storageRef, resizedBlob);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const authorIcon = userData?.photoURL || auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${userData?.displayName || 'U'}&background=random`;

      await addDoc(collection(db, "advertisements"), {
        uid: auth.currentUser.uid,
        authorName: userData?.displayName || auth.currentUser.email.split('@')[0],
        authorIcon: authorIcon,
        description: description,
        linkUrl: linkUrl,
        imageUrl: finalImageUrl,
        quiz: {
          question: quiz.question,
          options: quiz.options,
          answerIndex: quiz.answerIndex
        },
        detectedLanguage: detectedLanguage, // 選択された言語を保存
        createdAt: serverTimestamp(),
        expiresAt: expiresAt,
        impressions: 0,
        clicks: 0,
        attempts: 0,
        correctAnswers: 0,
        plan: plan || 'free'
      });

      if (!isLucky) {
        await updateDoc(userRef, { credits: increment(-3) });
      }
      alert(`${t('publish_success')} (${expiresAt.toLocaleDateString()} ${t('until')})`);
      navigate('/');
    } catch (error) {
      console.error(error);
      alert(t('auth_error'));
    } finally {
      setSaving(false);
    }
  };

  if (planLoading) return <div className="text-center mt-20"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-tighter">{t('create_title')}</h1>
        <div className="flex gap-2">
          {isLucky && <span className="bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">{t('lucky_free')}</span>}
          <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold uppercase">{t('plan')}: {plan}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        {/* 言語選択ドロップダウン */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
            <Languages size={14} /> {t('language_select') || 'Target Language'}
          </label>
          <select 
            value={detectedLanguage}
            onChange={(e) => setDetectedLanguage(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm appearance-none cursor-pointer"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          {imagePreview ? (
            <div className="relative aspect-video w-full">
              <img src={imagePreview} className="w-full h-full object-cover rounded-2xl border" alt="preview" />
              <button onClick={() => {setImageFile(null); setImagePreview(null)}} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X size={16}/></button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-video w-full border-2 border-dashed border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-all">
              <ImageIcon className="text-gray-300 mb-2" size={40} />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('add_visual')}</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
            <LinkIcon size={14} /> {t('dest_link')}
          </label>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
            <MessageSquare size={14} /> {t('description')}
          </label>
          <textarea
            maxLength={charLimit}
            className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm"
            placeholder={t('desc_placeholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end"><span className="text-[10px] text-gray-300 font-bold">{description.length} / {charLimit}</span></div>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={loading || !description}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-30 transition-all shadow-lg shadow-blue-100"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          {t('gen_quiz')}
        </button>
      </div>

      {quiz && (
        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-widest">
            <CheckCircle size={18} /> {t('edit_quiz')}
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-emerald-600 ml-1 uppercase">{t('question')}</label>
              <input
                type="text"
                value={quiz.question}
                onChange={(e) => setQuiz({...quiz, question: e.target.value})}
                className="w-full p-3 rounded-xl bg-white border border-emerald-200 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-[10px] font-bold text-emerald-600 ml-1 uppercase">{t('options_hint')}</label>
              {quiz.options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...quiz.options];
                      newOptions[i] = e.target.value;
                      setQuiz({...quiz, options: newOptions});
                    }}
                    className={`flex-1 p-3 rounded-xl text-xs font-bold border transition-all outline-none ${
                      i === quiz.answerIndex ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-emerald-100 text-emerald-800'
                    }`}
                  />
                  <button 
                    onClick={() => setQuiz({...quiz, answerIndex: i})}
                    className={`px-3 rounded-xl border text-[10px] font-black ${i === quiz.answerIndex ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-300 border-emerald-100'}`}
                  >
                    {t('set_correct')}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={handlePublish}
            // plan が無いときもボタンを押せなくする
            disabled={saving || !plan} 
            className="..."
          >
            {saving ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            {isLucky ? t('publish_free') : t('publish_paid')}
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateAd;