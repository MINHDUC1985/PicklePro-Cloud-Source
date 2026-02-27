import React, { useState, useRef } from 'react';
import { Player, Level } from '../types';
import { UserPlus, Trash2, Edit2, Search, FileSpreadsheet, Download, Save, X, MapPin, Award } from 'lucide-react';
import * as XLSX from 'xlsx';

interface PlayerManagementProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  isAdmin: boolean;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ players, setPlayers, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Player>>({});
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name) return alert('Vui lòng nhập tên VĐV');
    
    const newPlayer: Player = {
      id: `p-${Date.now()}`,
      name: editForm.name,
      address: editForm.address || '',
      level: editForm.level || 'None'
    };

    setPlayers([...players, newPlayer]);
    setEditForm({});
    setIsAdding(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name) return;

    setPlayers(players.map(p => p.id === isEditing ? { ...p, ...editForm } : p));
    setIsEditing(null);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa VĐV này?')) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const importedPlayers: Player[] = data
        .slice(1) // Skip header
        .filter(row => row[0]) // Must have a name
        .map((row, idx) => ({
          id: `p-import-${Date.now()}-${idx}`,
          name: row[0]?.toString().trim(),
          address: row[1]?.toString().trim() || '',
          level: (row[2]?.toString().trim().toUpperCase() as Level) || 'None'
        }));

      setPlayers([...players, ...importedPlayers]);
      alert(`✅ Đã nhập thành công ${importedPlayers.length} VĐV`);
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="bg-slate-950 p-6 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-lime-400 p-3.5 rounded-2xl rotate-3 shadow-xl shadow-lime-500/20">
              <UserPlus className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tighter">Quản lý Vận động viên</h2>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Player Database & Registration</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Tìm kiếm VĐV..."
                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-lime-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isAdmin && (
              <>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="px-6 py-3.5 bg-lime-500 hover:bg-lime-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-lime-500/10 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Thêm VĐV
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-lime-400" /> Nhập Excel
                </button>
                <input type="file" ref={fileInputRef} onChange={handleExcelImport} className="hidden" accept=".xlsx, .xls" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Player List Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">STT</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ và Tên</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa chỉ</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trình độ</th>
                {isAdmin && <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                    Không tìm thấy vận động viên nào
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player, idx) => (
                  <tr key={player.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5 text-center font-mono text-xs text-slate-400 font-bold">{idx + 1}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px] uppercase italic">
                          {player.name.split(' ').pop()?.charAt(0)}
                        </div>
                        <span className="font-black text-slate-900 text-sm">{player.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                        <MapPin className="w-3.5 h-3.5 opacity-50" />
                        {player.address || 'Chưa cập nhật'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        player.level === 'A' ? 'bg-lime-100 text-lime-700' : 
                        player.level === 'B' ? 'bg-blue-100 text-blue-700' : 
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {player.level}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setIsEditing(player.id);
                              setEditForm(player);
                            }}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(player.id)}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(isAdding || isEditing) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => { setIsAdding(false); setIsEditing(null); setEditForm({}); }}></div>
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-slate-200 animate-scaleIn">
            <h3 className="text-xl font-black text-slate-900 mb-8 uppercase italic flex items-center gap-3">
              <div className="bg-lime-400 p-2 rounded-xl">
                {isAdding ? <UserPlus className="w-5 h-5 text-slate-950" /> : <Edit2 className="w-5 h-5 text-slate-950" />}
              </div>
              {isAdding ? 'Thêm Vận động viên' : 'Sửa thông tin VĐV'}
            </h3>
            <form onSubmit={isAdding ? handleAdd : handleUpdate} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Họ và Tên</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-lime-500 transition-all font-bold text-slate-900"
                  placeholder="VD: Nguyễn Văn A"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Địa chỉ</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-lime-500 transition-all font-bold text-slate-900"
                    placeholder="VD: Hà Nội"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Trình độ</label>
                <div className="relative">
                  <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-lime-500 transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                    value={editForm.level || 'None'}
                    onChange={(e) => setEditForm({ ...editForm, level: e.target.value as Level })}
                  >
                    <option value="None">Chưa xác định</option>
                    <option value="A">Trình độ A</option>
                    <option value="B">Trình độ B</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setIsAdding(false); setIsEditing(null); setEditForm({}); }}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-slate-950 hover:bg-lime-500 hover:text-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl"
                >
                  {isAdding ? 'Xác nhận thêm' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerManagement;
