import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Clock, Heart, Mic2, Calendar, Trophy, PlayCircle, BarChart3, Play } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import { decodeHtml } from '../api/saavn';

const Stats = () => {
  const { history, likedSongs, followedArtists, setSong, setQueue } = usePlayerStore();

  const stats = useMemo(() => {
    const hourCounts = Array(24).fill(0);
    const artistCounts = {};
    let totalListenTimeSeconds = 0;

    history.forEach(item => {
      // Time of day
      const date = new Date(item.playedAt);
      const hour = date.getHours();
      hourCounts[hour]++;

      // Artist tracking
      const artist = item.artists?.primary?.[0]?.name || 'Unknown';
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;

      // Duration tracking
      if (item.duration) {
        totalListenTimeSeconds += parseInt(item.duration, 10);
      }
    });

    const hourData = hourCounts.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count
    }));

    const topArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], index) => ({ name: decodeHtml(name), count, rank: index + 1 }));

    return { 
      hourData, 
      topArtists, 
      totalMinutes: Math.floor(totalListenTimeSeconds / 60)
    };
  }, [history]);

  const handlePlaySong = (song) => {
    setSong(song);
    setQueue(history, history.findIndex(s => s.id === song.id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-[#0F0F0F] pb-32 overflow-x-hidden">
      
      {/* Banner */}
      <div className="relative pt-10 pb-12 px-4 sm:px-8 md:px-12 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#F3F4F6] to-[#FFFFFF] border-b border-[#EAEAEA]">
        <div className="relative z-10 flex flex-col items-center gap-3 max-w-3xl">
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8F142]/25 text-[#337418] border border-[#5DD62C]/30">
            LISTENING INSIGHTS
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#0F0F0F] tracking-tight">
            Your Listening History & Stats
          </h1>
          <p className="text-[#6B7280] font-normal text-sm sm:text-base max-w-lg">
            Explore your favorite tracks, top artists, and streaming habits.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-8 max-w-[1400px] mx-auto w-full">
        
        {/* Core Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Songs Played', value: history.length, icon: PlayCircle, color: 'text-[#337418]', bg: 'bg-[#C8F142]/20' },
            { label: 'Minutes Listened', value: stats.totalMinutes, icon: Clock, color: 'text-[#337418]', bg: 'bg-[#C8F142]/20' },
            { label: 'Liked Tracks', value: likedSongs.length, icon: Heart, color: 'text-[#5DD62C]', bg: 'bg-[#F0FDF4]' },
            { label: 'Followed Artists', value: followedArtists.length, icon: Mic2, color: 'text-[#7C3AED]', bg: 'bg-[#DDD6FE]/30' },
          ].map((stat, i) => (
            <div key={i} className="cohere-card p-4 sm:p-6 rounded-3xl flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={stat.color} size={20} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-4xl font-extrabold text-[#0F0F0F] tracking-tight">{stat.value}</span>
                <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mt-1">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Top Artists Ranking */}
          <div className="bg-[#FFFFFF] rounded-3xl p-5 sm:p-6 flex flex-col gap-4 border border-[#EAEAEA] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#C8F142]/25 flex items-center justify-center text-[#337418]">
                <Trophy size={18} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F] tracking-tight">Your Top Artists</h2>
            </div>
            
            {stats.topArtists.length > 0 ? (
              <div className="flex flex-col gap-2">
                {stats.topArtists.map((artist, i) => (
                  <div key={artist.name} className="flex items-center gap-4 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-all duration-150 p-3 rounded-2xl group">
                    <span className={`text-lg font-bold w-8 text-center ${i === 0 ? 'text-[#337418]' : 'text-[#6B7280]'}`}>
                      {artist.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-[#0F0F0F] truncate group-hover:text-[#337418] transition-colors">{artist.name}</h3>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Streams</span>
                      <span className="text-[#0F0F0F] font-bold text-sm">{artist.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center py-12 text-center">
                 <p className="text-[#6B7280] text-sm">Start listening to tracks to build your artist rankings.</p>
              </div>
            )}
          </div>

          {/* Activity Area Chart */}
          <div className="bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#EAEAEA] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#C8F142]/25 flex items-center justify-center text-[#337418]">
                  <BarChart3 size={18} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F] tracking-tight">Listening Activity</h2>
              </div>
            </div>
            <p className="text-[#6B7280] font-medium text-xs">Peak listening hours by time of day</p>
            
            <div className="w-full mt-2 min-w-0" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={stats.hourData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5DD62C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#5DD62C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="hour" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 11 }} 
                    interval={3} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', color: '#0F0F0F', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    itemStyle={{ color: '#337418', fontWeight: 'bold', fontSize: '13px' }}
                    labelStyle={{ color: '#6B7280', marginBottom: '2px', fontSize: '11px' }}
                    cursor={{ stroke: 'rgba(0,0,0,0.06)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    name="Tracks"
                    stroke="#5DD62C" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    activeDot={{ r: 5, fill: '#337418', stroke: '#5DD62C', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent History List */}
        <div className="bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#EAEAEA] shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C8F142]/25 flex items-center justify-center text-[#337418]">
              <Clock size={18} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F] tracking-tight">Recently Streamed</h2>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            {history.slice(0, 15).map((item, i) => (
              <div 
                key={i} 
                onClick={() => handlePlaySong(item)}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#F4F4F5] border border-transparent hover:border-[#E5E7EB] transition-all duration-150 group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center">
                    <img src={item.image?.[0]?.url || item.image?.[1]?.url || item.image?.[0]} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play size={15} fill="#C8F142" className="text-[#C8F142] ml-0.5" />
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[#0F0F0F] text-sm truncate group-hover:text-[#337418] transition-colors">{decodeHtml(item.name)}</span>
                    <span className="text-xs text-[#6B7280] truncate mt-0.5 font-medium">
                      {decodeHtml(item.artists?.primary?.[0]?.name || 'Unknown')}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#6B7280] whitespace-nowrap ml-4 hidden sm:block">
                  {new Date(item.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            
            {history.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-center bg-[#F9FAFB] rounded-3xl border border-[#E5E7EB] border-dashed">
                <Calendar size={32} className="text-[#9CA3AF]" />
                <p className="text-[#0F0F0F] font-bold text-sm">Your stream history is currently empty.</p>
                <p className="text-[#6B7280] text-xs">Play some music to see your recent tracks here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
