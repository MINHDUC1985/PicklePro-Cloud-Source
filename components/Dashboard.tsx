
import React, { useState } from 'react';
import { User, TournamentState, Player } from '../types';
import Scheduler from './Scheduler';
import TournamentManager from './TournamentManager';
import Help from './Help';
import UserManagement from './UserManagement';
import PlayerManagement from './PlayerManagement';
import {
  Calendar,
  Trophy,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Dribbble,
  Users,
  Lock,
  UserPlus,
  Trash2
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  data: TournamentState | null;
  setData: (data: TournamentState | null) => void;
  tournaments: TournamentState[];
  activeTournamentId: string | null;
  setActiveTournamentId: (id: string) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  onUpdateUser: (user: User) => void;
  players: Player[];
  setPlayers: (players: Player[]) => void;
  onDeleteTournament: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  user,
  onLogout,
  data,
  setData,
  tournaments,
  activeTournamentId,
  setActiveTournamentId,
  users,
  setUsers,
  onUpdateUser,
  players,
  setPlayers,
  onDeleteTournament
}) => {
  const [activeTab, setActiveTab] = useState<'scheduler' | 'manager' | 'help' | 'users' | 'players'>(user.role === 'viewer' ? 'manager' : 'scheduler');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleChangePassword = () => {
    const oldPass = prompt('Nhập mật khẩu hiện tại:');
    // In a real app we'd verify oldPass on server, but here we can check against the users list
    const currentUserInList = users.find(u => u.id === user.id);
    if (currentUserInList && oldPass !== currentUserInList.password) {
      return alert('Mật khẩu hiện tại không đúng!');
    }

    const newPass = prompt('Nhập mật khẩu mới:');
    if (newPass) {
      if (newPass.length < 3) return alert('Mật khẩu quá ngắn!');
      const updatedUsers = users.map(u => u.id === user.id ? { ...u, password: newPass } : u);
      setUsers(updatedUsers);
      onUpdateUser({ ...user, password: newPass });
      alert('✅ Đã đổi mật khẩu thành công!');
    }
  };

  const tabs = [
    { id: 'scheduler', label: 'Lập lịch thi đấu', icon: Calendar, disabled: user.role === 'viewer' },
    { id: 'manager', label: 'Quản lý tỷ số', icon: Trophy, disabled: false },
    { id: 'players', label: 'Quản lý VĐV', icon: UserPlus, disabled: user.role === 'viewer' },
    { id: 'users', label: 'Quản lý người dùng', icon: Users, disabled: user.role !== 'admin' },
    { id: 'help', label: 'Trung tâm trợ giúp', icon: HelpCircle, disabled: user.role === 'viewer' },
  ];

  return (
    <div className="flex h-full overflow-hidden bg-slate-50">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-80 bg-slate-950 text-white transition-transform duration-500 ease-in-out transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        border-r border-white/5 flex flex-col
      `}>
        <div className="p-6 sm:p-8 flex items-center gap-4">
          <div className="bg-lime-400 p-2 sm:p-2.5 rounded-2xl rotate-3 shadow-lg shadow-lime-500/20">
            <Dribbble className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black tracking-tighter uppercase italic block leading-none">PicklePro</span>
            <span className="text-[9px] sm:text-[10px] text-lime-400 font-black uppercase tracking-[0.2em] mt-1 block">Management</span>
          </div>
        </div>

        <div className="px-6 mb-6">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Chọn giải đấu</label>
          <div className="flex gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-lime-500 transition-all text-left flex justify-between items-center gap-2 relative z-10"
              >
                <span className="break-all whitespace-normal">
                  {tournaments.length === 0 ? 'Chưa có giải đấu' : (tournaments.find(t => t.id === activeTournamentId)?.name || 'Chọn giải đấu')}
                </span>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={() => setIsDropdownOpen(false)}></div>
                  <div className="absolute top-[calc(100%+0.25rem)] left-0 right-0 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-[60] overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                    {tournaments.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-400">Chưa có giải đấu</div>
                    ) : (
                      tournaments.map(t => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setActiveTournamentId(t.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-bold transition-all whitespace-normal break-all hover:bg-slate-700 border-b border-white/5 last:border-0 ${activeTournamentId === t.id ? 'text-lime-400 bg-slate-700/50' : 'text-white'}`}
                        >
                          {t.name}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            {activeTournamentId && (user.role === 'admin' || tournaments.find(t => t.id === activeTournamentId)?.createdBy === user.username) && (
              <button
                onClick={() => onDeleteTournament(activeTournamentId)}
                className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
                title="Xóa giải đấu"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 sm:px-6 space-y-1.5 sm:space-y-2 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl transition-all relative group
                  ${activeTab === tab.id
                    ? 'bg-lime-500 text-slate-950 font-black shadow-xl shadow-lime-500/10'
                    : 'text-slate-500 hover:bg-white/5 hover:text-white'}
                  ${tab.disabled ? 'opacity-30 cursor-not-allowed grayscale' : ''}
                `}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${activeTab === tab.id ? 'text-slate-950' : 'text-slate-500 group-hover:text-lime-400'}`} />
                <span className="font-bold text-sm sm:text-base tracking-wide">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="ml-auto bg-slate-950/10 p-1 rounded-full hidden sm:block">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 sm:p-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 shadow-2xl">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl sm:rounded-2xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
                <span className="font-black text-lime-500 text-base sm:text-lg">{user.username[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-black truncate text-white uppercase tracking-wider">{user.username}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-lime-400 animate-pulse' : 'bg-blue-400'}`}></div>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">{user.role}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleChangePassword}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white rounded-xl transition-all font-black text-[10px] sm:text-xs uppercase tracking-widest border border-white/5"
                title="Đổi mật khẩu"
              >
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Mật khẩu</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all font-black text-[10px] sm:text-xs uppercase tracking-widest border border-red-500/20"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Thoát</span>
              </button>
            </div>
          </div>
          <div className="mt-4 sm:mt-6 text-center space-y-1">
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest">Version 2.5.0 Elite</p>
            <p className="text-[8px] sm:text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">© 2025 DucLM • VNPT Cao Bằng</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 bg-white/60 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 sm:p-3 bg-slate-100 rounded-xl sm:rounded-2xl text-slate-700 lg:hidden hover:bg-lime-100 hover:text-lime-700 transition-all flex-shrink-0"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
                {tabs.find(t => t.id === activeTab)?.label}
                {data && <span className="ml-3 text-lime-500 normal-case font-bold text-sm sm:text-base">/ {data.name}</span>}
              </h2>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-lime-500"></div>
                <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Live System</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex -space-x-2 md:-space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="avatar" />
                </div>
              ))}
            </div>
            <div className="hidden md:block h-8 w-px bg-slate-200"></div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-wider">{new Date().toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase">{new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {activeTab === 'scheduler' && (
              <div className="animate-fadeIn">
                <Scheduler
                  data={data}
                  setData={setData}
                  isAdmin={user.role === 'admin' || user.role === 'manager'}
                  onStartTournament={() => setActiveTab('manager')}
                  availablePlayers={players}
                />
              </div>
            )}
            {activeTab === 'players' && (
              <div className="animate-fadeIn">
                <PlayerManagement players={players} setPlayers={setPlayers} isAdmin={user.role === 'admin' || user.role === 'manager'} />
              </div>
            )}
            {activeTab === 'manager' && (
              <div className="animate-fadeIn">
                <TournamentManager data={data} setData={setData} isAdmin={user.role === 'admin' || user.role === 'manager'} />
              </div>
            )}
            {activeTab === 'users' && (
              <div className="animate-fadeIn">
                <UserManagement users={users} setUsers={setUsers} currentUser={user} />
              </div>
            )}
            {activeTab === 'help' && (
              <div className="animate-fadeIn">
                <Help />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
