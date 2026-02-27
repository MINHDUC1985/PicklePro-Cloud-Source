
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Static Login for Serverless Setup
    const staticUsers: User[] = [
      { id: '1', username: 'admin', password: '123', role: 'admin' },
      { id: '2', username: 'viewer', password: '123', role: 'viewer' }
    ];

    const foundUser = staticUsers.find(u => u.username === username && u.password === password);
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      onLogin(userWithoutPassword);
    } else {
      setError('Tài khoản hoặc mật khẩu không chính xác');
    }
  };

  const handleViewerLogin = () => {
    onLogin({ id: '2', username: 'viewer', role: 'viewer' });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1626246937895-d522c71f3021?q=80&w=2000&auto=format&fit=crop"
          alt="Pickleball Court"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/85 sm:bg-white/70 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-0 pt-10 sm:pt-20 pb-10">
        <div className="w-full max-w-[980px] mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 lg:gap-0">

          {/* Left Side: Branding */}
          <div className="flex-1 lg:pr-8 text-center lg:text-left mt-4 lg:mt-28">
            <h1 className="text-[#1877f2] text-4xl sm:text-6xl font-bold tracking-tighter mb-2 sm:mb-4 -ml-1 drop-shadow-sm">
              PicklePro
            </h1>
            <p className="text-[#1c1e21] text-xl sm:text-[28px] leading-7 sm:leading-8 w-full lg:w-[500px] font-medium">
              Hệ thống quản lý giải đấu Pickleball chuyên nghiệp và hiện đại.
            </p>
          </div>

          {/* Right Side: Login Form */}
          <div className="w-full max-w-[396px]">
            <div className="bg-white p-4 rounded-xl shadow-2xl border border-gray-100">
              <h2 className="text-center text-lg font-bold text-gray-700 mb-4 border-b pb-2">Đăng nhập vào hệ thống</h2>
              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-4 py-3.5 text-base sm:text-[17px] focus:outline-none focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2]"
                  placeholder="Tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-md px-4 py-3.5 text-base sm:text-[17px] focus:outline-none focus:border-[#1877f2] focus:ring-1 focus:ring-[#1877f2]"
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {error && (
                  <div className="text-red-500 text-sm text-center py-2 font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold text-lg sm:text-xl px-4 py-2.5 rounded-md transition-colors mt-1"
                >
                  Đăng nhập
                </button>

                <div className="text-center mt-2">
                  <a href="#" className="text-[#1877f2] text-sm hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>

                <div className="border-b border-gray-300 my-3"></div>

                <div className="text-center pb-2">
                  <button
                    type="button"
                    onClick={handleViewerLogin}
                    className="bg-[#42b72a] hover:bg-[#36a420] text-white font-bold text-base sm:text-[17px] px-4 py-3 rounded-md transition-colors"
                  >
                    Truy cập quyền Khách
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-white/90 pt-5 pb-4 px-4 sm:px-0 border-t border-gray-200">
        <div className="max-w-[980px] mx-auto text-[#737373] text-xs text-center">
          <p className="font-bold text-gray-600 mb-1">PicklePro Manager © 2025</p>
          <p>Phát triển bởi Lê Minh Đức (VNPT Cao Bằng)</p>
          <p className="mt-1">Hotline: 0919.749.118 • Email: duclm.cbg@vnpt.vn</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
