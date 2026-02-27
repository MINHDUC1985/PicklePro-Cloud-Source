import React, { useState } from 'react';
import { User } from '../types';
import { UserPlus, Trash2, RefreshCw, Shield, User as UserIcon, Lock, Search } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  setUsers: (users: User[]) => void;
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'viewer'>('viewer');

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return alert('Vui lòng điền đầy đủ thông tin');
    if (users.find(u => u.username === newUsername)) return alert('Tên đăng nhập đã tồn tại');

    const newUser: User = {
      id: `u-${Date.now()}`,
      username: newUsername,
      password: newPassword,
      role: newRole
    };

    setUsers([...users, newUser]);
    setNewUsername('');
    setNewPassword('');
    setNewRole('viewer');
    setIsAdding(false);
    alert('✅ Đã tạo tài khoản thành công');
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser.id) return alert('Không thể xóa chính mình');
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleResetPassword = (id: string) => {
    const newPass = prompt('Nhập mật khẩu mới:');
    if (newPass) {
      setUsers(users.map(u => u.id === id ? { ...u, password: newPass } : u));
      alert('✅ Đã đổi mật khẩu thành công');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-950 p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-2xl rotate-3 shadow-lg shadow-blue-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter">Quản lý người dùng</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">User Accounts & Permissions</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Tìm kiếm người dùng..."
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-lime-500 hover:bg-lime-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-lime-500/10"
          >
            <UserPlus className="w-4 h-4" /> Thêm mới
          </button>
        </div>
      </div>

      {/* Add User Modal/Form */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAdding(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-slate-200 animate-scaleIn">
            <h3 className="text-xl font-black text-slate-900 mb-8 uppercase italic flex items-center gap-3">
              <div className="bg-lime-400 p-2 rounded-xl"><UserPlus className="w-5 h-5 text-slate-950" /></div>
              Tạo tài khoản mới
            </h3>
            <form onSubmit={handleAddUser} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tên đăng nhập</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-lime-500 transition-all font-bold text-slate-900"
                    placeholder="VD: manager_01"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-lime-500 transition-all font-bold text-slate-900"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Quyền hạn</label>
                <select 
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-lime-500 transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                >
                  <option value="viewer">Người xem (Viewer)</option>
                  <option value="manager">Quản lý giải đấu (Manager)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-slate-950 hover:bg-lime-500 hover:text-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl"
                >
                  Xác nhận tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="flex items-center gap-4 mb-6 relative">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${
                user.role === 'admin' ? 'bg-lime-50 border-lime-200 text-lime-600' : 
                user.role === 'manager' ? 'bg-blue-50 border-blue-200 text-blue-600' : 
                'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <UserIcon className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-slate-900 uppercase tracking-tighter truncate">{user.username}</h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    user.role === 'admin' ? 'bg-lime-500' : 
                    user.role === 'manager' ? 'bg-blue-500' : 
                    'bg-slate-300'
                  }`}></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{user.role}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 relative">
              <button 
                onClick={() => handleResetPassword(user.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-500 rounded-xl border border-slate-100 font-bold text-[10px] uppercase tracking-wider transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Pass
              </button>
              <button 
                onClick={() => handleDeleteUser(user.id)}
                disabled={user.id === currentUser.id}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all ${
                  user.id === currentUser.id ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 border-slate-100'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
