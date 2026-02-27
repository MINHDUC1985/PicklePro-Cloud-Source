
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { TournamentState, Match, Team } from '../types';
import {
  Trophy,
  TrendingUp,
  AlertCircle,
  Download,
  Upload,
  Settings2,
  CheckCircle2,
  Medal,
  Star,
  Swords,
  Circle,
  FileSpreadsheet
} from 'lucide-react';
import * as tournamentService from '../services/tournamentService';
import * as XLSX from 'xlsx';

interface ManagerProps {
  data: TournamentState | null;
  setData: (data: TournamentState | null) => void;
  isAdmin?: boolean;
}

const ScoreInput = ({ value, onChange, disabled, className, placeholder }: any) => {
  const [localValue, setLocalValue] = useState(value ?? '');

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  const handleBlur = () => {
    if (localValue.toString() !== (value ?? '').toString()) {
      onChange(localValue.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      disabled={disabled}
      className={className}
      value={localValue}
      placeholder={placeholder}
      onFocus={(e) => e.target.select()}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};

const TournamentManager: React.FC<ManagerProps> = ({ data, setData, isAdmin = true }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const results = useMemo(() => {
    if (!data) return null;
    const final = data.matches.find(m => m.id === 'ko-final');
    if (!final || !final.winnerId) return null;
    const winner = data.teams.find(t => t.id === final.winnerId);
    const runnerUp = data.teams.find(t => t.id === (final.winnerId === final.team1Id ? final.team2Id : final.team1Id));
    let thirdPlace: Team[] = [];
    if (data.config.sharedThirdPlace) {
      const bk1 = data.matches.find(m => m.id === 'ko-semi-1');
      const bk2 = data.matches.find(m => m.id === 'ko-semi-2');
      [bk1, bk2].forEach(bk => {
        if (bk && bk.winnerId) {
          const loserId = bk.winnerId === bk.team1Id ? bk.team2Id : bk.team1Id;
          const t = data.teams.find(team => team.id === loserId);
          if (t) thirdPlace.push(t);
        }
      });
    } else {
      const thirdMatch = data.matches.find(m => m.id === 'ko-third');
      if (thirdMatch && thirdMatch.winnerId) {
        const t = data.teams.find(team => team.id === thirdMatch.winnerId);
        if (t) thirdPlace.push(t);
      }
    }
    return { winner, runnerUp, thirdPlace };
  }, [data]);

  const handleExport = () => {
    if (!data) return;
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `pickleball_${data.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData.teams && importedData.matches) {
          setData(importedData);
          alert(`✅ Đã nhập dữ liệu giải đấu: ${importedData.name || 'Không rõ'}`);
        }
      } catch (error) {
        alert('❌ Lỗi khi đọc file!');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    // Teams Sheet
    const teamsData = data.teams.map((t, idx) => ({
      'Hạng': idx + 1,
      'Bảng': t.group || '',
      'Tên Đội': t.name,
      'HS': t.goalsScored - t.goalsConceded,
      'Điểm': t.points
    }));
    const wsTeams = XLSX.utils.json_to_sheet(teamsData);
    XLSX.utils.book_append_sheet(wb, wsTeams, "Bảng xếp hạng");

    // Matches Sheet
    const matchesData = data.matches.map(m => ({
      'ID': m.id,
      'Giai đoạn': m.stage === 'group' ? 'Vòng bảng' : 'Loại trực tiếp',
      'Vòng': m.roundName,
      'Đội 1': data.teams.find(t => t.id === m.team1Id)?.name || m.team1Id,
      'Tỷ số 1': m.score1 ?? '',
      'Tỷ số 2': m.score2 ?? '',
      'Đội 2': data.teams.find(t => t.id === m.team2Id)?.name || m.team2Id,
      'Người thắng': data.teams.find(t => t.id === m.winnerId)?.name || m.winnerId || ''
    }));
    const wsMatches = XLSX.utils.json_to_sheet(matchesData);
    XLSX.utils.book_append_sheet(wb, wsMatches, "Lịch thi đấu & Kết quả");

    // Info Sheet
    const infoData = [{ 'ID Giải đấu': data.id, 'Tên Giải đấu': data.name }];
    const wsInfo = XLSX.utils.json_to_sheet(infoData);
    XLSX.utils.book_append_sheet(wb, wsInfo, "Thông tin giải đấu");

    XLSX.writeFile(wb, `Pickleball_${data.name.replace(/\s+/g, '_')}_Results_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        // 1. Get Tournament Info
        const infoWsName = wb.SheetNames.find(name => name.includes("Thông tin"));
        let importedTournamentId = `tournament-${Date.now()}`;
        let importedTournamentName = 'Giải đấu nhập từ Excel';
        if (infoWsName) {
          const infoWs = wb.Sheets[infoWsName];
          const info = XLSX.utils.sheet_to_json(infoWs) as any[];
          if (info.length > 0) {
            importedTournamentId = info[0]['ID Giải đấu'] || info[0]['ID'] || importedTournamentId;
            importedTournamentName = info[0]['Tên Giải đấu'] || info[0]['Tên'] || importedTournamentName;
          }
        }

        // 2. Get Teams
        const teamsWsName = wb.SheetNames.find(name => name.includes("Bảng xếp hạng"));
        if (!teamsWsName) {
          alert("❌ Không tìm thấy sheet 'Bảng xếp hạng'!");
          return;
        }
        const teamsWs = wb.Sheets[teamsWsName];
        const importedTeamsData = XLSX.utils.sheet_to_json(teamsWs) as any[];

        // 3. Get Matches
        const wsName = wb.SheetNames.find(name => name.includes("Lịch thi đấu"));
        if (!wsName) {
          alert("❌ Không tìm thấy sheet 'Lịch thi đấu & Kết quả'!");
          return;
        }
        const ws = wb.Sheets[wsName];
        const importedMatches = XLSX.utils.sheet_to_json(ws) as any[];

        let finalTeams: Team[] = [];
        let finalMatches: Match[] = [];
        let finalConfig = data?.config;

        if (data) {
          // UPDATE MODE: Update scores of existing tournament
          finalTeams = [...data.teams];
          finalMatches = data.matches.map(m => {
            const imported = importedMatches.find(im => im['ID'] === m.id);
            if (imported) {
              const s1Val = imported['Tỷ số 1'];
              const s2Val = imported['Tỷ số 2'];
              const s1 = (s1Val === '' || s1Val === undefined) ? undefined : parseInt(s1Val);
              const s2 = (s2Val === '' || s2Val === undefined) ? undefined : parseInt(s2Val);
              let winnerId: string | undefined = undefined;
              if (s1 !== undefined && s2 !== undefined) {
                if (s1 > s2) winnerId = m.team1Id;
                else if (s2 > s1) winnerId = m.team2Id;
              }
              return { ...m, score1: s1, score2: s2, winnerId };
            }
            return m;
          });
        } else {
          // CREATE MODE: Reconstruct from Excel
          finalTeams = importedTeamsData.map((t, idx) => ({
            id: `t-${idx}`,
            name: t['Tên Đội'],
            group: t['Bảng'],
            players: [],
            points: 0,
            goalsScored: 0,
            goalsConceded: 0
          }));

          importedMatches.forEach(im => {
            const t1 = finalTeams.find(t => t.name === im['Đội 1']);
            const t2 = finalTeams.find(t => t.name === im['Đội 2']);
            if (t1 && t2) {
              const s1Val = im['Tỷ số 1'];
              const s2Val = im['Tỷ số 2'];
              const s1 = (s1Val === '' || s1Val === undefined) ? undefined : parseInt(s1Val);
              const s2 = (s2Val === '' || s2Val === undefined) ? undefined : parseInt(s2Val);
              let winnerId: string | undefined = undefined;
              if (s1 !== undefined && s2 !== undefined) {
                if (s1 > s2) winnerId = t1.id;
                else if (s2 > s1) winnerId = t2.id;
              }
              finalMatches.push({
                id: im['ID'] || `m-${finalMatches.length}`,
                stage: im['Giai đoạn'] === 'Loại trực tiếp' || im['Giai đoạn'] === 'Knockout' ? 'knockout' : 'group',
                roundName: im['Vòng'],
                team1Id: t1.id,
                team2Id: t2.id,
                score1: s1,
                score2: s2,
                winnerId
              });
            }
          });

          const groupRounds = new Set(finalMatches.filter(m => m.stage === 'group').map(m => m.roundName));
          finalConfig = {
            numGroups: groupRounds.size || 1,
            mode: 'Đơn',
            hasKnockout: true, // Default to true to show the bracket
            knockoutType: 'top2',
            sharedThirdPlace: true
          };
        }

        const updatedTeams = tournamentService.calculateStandings(finalTeams, finalMatches);

        let currentMatches = finalMatches;
        if (finalConfig?.hasKnockout) {
          const koMatches = tournamentService.generateKnockoutStage(updatedTeams, finalConfig, finalMatches);
          currentMatches = tournamentService.mergeMatches(finalMatches, koMatches);
        }

        setData({
          id: data?.id || importedTournamentId,
          name: data?.name || importedTournamentName,
          createdBy: data?.createdBy || 'imported',
          teams: updatedTeams,
          matches: currentMatches,
          config: finalConfig!
        });

        alert(`✅ Đã nhập dữ liệu từ Excel thành công cho giải đấu: ${importedTournamentName}`);
      } catch (error) {
        console.error(error);
        alert('❌ Lỗi khi đọc file Excel!');
      }
    };
    reader.readAsBinaryString(file);
    if (excelFileInputRef.current) excelFileInputRef.current.value = '';
  };

  const updateMatchScore = (matchId: string, s1Str: string, s2Str: string) => {
    if (!data) return;
    const v1 = parseInt(s1Str, 10);
    const v2 = parseInt(s2Str, 10);
    const s1 = s1Str === '' || isNaN(v1) ? undefined : Math.max(0, v1);
    const s2 = s2Str === '' || isNaN(v2) ? undefined : Math.max(0, v2);

    const updatedMatches = data.matches.map(m => {
      if (m.id === matchId) {
        let winnerId: string | undefined = undefined;
        if (s1 !== undefined && s2 !== undefined) {
          if (s1 > s2) winnerId = m.team1Id;
          else if (s2 > s1) winnerId = m.team2Id;
        }
        return { ...m, score1: s1, score2: s2, winnerId };
      }
      return m;
    });

    const updatedTeams = tournamentService.calculateStandings(data.teams, updatedMatches);

    let currentMatches = updatedMatches;
    if (data.config.hasKnockout) {
      const koMatches = tournamentService.generateKnockoutStage(updatedTeams, data.config, updatedMatches);
      currentMatches = tournamentService.mergeMatches(updatedMatches, koMatches);
    }

    setData({ ...data, teams: updatedTeams, matches: currentMatches });
  };

  const updateKnockoutConfig = (updates: Partial<typeof data.config>) => {
    if (!data) return;
    const newConfig = { ...data.config, ...updates, hasKnockout: true };
    let filteredMatches = data.matches;
    const updatedTeams = tournamentService.calculateStandings(data.teams, filteredMatches);
    const koMatches = tournamentService.generateKnockoutStage(updatedTeams, newConfig, filteredMatches);
    const finalMatches = tournamentService.mergeMatches(filteredMatches, koMatches);
    setData({ ...data, config: newConfig, matches: finalMatches });
  };

  const knockoutMatches = data ? data.matches.filter(m => m.stage === 'knockout') : [];

  const getTeamDisplay = (teamId: string) => {
    if (!data) return { name: '---', isPlaceholder: false };
    if (teamId.startsWith('placeholder-')) {
      const hint = teamId.replace('placeholder-', '');
      return { name: hint, isPlaceholder: true };
    }
    const team = data.teams.find(t => t.id === teamId);
    return { name: team?.name || '---', isPlaceholder: false };
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-16 sm:pb-24">
      {/* Configuration Bar */}
      <div className="flex flex-wrap gap-4 sm:gap-6 items-center justify-center bg-slate-950 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-2xl border border-white/10 text-white text-center">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto mb-4 sm:mb-0">
          <div className="bg-lime-500 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl rotate-12 shadow-lg shadow-lime-500/20">
            <Settings2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-lg uppercase italic tracking-tighter">Bảng điều khiển</h3>
            <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Config & Tools</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto justify-center">
          {isAdmin && (
            <>
              <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
              <input type="file" ref={excelFileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls" />

              {/* Import Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowImportMenu(!showImportMenu);
                    setShowExportMenu(false);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs transition-all border border-white/5 uppercase tracking-widest"
                >
                  <Upload className="w-4 h-4 text-lime-400" /> Nhập dữ liệu
                </button>

                {showImportMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowImportMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      <Upload className="w-4 h-4 text-lime-400" /> File JSON
                    </button>
                    <button
                      onClick={() => {
                        excelFileInputRef.current?.click();
                        setShowImportMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors border-t border-white/5"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-blue-400" /> File Excel
                    </button>
                  </div>
                )}
              </div>

              {/* Export Menu */}
              {data && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowExportMenu(!showExportMenu);
                      setShowImportMenu(false);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-lime-500 hover:bg-lime-400 text-slate-950 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs shadow-xl shadow-lime-500/10 transition-all uppercase tracking-widest"
                  >
                    <Download className="w-4 h-4" /> Xuất dữ liệu
                  </button>

                  {showExportMenu && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <button
                        onClick={() => {
                          handleExport();
                          setShowExportMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        <Download className="w-4 h-4 text-blue-400" /> File JSON
                      </button>
                      <button
                        onClick={() => {
                          handleExportExcel();
                          setShowExportMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors border-t border-white/5"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-lime-400" /> File Excel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {!isAdmin && data && (
            <button onClick={handleExportExcel} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-lime-500 hover:bg-lime-400 text-slate-950 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs shadow-xl shadow-lime-500/10 transition-all uppercase tracking-widest">
              <FileSpreadsheet className="w-4 h-4" /> Xuất báo cáo Excel
            </button>
          )}
        </div>
      </div>

      {!data ? (
        <div className="bg-white p-12 sm:p-24 rounded-[2rem] sm:rounded-[3rem] border border-slate-200 flex flex-col items-center text-slate-400 shadow-sm text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 opacity-20" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Dữ liệu trống</h2>
          <p className="font-bold mt-2 text-sm sm:text-base text-slate-600">Vui lòng lập lịch thi đấu tại trang Xếp lịch hoặc nhập dữ liệu từ file</p>
        </div>
      ) : (
        <>
          {/* Knockout Settings Card */}
          <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <h4 className="text-lg sm:text-xl font-black flex flex-col items-center justify-center gap-3 sm:gap-4 text-slate-900 mb-6 sm:mb-10 uppercase italic text-center">
              <div className="bg-yellow-400 p-2 rounded-xl"><Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" /></div>
              Luật vòng Knockout
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
              <div className="space-y-3 sm:space-y-4">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Tiêu chí vào vòng sau</p>
                <div className="flex gap-2 sm:gap-4">
                  <button
                    disabled={!isAdmin}
                    onClick={() => updateKnockoutConfig({ knockoutType: 'top1' })}
                    className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl border-2 transition-all font-black flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-sm uppercase tracking-widest ${data.config.knockoutType === 'top1' ? 'border-lime-500 bg-lime-50 text-lime-700 shadow-xl shadow-lime-500/10 scale-105' : 'border-slate-100 text-slate-400 bg-slate-50 opacity-60'}`}
                  >
                    {data.config.knockoutType === 'top1' && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />} Lấy Nhất bảng
                  </button>
                  <button
                    disabled={!isAdmin}
                    onClick={() => updateKnockoutConfig({ knockoutType: 'top2' })}
                    className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl border-2 transition-all font-black flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-sm uppercase tracking-widest ${data.config.knockoutType === 'top2' ? 'border-lime-500 bg-lime-50 text-lime-700 shadow-xl shadow-lime-500/10 scale-105' : 'border-slate-100 text-slate-400 bg-slate-50 opacity-60'}`}
                  >
                    {data.config.knockoutType === 'top2' && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />} Lấy Nhất & Nhì bảng
                  </button>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Cơ cấu giải Ba</p>
                <div className="flex gap-2 sm:gap-4">
                  <button
                    disabled={!isAdmin}
                    onClick={() => updateKnockoutConfig({ sharedThirdPlace: true })}
                    className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl border-2 transition-all font-black flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-sm uppercase tracking-widest ${data.config.sharedThirdPlace ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xl shadow-blue-500/10 scale-105' : 'border-slate-100 text-slate-400 bg-slate-50 opacity-60'}`}
                  >
                    {data.config.sharedThirdPlace && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />} Đồng giải Ba
                  </button>
                  <button
                    disabled={!isAdmin}
                    onClick={() => updateKnockoutConfig({ sharedThirdPlace: false })}
                    className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl border-2 transition-all font-black flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-sm uppercase tracking-widest ${!data.config.sharedThirdPlace ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-xl shadow-orange-500/10 scale-105' : 'border-slate-100 text-slate-400 bg-slate-50 opacity-60'}`}
                  >
                    {!data.config.sharedThirdPlace && <CheckCircle2 className="w-4 h-4 sm:w-5 h-5" />} Tranh giải Ba
                  </button>
                </div>
              </div>
            </div>
          </div>



          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-12">
            {/* Table Standings */}
            <div className="space-y-6 sm:space-y-8 text-center">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center justify-center gap-3 sm:gap-4 uppercase italic tracking-tight text-center">
                <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></div>
                Bảng xếp hạng
              </h3>
              <div className="space-y-6 sm:space-y-8">
                {Array.from({ length: data.config.numGroups }).map((_, i) => {
                  const groupLetter = String.fromCharCode(65 + i);
                  const groupName = `Bảng ${groupLetter}`;
                  const groupTeams = data.teams.filter(t => t.group === groupName).sort((a, b) => b.points !== a.points ? b.points - a.points : (b.goalsScored - b.goalsConceded) - (a.goalsScored - a.goalsConceded));
                  return (
                    <div key={groupName} className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all">
                      <div className="bg-slate-50 px-6 sm:px-8 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-center gap-4 text-center">
                        <Circle className="w-2.5 h-2.5 text-blue-500 fill-blue-500" />
                        <h4 className="font-black text-slate-900 uppercase italic tracking-widest text-sm sm:text-base text-center">{groupName}</h4>
                        <Circle className="w-2.5 h-2.5 text-blue-500 fill-blue-500" />
                      </div>
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm sm:text-base text-left min-w-[300px]">
                          <thead className="bg-slate-50/50 text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                            <tr>
                              <th className="px-6 sm:px-8 py-4 sm:py-5">Hạng</th>
                              <th className="px-6 sm:px-8 py-4 sm:py-5">Tên Đội</th>
                              <th className="px-6 sm:px-8 py-4 sm:py-5 text-center text-green-600">Thắng</th>
                              <th className="px-6 sm:px-8 py-4 sm:py-5 text-center text-red-500">Thua</th>
                              <th className="px-6 sm:px-8 py-4 sm:py-5 text-center">HS</th>
                              <th className="px-6 sm:px-8 py-4 sm:py-5 text-center font-black">Điểm</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {groupTeams.map((t, idx) => (
                              <tr key={t.id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="px-6 sm:px-8 py-4 sm:py-5">
                                  <span className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-xl font-black italic text-xs sm:text-sm ${idx === 0 ? 'bg-lime-400 text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
                                    {idx + 1}
                                  </span>
                                </td>
                                <td className="px-6 sm:px-8 py-4 sm:py-5 font-black text-slate-700 italic">{t.name}</td>
                                <td className="px-6 sm:px-8 py-4 sm:py-5 text-center font-bold text-green-600">{t.goalsScored}</td>
                                <td className="px-6 sm:px-8 py-4 sm:py-5 text-center font-bold text-red-500">{t.goalsConceded}</td>
                                <td className="px-6 sm:px-8 py-4 sm:py-5 text-center font-bold text-slate-500">{t.goalsScored > t.goalsConceded ? `+${t.goalsScored - t.goalsConceded}` : t.goalsScored - t.goalsConceded}</td>
                                <td className="px-6 sm:px-8 py-4 sm:py-5 text-center font-black text-blue-600 text-base sm:text-lg">{t.points}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Group Results */}
            <div className="space-y-6 sm:space-y-8 text-center">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center justify-center gap-3 sm:gap-4 uppercase italic tracking-tight text-center">
                <div className="bg-emerald-500 p-2 rounded-xl shadow-lg"><Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></div>
                Kết quả vòng bảng
              </h3>
              <div className="space-y-6">
                {Array.from({ length: data.config.numGroups }).map((_, i) => {
                  const groupName = `Bảng ${String.fromCharCode(65 + i)}`;
                  const groupMatches = data.matches.filter(m => m.roundName === groupName);
                  const showMatchLabel = groupMatches.length > 2;
                  return (
                    <div key={groupName} className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all">
                      <div className="bg-emerald-50 px-6 sm:px-8 py-3 sm:py-4 border-b border-emerald-100 flex items-center justify-center gap-4 text-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <h4 className="font-black text-emerald-900 uppercase italic tracking-widest text-sm sm:text-base text-center">{groupName}</h4>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      </div>
                      <div className="divide-y divide-slate-50 p-2 sm:p-4">
                        {groupMatches.map((m, idx) => (
                          <div key={m.id} className="p-3 sm:p-4 flex flex-col gap-2 hover:bg-slate-50 rounded-xl sm:rounded-2xl transition-all">
                            {showMatchLabel && (
                              <div className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest self-center text-center">
                                Trận {idx + 1}
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-2 sm:gap-4">
                              <span className={`flex-1 text-right font-black text-xs sm:text-base tracking-tight transition-all ${m.winnerId === m.team1Id ? 'text-blue-600 sm:scale-105' : 'text-slate-700'}`}>{data.teams.find(t => t.id === m.team1Id)?.name}</span>
                              <div className="flex items-center gap-1.5 sm:gap-3 bg-white p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
                                <ScoreInput disabled={!isAdmin} className="w-10 h-10 sm:w-12 sm:h-12 text-center bg-slate-50 border-2 border-slate-100 rounded-lg sm:rounded-xl font-black text-base sm:text-xl focus:border-emerald-500 focus:bg-white outline-none transition-all disabled:opacity-50" value={m.score1} placeholder="-" onChange={(val: string) => updateMatchScore(m.id, val, (m.score2 ?? '').toString())} />
                                <span className="text-slate-200 font-black text-sm sm:text-lg">:</span>
                                <ScoreInput disabled={!isAdmin} className="w-10 h-10 sm:w-12 sm:h-12 text-center bg-slate-50 border-2 border-slate-100 rounded-lg sm:rounded-xl font-black text-base sm:text-xl focus:border-emerald-500 focus:bg-white outline-none transition-all disabled:opacity-50" value={m.score2} placeholder="-" onChange={(val: string) => updateMatchScore(m.id, (m.score1 ?? '').toString(), val)} />
                              </div>
                              <span className={`flex-1 text-left font-black text-xs sm:text-base tracking-tight transition-all ${m.winnerId === m.team2Id ? 'text-blue-600 sm:scale-105' : 'text-slate-700'}`}>{data.teams.find(t => t.id === m.team2Id)?.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Knockout Stage Bracket */}
          <div className="mt-8 sm:mt-12 space-y-6 text-center select-none">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 uppercase italic tracking-tighter text-center mb-4">
              <div className="bg-rose-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl shadow-rose-500/20 rotate-6 flex-shrink-0"><Swords className="w-6 h-6 sm:w-8 sm:h-8 text-white" /></div>
              Vòng Loại trực tiếp
            </h3>

            <div className="w-full overflow-x-auto pb-12 pt-4">
              <div className="flex flex-row min-w-max mx-auto px-4 justify-center" style={{ gap: '4rem' }}>
                {['Vòng 1/8', 'Tứ kết', 'Bán kết', 'Chung kết']
                  .filter(r => knockoutMatches.some(m => m.roundName.includes(r)))
                  .map((round, rIndex, arr) => {
                    const roundMatches = knockoutMatches.filter(m => m.roundName.includes(round));

                    return (
                      <div key={round} className="flex flex-col relative" style={{ width: '280px' }}>
                        <div className="text-center font-black uppercase tracking-[0.2em] text-rose-600 mb-8 border-b-2 border-rose-200 pb-2 bg-rose-50 rounded-t-lg pt-2">{round}</div>

                        <div className="flex flex-col justify-around flex-1" style={{ gap: '2rem' }}>
                          {roundMatches.map((m, mIndex) => {
                            const t1 = getTeamDisplay(m.team1Id);
                            const t2 = getTeamDisplay(m.team2Id);
                            const disabled = t1.isPlaceholder || t2.isPlaceholder;

                            const hasNextRound = rIndex < arr.length - 1;
                            const hasPrevRound = rIndex > 0;

                            return (
                              <div key={m.id} className="relative flex flex-col justify-center flex-1 h-full py-2">
                                {/* Connector to next round (right horizontal line) */}
                                {hasNextRound && (
                                  <div className="absolute -right-[2rem] w-[2rem] border-b-2 border-slate-300 top-1/2 z-0"></div>
                                )}
                                {/* Connector from prev round (left horizontal line) */}
                                {hasPrevRound && (
                                  <div className="absolute -left-[2rem] w-[2rem] border-b-2 border-slate-300 top-1/2 z-0"></div>
                                )}

                                {/* Vertical connector line (for pairs connecting) */}
                                {hasNextRound && mIndex % 2 === 0 && (
                                  <div className="absolute -right-[2rem] w-0 border-r-2 border-slate-300 z-0" style={{ top: '50%', height: 'calc(50% + 1rem + 2px)' }}></div>
                                )}
                                {hasNextRound && mIndex % 2 === 1 && (
                                  <div className="absolute -right-[2rem] w-0 border-r-2 border-slate-300 z-0" style={{ bottom: '50%', height: 'calc(50% + 1rem + 2px)' }}></div>
                                )}

                                <div className={`z-10 bg-white rounded-lg shadow-md border overflow-hidden flex flex-col ${disabled ? 'opacity-60 grayscale' : 'border-slate-300 hover:border-rose-400 hover:shadow-lg transition-all'}`}>
                                  {/* Team 1  */}
                                  <div className={`flex justify-between items-center px-4 py-3 border-b border-slate-100 ${m.winnerId === m.team1Id ? 'bg-blue-50/50' : 'bg-slate-50/50'}`}>
                                    <span className={`text-sm font-bold truncate pr-3 ${m.winnerId === m.team1Id ? 'text-blue-600' : (t1.isPlaceholder ? 'text-slate-400 italic font-medium' : 'text-slate-800')}`}>
                                      {t1.name}
                                    </span>
                                    <ScoreInput
                                      disabled={disabled || !isAdmin}
                                      className="w-12 h-10 text-center bg-white border border-slate-200 rounded-md font-black text-lg focus:border-rose-500 focus:outline-none"
                                      value={m.score1}
                                      placeholder="-"
                                      onChange={(val: string) => updateMatchScore(m.id, val, (m.score2 ?? '').toString())}
                                    />
                                  </div>
                                  {/* Team 2 */}
                                  <div className={`flex justify-between items-center px-4 py-3 ${m.winnerId === m.team2Id ? 'bg-blue-50/50' : 'bg-white'}`}>
                                    <span className={`text-sm font-bold truncate pr-3 ${m.winnerId === m.team2Id ? 'text-blue-600' : (t2.isPlaceholder ? 'text-slate-400 italic font-medium' : 'text-slate-800')}`}>
                                      {t2.name}
                                    </span>
                                    <ScoreInput
                                      disabled={disabled || !isAdmin}
                                      className="w-12 h-10 text-center bg-white border border-slate-200 rounded-md font-black text-lg focus:border-rose-500 focus:outline-none"
                                      value={m.score2}
                                      placeholder="-"
                                      onChange={(val: string) => updateMatchScore(m.id, (m.score1 ?? '').toString(), val)}
                                    />
                                  </div>
                                </div>

                                {/* Nhà Vô Địch Display */}
                                {round === 'Chung kết' && (
                                  <>
                                    <div className="absolute w-[3rem] border-b-[3px] border-red-500 top-1/2 z-0" style={{ right: '-3rem' }}></div>
                                    <div className="absolute top-1/2 -mt-3.5 bg-transparent pl-2 font-black text-slate-800 text-sm truncate z-10" style={{ left: 'calc(100% + 3rem)', width: '200px', textAlign: 'left' }}>
                                      {m.winnerId ? <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" />{getTeamDisplay(m.winnerId).name}</span> : <span className="text-slate-400 font-medium italic">Đội thắng</span>}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Tranh hạng ba */}
            {knockoutMatches.some(m => m.roundName.includes('Tranh hạng Ba')) && (
              <div className="max-w-sm mx-auto mt-4 mb-12">
                <div className="text-center font-black uppercase tracking-widest text-orange-600 mb-4 border-b-2 border-orange-200 pb-2 bg-orange-50 rounded-lg pt-2">Tranh Hạng Ba</div>
                {knockoutMatches.filter(m => m.roundName.includes('Tranh hạng Ba')).map(m => {
                  const t1 = getTeamDisplay(m.team1Id);
                  const t2 = getTeamDisplay(m.team2Id);
                  const disabled = t1.isPlaceholder || t2.isPlaceholder;

                  return (
                    <div key={m.id} className="relative flex flex-col justify-center max-w-sm mx-auto">
                      <div className={`bg-white rounded-lg shadow-md border overflow-hidden flex flex-col z-10 relative ${disabled ? 'opacity-60 grayscale' : 'border-slate-300 hover:border-orange-400 transition-all'}`}>
                        {/* Team 1  */}
                        <div className={`flex justify-between items-center px-4 py-3 border-b border-slate-100 ${m.winnerId === m.team1Id ? 'bg-blue-50/50' : 'bg-slate-50/50'}`}>
                          <span className={`text-sm font-bold truncate pr-3 ${m.winnerId === m.team1Id ? 'text-blue-600' : 'text-slate-800'}`}>{t1.name}</span>
                          <ScoreInput disabled={disabled || !isAdmin} className="w-12 h-10 text-center bg-white border border-slate-200 rounded-md font-black focus:border-orange-500" value={m.score1} placeholder="-" onChange={(val: string) => updateMatchScore(m.id, val, (m.score2 ?? '').toString())} />
                        </div>
                        {/* Team 2 */}
                        <div className={`flex justify-between items-center px-4 py-3 ${m.winnerId === m.team2Id ? 'bg-blue-50/50' : 'bg-white'}`}>
                          <span className={`text-sm font-bold truncate pr-3 ${m.winnerId === m.team2Id ? 'text-blue-600' : 'text-slate-800'}`}>{t2.name}</span>
                          <ScoreInput disabled={disabled || !isAdmin} className="w-12 h-10 text-center bg-white border border-slate-200 rounded-md font-black focus:border-orange-500" value={m.score2} placeholder="-" onChange={(val: string) => updateMatchScore(m.id, (m.score1 ?? '').toString(), val)} />
                        </div>
                      </div>

                      {/* Hạng 3 Display */}
                      <div className="absolute w-[3rem] border-b-[3px] border-red-500 top-1/2 z-0" style={{ right: '-3rem' }}></div>
                      <div className="absolute top-1/2 -mt-3.5 bg-transparent pl-2 font-black text-slate-800 text-sm truncate z-10" style={{ left: 'calc(100% + 3rem)', width: '200px', textAlign: 'left' }}>
                        {m.winnerId ? <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-orange-500" />{getTeamDisplay(m.winnerId).name}</span> : <span className="text-slate-400 font-medium italic">Tên đội hạng 3</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Results Podium (Di chuyển xuống dưới cùng) */}
          {results && (
            <div className="bg-slate-900 p-6 sm:p-10 rounded-[2rem] shadow-2xl border border-white/5 text-white relative overflow-hidden mt-12 mb-8 mx-auto max-w-6xl">
              {/* Background Glows */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-yellow-500/10 blur-3xl rounded-full pointer-events-none"></div>

              <div className="relative z-10 flex flex-col items-center w-full px-4 text-center">
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-[0.2em] text-yellow-500 mb-8 sm:mb-12 whitespace-normal break-words w-full">Kết quả giải {data.name}</h3>

                <div className="flex flex-col md:flex-row items-end justify-center gap-4 sm:gap-6 w-full max-w-4xl">

                  {/* 2nd Place - Bạc */}
                  <div className="order-2 md:order-1 w-full md:w-1/3 flex flex-col">
                    <div className="bg-slate-800/80 border border-slate-300/20 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-slate-800 transition-all">
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      <div className="relative mb-4">
                        <div className="w-16 h-16 bg-slate-700/80 rounded-2xl flex items-center justify-center shadow-inner">
                          <Medal className="w-8 h-8 text-slate-300" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-slate-900 font-black text-xs shadow-lg border-2 border-slate-800">2</div>
                      </div>

                      <div className="text-center z-10">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Á Quân</p>
                        <h4 className="text-lg sm:text-xl font-black text-white text-center whitespace-normal break-words w-full px-2">{results.runnerUp?.name || '---'}</h4>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 text-center pb-2 opacity-10">
                        <span className="text-3xl font-black italic uppercase">Silver</span>
                      </div>
                    </div>
                  </div>

                  {/* 1st Place - Vàng */}
                  <div className="order-1 md:order-2 w-full md:w-1/3 flex flex-col -mt-8 md:-mt-12 z-20">
                    <div className="bg-gradient-to-b from-yellow-500/30 to-yellow-600/20 border border-yellow-400/50 rounded-[2rem] p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_40px_-10px_rgba(234,179,8,0.4)]">
                      <div className="absolute inset-0 bg-yellow-400/20 blur-xl"></div>

                      <div className="relative mb-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
                          <Trophy className="w-12 h-12 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-yellow-600 font-black text-base shadow-lg border-4 border-yellow-400">1</div>
                      </div>

                      <div className="text-center z-10">
                        <p className="text-xs font-black uppercase text-yellow-400 tracking-[0.3em] mb-2">Quán Quân</p>
                        <h4 className="text-2xl sm:text-3xl font-black text-white text-center whitespace-normal break-words w-full px-2">{results.winner?.name || '---'}</h4>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 text-center pb-4 opacity-10">
                        <span className="text-4xl font-black italic uppercase text-yellow-400">Champion</span>
                      </div>
                    </div>
                  </div>

                  {/* 3rd Place - Đồng */}
                  <div className="order-3 w-full md:w-1/3 flex flex-col">
                    <div className="bg-slate-800/80 border border-orange-400/20 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-slate-800 transition-all">
                      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      <div className="relative mb-4">
                        <div className="w-16 h-16 bg-slate-700/80 rounded-2xl flex items-center justify-center shadow-inner">
                          <Medal className="w-8 h-8 text-orange-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg border-2 border-slate-800">3</div>
                      </div>

                      <div className="text-center z-10">
                        <p className="text-[10px] font-black uppercase text-orange-400 tracking-widest mb-1">Hạng Ba</p>
                        <h4 className="text-lg sm:text-xl font-black text-white text-center whitespace-normal break-words w-full px-2">
                          {results.thirdPlace.length > 0 ? results.thirdPlace.map(t => t.name).join(' & ') : '---'}
                        </h4>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 text-center pb-2 opacity-10">
                        <span className="text-3xl font-black italic uppercase text-orange-400">Bronze</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TournamentManager;
