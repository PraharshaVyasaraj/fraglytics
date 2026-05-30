import React, { useState, useMemo } from "react";
import {
  MatchData,
  TeamData,
  PlayerDerived,
  PlayerAtomic,
} from "../types";
import {
  Plus,
  X,
  Shield,
  Database,
  Calendar,
  Sword,
  Table as TableIcon,
  LayoutTemplate,
  Crosshair,
  TrendingUp,
} from "lucide-react";
import {
  calculateMatchStats,
  DEFAULT_SCORING_RULES,
  aggregateTournamentStats,
} from "../services/analyticsEngine";
import PointsTable from "./PointsTable";
import Analytics from "./Analytics";
import OperatorLeaderboard from "./OperatorLeaderboard";

interface LeagueOverviewProps {
  rawMatches: MatchData[];
  onDataLoaded: (matches: MatchData[]) => void;
  onTeamClick?: (team: TeamData) => void;
  onPlayerClick?: (player: PlayerDerived, teamName?: string) => void;
}

const getMatchId = (day: number, match: number) => `d${day}-m${match}`;

export default function LeagueOverview({
  rawMatches,
  onDataLoaded,
  onTeamClick,
  onPlayerClick,
}: LeagueOverviewProps) {
  // Stage and Group state
  const [stages, setStages] = useState<string[]>(["Initial Stage"]);
  const [activeStage, setActiveStage] = useState<string>("Initial Stage");

  const [groups, setGroups] = useState<Record<string, string[]>>({
    "Initial Stage": ["Group A"],
  });
  const [activeGroup, setActiveGroup] = useState<string>("Group A");

  // View state
  const [activeTab, setActiveTab] = useState<"ingestion" | "standings" | "analytics" | "operators">("ingestion");

  // Input state
  const [csvText, setCsvText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sortOrder, setSortOrder] = useState<
    "id_asc" | "id_desc" | "date_asc" | "date_desc"
  >("date_desc");

  // Inline forms state
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [crudError, setCrudError] = useState("");
  const [crudSuccess, setCrudSuccess] = useState("");

  // Confirmation states
  const [stageToDelete, setStageToDelete] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);

  // We need to figure out which Matches belong to the selected Stage/Group
  const currentGroupMatches = useMemo(() => {
    return rawMatches.filter(
      (m) => m.leagueStage === activeStage && m.leagueGroup === activeGroup,
    );
  }, [rawMatches, activeStage, activeGroup]);

  const sortedGroupMatches = useMemo(() => {
    return [...currentGroupMatches].sort((a, b) => {
      if (sortOrder === "id_asc") {
        if (a.day !== b.day) return a.day - b.day;
        return a.matchInDay - b.matchInDay;
      } else if (sortOrder === "id_desc") {
        if (a.day !== b.day) return b.day - a.day;
        return b.matchInDay - a.matchInDay;
      } else if (sortOrder === "date_asc") {
        return (a.timestamp || 0) - (b.timestamp || 0);
      } else {
        return (b.timestamp || 0) - (a.timestamp || 0);
      }
    });
  }, [currentGroupMatches, sortOrder]);

  const activeGroupTeams = useMemo(() => {
    return aggregateTournamentStats(sortedGroupMatches);
  }, [sortedGroupMatches]);

  const addStage = () => {
    setCrudError("");
    const name = newStageName.trim();
    if (!name) {
      setIsAddingStage(false);
      return;
    }
    if (stages.includes(name)) {
      setCrudError("Stage already exists.");
      return;
    }
    setStages([...stages, name]);
    setGroups({ ...groups, [name]: ["Group A"] });
    setActiveStage(name);
    setActiveGroup("Group A");
    setNewStageName("");
    setIsAddingStage(false);
  };

  const deleteStage = (stageName: string) => {
    if (stages.length <= 1) {
       setCrudError("Cannot delete the last stage.");
       return;
    }
    setStageToDelete(stageName);
  };

  const confirmDeleteStage = () => {
    if (!stageToDelete) return;
    const newStages = stages.filter(s => s !== stageToDelete);
    const newGroups = { ...groups };
    delete newGroups[stageToDelete];
    setStages(newStages);
    setGroups(newGroups);
    if (activeStage === stageToDelete) {
        setActiveStage(newStages[0]);
        setActiveGroup(newGroups[newStages[0]]?.[0] || "");
    }
    setStageToDelete(null);
    setCrudSuccess(`Stage '${stageToDelete}' deleted.`);
    setTimeout(() => setCrudSuccess(""), 3000);
  };

  const addGroup = () => {
    setCrudError("");
    const name = newGroupName.trim();
    if (!name) {
      setIsAddingGroup(false);
      return;
    }
    if ((groups[activeStage] || []).includes(name)) {
      setCrudError("Group already exists in this stage.");
      return;
    }
    setGroups({
      ...groups,
      [activeStage]: [...(groups[activeStage] || []), name],
    });
    setActiveGroup(name);
    setNewGroupName("");
    setIsAddingGroup(false);
  };

  const deleteGroup = (groupName: string) => {
    if ((groups[activeStage] || []).length <= 1) {
       setCrudError("Cannot delete the last group in a stage.");
       return;
    }
    setGroupToDelete(groupName);
  };

  const confirmDeleteGroup = () => {
    if (!groupToDelete) return;
    const newStageGroups = (groups[activeStage] || []).filter(g => g !== groupToDelete);
    setGroups({
        ...groups,
        [activeStage]: newStageGroups
    });
    if (activeGroup === groupToDelete) {
        setActiveGroup(newStageGroups[0] || "");
    }
    setGroupToDelete(null);
    setCrudSuccess(`Group '${groupToDelete}' deleted.`);
    setTimeout(() => setCrudSuccess(""), 3000);
  };

  const handleParseCSV = () => {
    if (!csvText.trim()) return;
    setIsProcessing(true);

    const allDays = rawMatches.map((m) => m.day);
    const day = allDays.length > 0 ? Math.max(...allDays) + 1 : 1; 
    const match = 1;

    try {
      const lines = csvText.trim().split("\n");
      const parsedPlayers: PlayerAtomic[] = [];
      const delimiter = lines[0].includes("\t") ? "\t" : ",";
      const headerCols = lines[0]
        .split(delimiter)
        .map((c) => c.trim().toLowerCase().replace(/^"|"$/g, ""));
      const hasHeader = headerCols.some(
        (h) => h.includes("rank") || h.includes("team") || h.includes("player"),
      );
      const startIdx = hasHeader ? 1 : 0;

      let colIdx = {
        teamRank: 0,
        teamName: 1,
        playerRank: 2,
        playerName: 3,
        damage: 4,
        assists: 5,
        kills: 6,
        time: 7,
        points: 8,
      };

      if (hasHeader) {
        headerCols.forEach((col, idx) => {
          if (
            col.includes("team rank") ||
            col.includes("team pos") ||
            col === "team_rank"
          )
            colIdx.teamRank = idx;
          else if (
            col.includes("team name") ||
            col === "team_name" ||
            col === "team"
          )
            colIdx.teamName = idx;
          else if (
            col.includes("player rank") ||
            col.includes("player pos") ||
            col === "player_rank"
          )
            colIdx.playerRank = idx;
          else if (
            col === "player name" ||
            col === "player_name" ||
            col === "player" ||
            col.includes("name")
          )
            colIdx.playerName = idx;
          else if (col.includes("damage") || col.includes("dmg"))
            colIdx.damage = idx;
          else if (col.includes("assist") || col.includes("ast"))
            colIdx.assists = idx;
          else if (
            col.includes("finish") ||
            col.includes("kill") ||
            col.includes("elim")
          )
            colIdx.kills = idx;
          else if (
            col.includes("time") ||
            col.includes("survival") ||
            col.includes("play")
          )
            colIdx.time = idx;
          else if (
            col.includes("manual") ||
            col.includes("pts") ||
            col.includes("points")
          )
            colIdx.points = idx;
          else if (col === "rank") {
            if (idx < headerCols.length / 2) colIdx.teamRank = idx;
            else colIdx.playerRank = idx;
          }
        });
      }

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line
          .split(delimiter)
          .map((c) => c.trim().replace(/^"|"$/g, ""));
        if (cols.length < 4) continue;

        const safeParseRank = (val: string) =>
          parseInt((val || "").replace(/[^0-9]/g, "")) || 0;

        const rank = safeParseRank(cols[colIdx.teamRank]) || 99;
        const teamName = cols[colIdx.teamName] || "Unknown Team";
        const individualRank = safeParseRank(cols[colIdx.playerRank]);
        const playerName = cols[colIdx.playerName] || "Unknown Player";
        const damage = parseInt(cols[colIdx.damage]) || 0;
        const assists = parseInt(cols[colIdx.assists]) || 0;
        const kills = parseInt(cols[colIdx.kills]) || 0;

        let timeStr = cols[colIdx.time] || "0";
        let seconds = 0;
        if (timeStr.includes(":")) {
          const parts = timeStr.split(":");
          seconds = parseInt(parts[0]) * 60 + parseInt(parts[1] || "0");
        } else {
          const numericPart = timeStr.replace(/[^\d.]/g, "");
          seconds = (parseFloat(numericPart) || 0) * 60;
        }

        const manualPoints = cols[colIdx.points]
          ? parseInt(cols[colIdx.points]) || 0
          : 0;

        parsedPlayers.push({
          teamRank: rank,
          teamName: teamName,
          individualRank: individualRank,
          playerName: playerName,
          kills: kills,
          assists: assists,
          damage: damage,
          survivalTimeSeconds: seconds,
          manualPoints: manualPoints,
          dayId: day,
          matchId: getMatchId(day, match),
        });
      }

      if (parsedPlayers.length > 0) {
        const derivedStats = calculateMatchStats(
          parsedPlayers,
          DEFAULT_SCORING_RULES,
          day,
          match,
        );

        const newMatch: MatchData = {
          id: getMatchId(day, match),
          day: day,
          matchInDay: match,
          label: `Match`,
          teams: derivedStats,
          status: "completed",
          leagueStage: activeStage,
          leagueGroup: activeGroup,
          timestamp: Date.now(),
        };

        onDataLoaded([...rawMatches, newMatch]);
        setCsvText("");
        setCrudError("");
        setCrudSuccess(`Match added successfully with ${parsedPlayers.length} players processing into ${derivedStats.length} teams.`);
        setTimeout(() => setCrudSuccess(""), 5000);
      } else {
        setCrudError("Could not parse any valid rows. Please check format.");
      }
    } catch (e) {
      console.error("CSV Parse Error", e);
      setCrudError("Failed to parse CSV. Syntax error or missing delimiters.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMatch = (matchId: string) => {
    setMatchToDelete(matchId);
  };

  const confirmDeleteMatch = () => {
    if (!matchToDelete) return;
    onDataLoaded(rawMatches.filter((m) => m.id !== matchToDelete));
    setMatchToDelete(null);
    setCrudSuccess("Match deleted.");
    setTimeout(() => setCrudSuccess(""), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 border-b border-tactical-gray pb-4">
        <Shield className="w-8 h-8 text-tactical-red" />
        <div>
          <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-widest flex items-center gap-2">
            League Operation Center
            <span className="bg-tactical-red/20 text-tactical-red text-[10px] px-2 py-0.5 rounded border border-tactical-red/50">PREMIUM</span>
          </h2>
          <p className="text-tactical-light text-xs font-mono">
            Structured multi-stage, multi-group command and advanced analytics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Organization & Hierarchy */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* STAGE & GROUP PANEL */}
          <div className="bg-tactical-dark border border-tactical-gray p-4 rounded-sm">
            {crudError && (
              <div className="mb-4 bg-tactical-red/20 text-tactical-red border border-tactical-red/50 px-2 py-2 text-[10px] font-bold uppercase rounded flex justify-between items-center animate-in fade-in">
                 {crudError}
                 <button onClick={() => setCrudError("")} className="hover:bg-tactical-red/20 rounded-full p-1"><X className="w-3 h-3" /></button>
              </div>
            )}
            {crudSuccess && (
              <div className="mb-4 bg-tactical-green/20 text-tactical-green border border-tactical-green/50 px-2 py-2 text-[10px] font-bold uppercase rounded flex justify-between items-center animate-in fade-in">
                 {crudSuccess}
                 <button onClick={() => setCrudSuccess("")} className="hover:bg-tactical-green/20 rounded-full p-1"><X className="w-3 h-3" /></button>
              </div>
            )}
            
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-tactical-gray pb-2">
              <Calendar className="w-4 h-4 text-tactical-red" /> STAGES
            </h3>
            <div className="flex flex-col gap-2">
              {stages.map((stage) => (
                <div key={stage} className="flex flex-col gap-1">
                  <div className={`flex items-center justify-between border rounded-sm transition-all ${
                    activeStage === stage ? "bg-tactical-red/10 border-tactical-red" : "bg-black border-tactical-gray"
                  }`}>
                    <button
                      onClick={() => {
                        setActiveStage(stage);
                        setActiveGroup((groups[stage] || [])[0] || "");
                      }}
                      className={`flex-1 px-3 py-2 text-left text-xs font-bold font-mono tracking-wider hover:bg-white/5 ${
                        activeStage === stage ? "text-tactical-red" : "text-tactical-light"
                      }`}
                    >
                      {stage}
                    </button>
                    <button onClick={() => deleteStage(stage)} className="px-3 py-2 text-tactical-gray hover:text-tactical-red" title="Delete Stage">
                       <X className="w-3 h-3" />
                    </button>
                  </div>
                  {stageToDelete === stage && (
                    <div className="flex items-center gap-2 p-2 bg-tactical-red/10 border border-tactical-red/20 rounded-sm">
                      <span className="text-[10px] text-tactical-red font-bold flex-1">Delete stage entirely?</span>
                      <button onClick={confirmDeleteStage} className="px-2 py-1 bg-tactical-red text-white text-[10px] font-bold rounded-sm">Yes</button>
                      <button onClick={() => setStageToDelete(null)} className="px-2 py-1 bg-tactical-gray text-white text-[10px] font-bold rounded-sm">No</button>
                    </div>
                  )}
                </div>
              ))}
              
              {isAddingStage ? (
                 <div className="flex flex-col gap-2 p-2 bg-tactical-black/50 border border-tactical-gray border-dashed rounded-sm">
                    <input 
                      type="text" 
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      placeholder="Stage Name"
                      className="w-full bg-black border border-tactical-gray text-white text-xs px-2 py-1 outline-none focus:border-tactical-red"
                      autoFocus
                      onKeyDown={(e) => {
                         if (e.key === 'Enter') addStage();
                         if (e.key === 'Escape') setIsAddingStage(false);
                      }}
                    />
                    <div className="flex gap-2">
                        <button onClick={addStage} className="flex-1 bg-tactical-red text-white text-[10px] font-bold py-1 rounded-sm">Save</button>
                        <button onClick={() => setIsAddingStage(false)} className="flex-1 bg-tactical-gray text-white text-[10px] font-bold py-1 rounded-sm">Cancel</button>
                    </div>
                 </div>
              ) : (
                 <button
                   onClick={() => { setCrudError(""); setIsAddingStage(true); }}
                   className="px-3 py-2 rounded-sm bg-black border border-tactical-gray border-dashed hover:bg-white/10 text-white transition-colors flex items-center justify-center gap-2 text-[10px] font-bold"
                 >
                   <Plus className="w-3 h-3" /> ADD STAGE
                 </button>
              )}
            </div>

            {activeStage && (
              <>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 mt-6 mb-4 border-b border-tactical-gray pb-2">
                  <Database className="w-4 h-4 text-tactical-red" /> GROUPS IN {activeStage}
                </h3>
                <div className="flex flex-col gap-2">
                  {(groups[activeStage] || []).map((group) => (
                    <div key={group} className="flex flex-col gap-1">
                      <div className={`flex items-center justify-between border rounded-sm transition-all ${
                          activeGroup === group ? "bg-tactical-dark border-white" : "bg-black border-tactical-gray"
                      }`}>
                        <button
                          onClick={() => setActiveGroup(group)}
                          className={`flex-1 px-3 py-2 text-left text-xs font-bold font-mono tracking-wider flex items-center gap-2 hover:bg-white/5 ${
                            activeGroup === group ? "text-white" : "text-tactical-light"
                          }`}
                        >
                          <Database className="w-3 h-3" /> {group}
                        </button>
                        <button onClick={() => deleteGroup(group)} className="px-3 py-2 text-tactical-gray hover:text-tactical-red" title="Delete Group">
                           <X className="w-3 h-3" />
                        </button>
                      </div>
                      {groupToDelete === group && (
                        <div className="flex items-center gap-2 p-2 bg-tactical-red/10 border border-tactical-red/20 rounded-sm">
                          <span className="text-[10px] text-tactical-red font-bold flex-1">Delete group?</span>
                          <button onClick={confirmDeleteGroup} className="px-2 py-1 bg-tactical-red text-white text-[10px] font-bold rounded-sm">Yes</button>
                          <button onClick={() => setGroupToDelete(null)} className="px-2 py-1 bg-tactical-gray text-white text-[10px] font-bold rounded-sm">No</button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isAddingGroup ? (
                      <div className="flex flex-col gap-2 p-2 bg-tactical-black/50 border border-tactical-gray border-dashed rounded-sm">
                        <input 
                          type="text" 
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Group Name"
                          className="w-full bg-black border border-tactical-gray text-white text-xs px-2 py-1 outline-none focus:border-tactical-red"
                          autoFocus
                          onKeyDown={(e) => {
                             if (e.key === 'Enter') addGroup();
                             if (e.key === 'Escape') setIsAddingGroup(false);
                          }}
                        />
                        <div className="flex gap-2">
                            <button onClick={addGroup} className="flex-1 bg-white text-black text-[10px] font-bold py-1 rounded-sm">Save</button>
                            <button onClick={() => setIsAddingGroup(false)} className="flex-1 bg-tactical-gray text-white text-[10px] font-bold py-1 rounded-sm">Cancel</button>
                        </div>
                      </div>
                  ) : (
                      <button
                        onClick={() => { setCrudError(""); setIsAddingGroup(true); }}
                        className="px-3 py-2 rounded-sm bg-black border border-tactical-gray border-dashed hover:bg-white/10 text-white transition-colors flex items-center gap-2 justify-center text-[10px] font-bold"
                      >
                        <Plus className="w-3 h-3" /> ADD GROUP
                      </button>
                  )}

                  {(groups[activeStage] || []).length === 0 && !isAddingGroup && (
                    <span className="text-xs text-tactical-gray italic px-2">
                      No groups created.
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Workspace */}
        <div className="lg:col-span-3 flex flex-col min-h-[700px]">
           {activeStage && activeGroup ? (
              <>
                {/* Advanced Tab Navigation */}
                <div className="flex items-center gap-2 border-b border-tactical-gray pb-4 mb-4">
                  <button
                    onClick={() => setActiveTab("ingestion")}
                    className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 border ${
                      activeTab === "ingestion" ? "bg-white text-black border-white" : "bg-black text-tactical-light border-tactical-gray hover:text-white"
                    }`}
                  >
                    <Sword className="w-4 h-4" /> Match Ingestion
                  </button>
                  <button
                     onClick={() => setActiveTab("standings")}
                     className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 border ${
                       activeTab === "standings" ? "bg-white text-black border-white" : "bg-black text-tactical-light border-tactical-gray hover:text-white"
                     }`}
                  >
                    <LayoutTemplate className="w-4 h-4" /> Group Standings
                  </button>
                  <button
                     onClick={() => setActiveTab("analytics")}
                     className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 border ${
                       activeTab === "analytics" ? "bg-white text-black border-white" : "bg-black text-tactical-light border-tactical-gray hover:text-white"
                     }`}
                  >
                    <TrendingUp className="w-4 h-4" /> Deep Analytics
                  </button>
                  <button
                     onClick={() => setActiveTab("operators")}
                     className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 border ${
                       activeTab === "operators" ? "bg-white text-black border-white" : "bg-black text-tactical-light border-tactical-gray hover:text-white"
                     }`}
                  >
                    <Crosshair className="w-4 h-4" /> Operator Boards
                  </button>
                </div>

                {/* Workspace Content */}
                <div className="flex-1">
                  
                  {/* INGESTION TAB */}
                  {activeTab === "ingestion" && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
                       <div className="bg-tactical-dark border border-tactical-gray rounded-sm flex flex-col p-4">
                        <div className="flex items-center gap-2 text-white font-bold text-sm uppercase mb-4">
                            <TableIcon className="w-4 h-4 text-tactical-red" />
                            Upload Telemetry
                        </div>
                        <div className="flex-1 mb-4 relative min-h-[300px]">
                            <textarea
                            value={csvText}
                            onChange={(e) => setCsvText(e.target.value)}
                            placeholder="Paste CSV here. Expected Columns: Team Rank, Team Name, Player Rank, Player Name, Damage, Assist, Finishes, Play Time (Mins)"
                            className="absolute inset-0 w-full h-full bg-black border border-tactical-gray p-3 text-white text-xs font-mono outline-none focus:border-tactical-red rounded-sm resize-none"
                            />
                        </div>
                        <button
                            onClick={handleParseCSV}
                            disabled={isProcessing || !csvText}
                            className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-tactical-gray transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isProcessing ? "Processing..." : `Commit Match to ${activeGroup}`}
                        </button>
                       </div>

                       <div className="bg-tactical-dark border border-tactical-gray rounded-sm flex flex-col p-4 max-h-[600px]">
                           <div className="flex items-center justify-between mb-4 border-b border-tactical-gray pb-2">
                               <div className="text-white font-bold text-sm uppercase flex items-center gap-2">
                                  <span>Matches ({sortedGroupMatches.length})</span>
                               </div>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as any)}
                                    className="bg-black border border-tactical-gray text-[10px] text-tactical-light px-2 py-1 rounded-sm outline-none focus:border-tactical-red"
                                >
                                    <option value="date_desc">Date (Newest)</option>
                                    <option value="date_asc">Date (Oldest)</option>
                                </select>
                           </div>
                           <div className="flex-1 overflow-y-auto space-y-3 p-1">
                                {sortedGroupMatches.length === 0 ? (
                                    <div className="p-6 text-center text-tactical-gray text-xs font-mono border-dashed border-tactical-gray border mt-4">
                                        No matches logged.
                                    </div>
                                ) : (
                                    sortedGroupMatches.map((m) => (
                                    <div
                                        key={m.id}
                                        className="bg-black border border-tactical-gray rounded-sm p-3 group relative"
                                    >
                                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-tactical-red"></div>
                                        <div className="pl-2">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-white font-bold text-xs uppercase">
                                            Day {m.day} / Match {m.matchInDay}
                                            </span>
                                            <button
                                            onClick={() => handleDeleteMatch(m.id)}
                                            className="text-tactical-gray hover:text-tactical-red transition-colors"
                                            >
                                            <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="text-[10px] text-tactical-light font-mono flex items-center gap-2">
                                            <span>ID: {m.id}</span>
                                            <span>•</span>
                                            <span>{m.teams.length} Teams</span>
                                        </div>
                                        
                                        {matchToDelete === m.id && (
                                            <div className="mt-2 flex items-center gap-2 p-2 bg-tactical-red/10 border border-tactical-red/20 rounded-sm">
                                              <span className="text-[10px] text-tactical-red font-bold flex-1">Delete match?</span>
                                              <button onClick={confirmDeleteMatch} className="px-2 py-1 bg-tactical-red text-white text-[10px] font-bold rounded-sm">Yes</button>
                                              <button onClick={() => setMatchToDelete(null)} className="px-2 py-1 bg-tactical-gray text-white text-[10px] font-bold rounded-sm">No</button>
                                            </div>
                                        )}
                                        </div>
                                    </div>
                                    ))
                                )}
                           </div>
                       </div>
                    </div>
                  )}

                  {/* STANDINGS TAB */}
                  {activeTab === "standings" && (
                    <div className="bg-tactical-dark border border-tactical-gray rounded-sm p-4 w-full overflow-hidden">
                       <PointsTable 
                         data={activeGroupTeams}
                         onTeamClick={onTeamClick}
                         onPlayerClick={onPlayerClick}
                       />
                    </div>
                  )}

                  {/* ANALYTICS TAB */}
                  {activeTab === "analytics" && (
                    <div className="w-full">
                       <Analytics 
                         data={activeGroupTeams}
                         onPlayerClick={onPlayerClick}
                       />
                    </div>
                  )}

                  {/* OPERATORS TAB */}
                  {activeTab === "operators" && (
                    <div className="w-full mt-4">
                       <OperatorLeaderboard 
                         data={activeGroupTeams}
                         onPlayerClick={onPlayerClick}
                       />
                    </div>
                  )}

                </div>
              </>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-tactical-gray rounded-sm bg-tactical-dark/50">
                 <Shield className="w-16 h-16 text-tactical-gray mb-4 opacity-50" />
                 <p className="text-tactical-light font-mono text-sm">Select a Stage and Group to activate workspace.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}

