import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, loginWithGoogle } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Mail, LogIn, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // 1. i18nextをインポート

const Auth = () => {
  const { t } = useTranslation(); // 2. 翻訳関数を取得
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  // Googleログインの遷移
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/create');
    } catch (error) {
      // エラーメッセージを翻訳
      alert(t('auth_error') + ": " + error.message);
    }
  };

  // メール認証の遷移
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/create');
    } catch (error) {
      alert(t('auth_error') + ": " + error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg border">
      <h2 className="text-2xl font-bold text-center mb-6">
        {/* タイトルを翻訳（新規登録 or ログイン） */}
        {isRegister ? t('register') : t('login')}
      </h2>
      
      <button 
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 border border-gray-200 py-3 rounded-xl mb-6 hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98]"
      >
        <img 
          src="https://www.gstatic.com/images/branding/product/1x/gsa_64dp.png"
          width="20" 
          height="20"
          alt="Google Logo" 
          onError={(e) => {
            e.target.src = "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg";
          }}
        />
        {/* Googleログインを翻訳 */}
        <span className="text-sm font-bold text-gray-700">{t('google_login')}</span>
      </button>

      <div className="relative mb-6 text-center text-gray-400 text-sm">
        {/* セパレーターを翻訳 */}
        <span className="bg-white px-2 relative z-10">{t('email_placeholder')}</span>
        <hr className="absolute top-1/2 w-full border-gray-200" />
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        <input 
          type="email" placeholder="Email" value={email} 
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
        />
        <input 
          type="password" placeholder="Password" value={password} 
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
        />
        <button className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95">
          {isRegister ? <UserPlus size={20} /> : <LogIn size={20} />}
          {/* ボタンラベルを翻訳 */}
          {isRegister ? t('register') : t('login')}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        {/* アカウントの有無を確認するメッセージを翻訳 */}
        {isRegister ? t('have_account') : t('no_account')}
        <button 
          onClick={() => setIsRegister(!isRegister)}
          className="text-primary font-bold ml-1 underline"
        >
          {isRegister ? t('login') : t('register')}
        </button>
      </p>
    </div>
  );
};

export default Auth;