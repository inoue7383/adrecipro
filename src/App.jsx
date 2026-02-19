import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Outlet } from 'react-router-dom';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';

// ページコンポーネント
import Home from './pages/Home';
import CreateAd from './pages/CreateAd';
import Auth from './pages/Auth';
import MyAds from './pages/MyAds';
import Profile from './pages/Profile';
import { HelmetProvider } from 'react-helmet-async'; // 追加
import { useTranslation } from 'react-i18next'; // 追加
import { Coins, PlusCircle, Zap, BarChart3 } from 'lucide-react'; // BarChart3 を追加
// ナビゲーションバー
const Navbar = ({ userData, user }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-blue-600 p-1.5 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-200">
            <Zap className="text-white fill-white" size={18} />
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tighter">AdRecipro</span>
        </Link>

        <div className="flex items-center gap-3 md:gap-6">
          
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200 shadow-inner">
                <Coins size={14} className="animate-pulse" />
                <span className="text-xs font-black">{userData?.credits ?? 0}</span>
              </div>
              {/* ★ 統計ボタン（My Ads へのリンク） */}
              <Link 
                to="/my-ads" 
                className={`p-2 rounded-xl transition-all ${isActive('/my-ads') ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                title="My Ads Statistics"
              >
                <BarChart3 size={20} />
              </Link>
              <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm">
                <img
                  src={userData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.displayName || 'U')}&background=random`}
                  className="w-full h-full object-cover"
                  alt="profile"
                />
              </Link>
              
              <Link to="/create" className="bg-gray-900 text-white px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 text-xs hover:bg-blue-600 transition-all">
                <PlusCircle size={18} />
                <span className="hidden sm:inline tracking-tighter">Create Ad</span>
              </Link>
            </div>
          ) : (
            <Link to="/auth" className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-gray-200">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

// 共通レイアウト（Outlet を使って各ページに userData を渡す）
const Layout = ({ userData }) => (
  <main className="container mx-auto max-w-5xl px-4 py-8">
    <Outlet context={{ userData }} />
  </main>
);

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const { i18n } = useTranslation(); // 追加
  useEffect(() => {
    if (i18n.language) {
      document.documentElement.lang = i18n.language.split('-')[0];
    }
  }, [i18n.language]);
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        
        // ユーザーデータの初期化
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            photoURL: currentUser.photoURL || "",
            credits: 3,
            answeredAds: []
          });
        }

        // リアルタイム購読
        const unsubscribeDoc = onSnapshot(userRef, (doc) => {
          if (doc.exists()) setUserData(doc.data());
        });
        return () => unsubscribeDoc();
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen bg-[#FDFDFF] text-gray-900 font-sans">
          <Navbar userData={userData} user={user} />
          <Routes>
            <Route element={<Layout userData={userData} />}>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/create" element={<CreateAd />} />
              <Route path="/my-ads" element={<MyAds />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;