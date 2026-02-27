
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User, TournamentState, Player } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tournaments, setTournaments] = useState<TournamentState[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isInitialMount = useRef(true);

  // Filter tournaments based on user role
  const visibleTournaments = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') return tournaments;
    if (user.role === 'manager') return tournaments.filter(t => t.createdBy === user.username);
    return tournaments; // Viewers see all
  }, [tournaments, user]);

  const activeTournament = visibleTournaments.find(t => t.id === activeTournamentId) || (visibleTournaments.length > 0 ? visibleTournaments[0] : null);

  // Load LocalStorage fallback & Sync to API
  useEffect(() => {
    // Attempt to load from localStorage first
    const savedTournaments = localStorage.getItem('pickleball_tournaments');
    if (savedTournaments) {
      setTournaments(JSON.parse(savedTournaments));
    }
    const savedUsers = localStorage.getItem('pickleball_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers([
        { id: '1', username: 'admin', password: '123', role: 'admin' },
        { id: '2', username: 'viewer', password: '123', role: 'viewer' }
      ]);
    }
    const savedPlayers = localStorage.getItem('pickleball_players');
    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers));
    }

    // Fetch from API
    fetch('/api/tournament')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setTournaments(data);
          localStorage.setItem('pickleball_tournaments', JSON.stringify(data));
        } else if (savedTournaments && user?.role === 'admin') {
          // Push local to server if server is empty
          fetch('/api/tournament', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: savedTournaments
          });
        }
      })
      .catch(console.error);

    fetch('/api/users').then(res => res.json()).then(data => {
      if (data && data.length > 0) setUsers(data);
    }).catch(console.error);

    fetch('/api/players').then(res => res.json()).then(data => {
      if (data && data.length > 0) setPlayers(data);
    }).catch(console.error);

  }, [user]);

  // Sync Tournaments
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      localStorage.setItem('pickleball_tournaments', JSON.stringify(tournaments));
      fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tournaments)
      }).catch(console.error);
    }
  }, [tournaments, user]);

  // Sync Users
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('pickleball_users', JSON.stringify(users));
      if (user?.role === 'admin') {
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(users)
        }).catch(console.error);
      }
    }
  }, [users, user]);

  // Sync Players
  useEffect(() => {
    localStorage.setItem('pickleball_players', JSON.stringify(players));
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(players)
      }).catch(console.error);
    }
  }, [players, user]);

  // Setup WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'UPDATE_TOURNAMENTS') {
          if (user?.role === 'viewer') {
            setTournaments(msg.data);
            localStorage.setItem('pickleball_tournaments', JSON.stringify(msg.data));
          }
        } else if (msg.type === 'UPDATE_PLAYERS') {
          if (user?.role === 'viewer') setPlayers(msg.data);
        } else if (msg.type === 'UPDATE_USERS') {
          if (user?.role === 'viewer') setUsers(msg.data);
        } else if (msg.type === 'INIT') {
          if (user?.role === 'viewer') {
            if (msg.data.tournaments && msg.data.tournaments.length > 0) setTournaments(msg.data.tournaments);
            if (msg.data.players && msg.data.players.length > 0) setPlayers(msg.data.players);
            if (msg.data.users && msg.data.users.length > 0) setUsers(msg.data.users);
          }
        }
      } catch (err) {
        console.error('WS MSG Error:', err);
      }
    };

    wsRef.current = ws;
    return () => {
      ws.close();
    };
  }, [user]);

  const handleLogout = () => {
    setUser(null);
  };

  const handleDeleteTournament = (id: string) => {
    const tournament = tournaments.find(t => t.id === id);
    if (!tournament) return;

    if (user?.role === 'admin' || tournament.createdBy === user?.username) {
      if (confirm(`Bạn có chắc chắn muốn xóa giải đấu "${tournament.name}"?`)) {
        setTournaments(prev => prev.filter(t => t.id !== id));
        if (activeTournamentId === id) {
          setActiveTournamentId(null);
        }
      }
    } else {
      alert('Bạn không có quyền xóa giải đấu này!');
    }
  };

  const setTournamentData = (data: TournamentState | null) => {
    if (!data) return;
    setTournaments(prev => {
      const index = prev.findIndex(t => t.id === data.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = data;
        return next;
      } else {
        // New tournament, assign creator
        const newTournament = { ...data, createdBy: user?.username || 'unknown' };
        return [...prev, newTournament];
      }
    });
    setActiveTournamentId(data.id);
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="h-full bg-slate-50">
      <Dashboard
        user={user}
        onLogout={handleLogout}
        data={activeTournament}
        setData={setTournamentData}
        tournaments={visibleTournaments}
        activeTournamentId={activeTournamentId || (visibleTournaments.length > 0 ? visibleTournaments[0].id : null)}
        setActiveTournamentId={setActiveTournamentId}
        users={users}
        setUsers={setUsers}
        onUpdateUser={setUser}
        players={players}
        setPlayers={setPlayers}
        onDeleteTournament={handleDeleteTournament}
      />
    </div>
  );
};

export default App;
