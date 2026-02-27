
import React, { useState, useRef } from 'react';
import { TournamentState, Team, Match, Player, Level } from '../types';
import { Trash2, Save, Wand2, FileText, FileSpreadsheet, Calendar, Upload, Clipboard, Circle, UserPlus } from 'lucide-react';
import * as tournamentService from '../services/tournamentService';
import * as XLSX from 'xlsx';

interface SchedulerProps {
  data: TournamentState | null;
  setData: (data: TournamentState | null) => void;
  isAdmin: boolean;
  onStartTournament?: () => void;
  availablePlayers?: Player[];
}

const Scheduler: React.FC<SchedulerProps> = ({ data, setData, isAdmin, onStartTournament, availablePlayers = [] }) => {
  const [rawInput, setRawInput] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [numGroups, setNumGroups] = useState<number | ''>(1);
  const [mode, setMode] = useState<'Đơn' | 'Đôi'>('Đơn');
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSelectedPlayers = () => {
    const selected = availablePlayers.filter(p => selectedPlayerIds.has(p.id));
    const formatted = selected.map(p => `${p.name} - ${p.level}`).join('\n');
    setRawInput(prev => prev + (prev ? '\n' : '') + formatted);
    setShowPlayerPicker(false);
    setSelectedPlayerIds(new Set());
  };

  const togglePlayerSelection = (id: string) => {
    const next = new Set(selectedPlayerIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPlayerIds(next);
  };

  const handleGenerate = (isNew: boolean = false) => {
    if (!tournamentName.trim()) {
      alert('⚠️ Vui lòng nhập tên giải đấu trước khi tạo!');
      return;
    }
    if (!rawInput.trim()) {
      alert('⚠️ Vui lòng nhập danh sách vận động viên!');
      return;
    }
    if (data && !isNew) {
      if (!confirm('⚠️ Bạn có chắc chắn muốn cập nhật giải đấu? Hành động này sẽ tạo lại toàn bộ lịch thi đấu và xóa các kết quả hiện tại.')) {
        return;
      }
    }

    const players: Player[] = rawInput.split(/\n/).filter(line => line.trim()).map((item, idx) => {
      const cleanItem = item.replace(/,/g, '-');
      const parts = cleanItem.split('-');
      const name = parts[0].trim();
      let level: Level = 'None';
      if (parts[1]) {
        const l = parts[1].trim().toUpperCase();
        if (l === 'A') level = 'A';
        else if (l === 'B') level = 'B';
      }
      return { id: `p-${idx}`, name, level };
    });

    let teams: Team[] = [];
    if (mode === 'Đôi') {
      teams = tournamentService.pairDoubles(players);
    } else {
      teams = players.map(p => ({
        id: `t-${p.id}`,
        name: p.name,
        players: [p],
        points: 0,
        goalsScored: 0,
        goalsConceded: 0
      }));
    }

    const numGroupsVal = typeof numGroups === 'number' ? numGroups : parseInt(numGroups as string) || 1;
    const groups = tournamentService.splitGroups(teams, numGroupsVal);
    const matches: Match[] = [];

    Object.entries(groups).forEach(([groupName, groupTeams]) => {
      const groupMatches = tournamentService.generateRoundRobin(groupTeams, groupName);
      matches.push(...groupMatches);
    });

    const config = {
      numGroups: numGroupsVal,
      mode,
      hasKnockout: true,
      knockoutType: 'top2' as const,
      sharedThirdPlace: true
    };

    const allTeams = Object.values(groups).flat();
    const knockoutMatches = tournamentService.generateKnockoutStage(allTeams, config, matches);
    matches.push(...knockoutMatches);

    const newState: TournamentState = {
      id: (isNew || !data) ? `tournament-${Date.now()}` : data.id,
      name: tournamentName,
      createdBy: data?.createdBy || '',
      teams: allTeams,
      matches,
      config
    };

    setData(newState);
    alert(`🎉 Đã ${isNew || !data ? 'tạo' : 'cập nhật'} giải đấu: ${tournamentName}`);
  };

  // Update tournament name if data changes
  React.useEffect(() => {
    if (data && data.name) setTournamentName(data.name);
    else if (!data) setTournamentName('');
  }, [data]);

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

      const importedNames = data
        .filter(row => row.length > 0)
        .map(row => {
          const name = row[0]?.toString().trim();
          const level = row[1]?.toString().trim() || '';
          return level ? `${name} - ${level}` : name;
        })
        .filter(n => n)
        .join('\n');

      setRawInput(prev => prev + (prev ? '\n' : '') + importedNames);
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = () => {
    if (confirm('Xóa toàn bộ dữ liệu hiện tại?')) {
      setData(null);
      setRawInput('');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 sm:gap-8 2xl:gap-12">
      <div className="xl:col-span-2 space-y-6 sm:space-y-8">
        <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-black flex items-center gap-3 text-slate-900 uppercase italic">
              <div className="bg-lime-400 p-2 rounded-xl"><FileText className="w-5 h-5 text-slate-950" /></div>
              Danh sách VĐV
            </h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowPlayerPicker(true)}
                className="flex-1 sm:flex-none text-[10px] sm:text-xs flex items-center justify-center gap-2 bg-lime-500 hover:bg-lime-400 px-3 sm:px-4 py-2 rounded-xl text-slate-950 font-black transition-all uppercase tracking-widest"
              >
                <UserPlus className="w-4 h-4" /> Chọn từ DS
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none text-[10px] sm:text-xs flex items-center justify-center gap-2 bg-white hover:bg-slate-50 px-3 sm:px-4 py-2 rounded-xl text-slate-700 font-black border-2 border-slate-100 transition-all uppercase tracking-widest">
                <FileSpreadsheet className="w-4 h-4 text-lime-600" /> Excel
              </button>
              <input type="file" ref={fileInputRef} onChange={handleExcelImport} className="hidden" accept=".xlsx, .xls" />
            </div>
          </div>

          {/* Player Picker Modal */}
          {showPlayerPicker && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowPlayerPicker(false)}></div>
              <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 animate-scaleIn flex flex-col max-h-[80vh]">
                <h3 className="text-xl font-black text-slate-900 mb-6 uppercase italic flex items-center gap-3">
                  <div className="bg-lime-400 p-2 rounded-xl"><UserPlus className="w-5 h-5 text-slate-950" /></div>
                  Chọn VĐV từ danh sách
                </h3>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 mb-6">
                  {availablePlayers.length === 0 ? (
                    <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">Chưa có VĐV trong danh sách quản lý</p>
                  ) : (
                    availablePlayers.map(p => (
                      <div
                        key={p.id}
                        onClick={() => togglePlayerSelection(p.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedPlayerIds.has(p.id) ? 'border-lime-500 bg-lime-50' : 'border-slate-100 hover:border-slate-200'
                          }`}
                      >
                        <div>
                          <p className="font-black text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.address || 'Không có địa chỉ'} • Trình {p.level}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlayerIds.has(p.id) ? 'bg-lime-500 border-lime-500' : 'border-slate-200'
                          }`}>
                          {selectedPlayerIds.has(p.id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPlayerPicker(false)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAddSelectedPlayers}
                    disabled={selectedPlayerIds.size === 0}
                    className="flex-1 py-4 bg-slate-950 hover:bg-lime-500 hover:text-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Thêm {selectedPlayerIds.size} VĐV đã chọn
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 space-y-2">
            <label className="block text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest ml-1">Tên giải đấu</label>
            <input
              type="text"
              className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl outline-none focus:border-lime-500 focus:bg-white transition-all font-black text-slate-900 text-sm sm:text-base"
              placeholder="VD: Giải Pickleball Mùa Xuân 2025"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
            />
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-lime-400 to-blue-500 rounded-2xl blur opacity-5 group-focus-within:opacity-20 transition-all"></div>
            <textarea
              className="relative w-full h-64 sm:h-80 xl:h-[400px] p-4 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-lime-500/10 focus:border-lime-500 outline-none transition-all font-mono text-sm sm:text-base leading-relaxed custom-scrollbar"
              placeholder="VD:&#10;Lê Văn A - A&#10;Nguyễn Thị B - B"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-4 font-bold uppercase tracking-widest flex items-center gap-2">
            <Circle className="w-2 h-2 fill-lime-500 text-lime-500 flex-shrink-0" /> Nhập mỗi VĐV trên một dòng để hệ thống xử lý
          </p>

          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest ml-1">Số bảng đấu</label>
              <input type="number" min="1" className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl outline-none focus:border-lime-500 focus:bg-white transition-all font-black text-slate-900 text-sm sm:text-base" value={numGroups} onChange={(e) => setNumGroups(e.target.value === '' ? '' : parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest ml-1">Chế độ thi đấu</label>
              <select className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl outline-none focus:border-lime-500 focus:bg-white transition-all font-black text-slate-900 appearance-none cursor-pointer text-sm sm:text-base" value={mode} onChange={(e) => setMode(e.target.value as any)}>
                <option value="Đơn">Đánh Đơn</option>
                <option value="Đôi">Đánh Đôi</option>
              </select>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 flex flex-wrap gap-3 sm:gap-4">
            <button
              onClick={() => handleGenerate(false)}
              className={`flex-1 font-black py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] flex items-center justify-center gap-2 sm:gap-3 shadow-2xl transition-all active:scale-95 uppercase tracking-widest text-[11px] sm:text-sm ${!tournamentName.trim() || !rawInput.trim() ? 'bg-slate-800 text-slate-400' : 'bg-slate-950 hover:bg-lime-500 hover:text-slate-950 text-white'}`}
            >
              <Wand2 className="w-5 h-5 sm:w-6 sm:h-6" /> {data ? 'Lưu thay đổi' : 'Tạo giải đấu'}
            </button>
            {data && (
              <button
                onClick={() => handleGenerate(true)}
                className={`flex-1 font-black py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] flex items-center justify-center gap-2 sm:gap-3 shadow-2xl transition-all active:scale-95 uppercase tracking-widest text-[11px] sm:text-sm ${!tournamentName.trim() || !rawInput.trim() ? 'bg-slate-800 text-slate-400' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                Tạo giải mới
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Xóa trắng form để nhập mới?')) {
                  setRawInput('');
                  setTournamentName('');
                  setData(null);
                }
              }}
              className="bg-white hover:bg-red-50 hover:text-red-600 text-slate-400 font-bold py-4 sm:py-5 px-5 sm:px-6 rounded-2xl sm:rounded-[2rem] transition-all border-2 border-slate-100 shadow-sm flex items-center justify-center"
              title="Xóa form"
            >
              <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="xl:col-span-3 space-y-6 sm:space-y-8 h-full flex flex-col">
        <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200 h-full flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-black flex items-center gap-3 text-slate-900 uppercase italic">
              <div className="bg-blue-600 p-2 rounded-xl"><Calendar className="w-5 h-5 text-white" /></div>
              LỊCH THI ĐẤU DỰ KIẾN
            </h3>
            {data && <span className="bg-lime-500/10 text-lime-700 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest animate-pulse">Ready</span>}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {!data ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 sm:space-y-6 py-16 sm:py-32">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-50 rounded-full flex items-center justify-center border-4 border-dashed border-slate-200">
                  <Calendar className="w-8 h-8 sm:w-10 sm:h-10 opacity-20" />
                </div>
                <p className="font-black text-slate-400 uppercase tracking-widest text-[10px] sm:text-xs">Chưa có lịch thi đấu</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-6 sm:gap-10">
                {Array.from({ length: data.config.numGroups }).map((_, i) => {
                  const groupLetter = String.fromCharCode(65 + i);
                  const groupName = `Bảng ${groupLetter}`;
                  const groupMatches = data.matches.filter(m => m.roundName === groupName);
                  const groupTeams = data.teams.filter(t => t.group === groupName);
                  const showMatchLabel = groupMatches.length > 2;
                  return (
                    <div key={groupName} className="relative mb-4">
                      {/* Tiêu đề Bảng */}
                      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 sticky top-0 bg-white z-10 py-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 text-white flex-shrink-0 flex items-center justify-center font-black rounded-full italic text-lg sm:text-xl shadow-md">{groupLetter}</div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg sm:text-xl">{groupName}</h4>
                        <div className="flex-1 h-px bg-slate-200 ml-2"></div>
                        <span className="text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-widest">{groupTeams.length} Đội</span>
                      </div>

                      {/* Danh sách đội */}
                      {groupTeams.length > 0 && (
                        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-5 mb-6">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-lime-500"></div>
                            <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 tracking-widest">Danh sách đội</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {groupTeams.map((t, index) => (
                              <div key={t.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-lime-300 transition-colors">
                                <span className="text-slate-300 font-black text-lg italic w-6 text-center shrink-0">{index + 1}</span>
                                <span className="text-sm sm:text-base font-bold text-slate-800 whitespace-normal break-words">{t.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lịch thi đấu */}
                      <div className="space-y-2 sm:space-y-3">
                        {groupMatches.map((m, idx) => (
                          <div key={m.id} className="group p-3 sm:p-4 bg-slate-50 hover:bg-white rounded-xl sm:rounded-2xl border border-slate-100 hover:border-lime-500 hover:shadow-xl hover:shadow-lime-500/5 transition-all flex items-center justify-between gap-3 sm:gap-4">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-black min-w-[35px] sm:min-w-[40px] uppercase">
                              {showMatchLabel ? `Trận ${idx + 1}` : idx + 1}
                            </span>
                            <span className="flex-1 text-right font-black text-xs sm:text-sm text-slate-700">{data.teams.find(t => t.id === m.team1Id)?.name}</span>
                            <div className="px-2 sm:px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm flex-shrink-0">
                              <span className="text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-tighter">VS</span>
                            </div>
                            <span className="flex-1 text-left font-black text-xs sm:text-sm text-slate-700">{data.teams.find(t => t.id === m.team2Id)?.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {data && (
            <div className="mt-6 sm:mt-10 pt-4 sm:pt-6 border-t border-slate-100">
              <button onClick={onStartTournament} className="w-full bg-lime-500 hover:bg-slate-950 hover:text-white text-slate-950 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 shadow-xl shadow-lime-500/20 uppercase tracking-widest text-[11px] sm:text-sm">
                <Save className="w-4 h-4 sm:w-5 sm:h-5" /> Bắt đầu giải đấu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scheduler;
