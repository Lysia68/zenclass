"use client";

import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { DISCIPLINES, SESSIONS_INIT, BOOKINGS_INIT, SESSIONS_DEMO } from "./demoData";
import { IcoChevron, IcoCalendar2, IcoCheck, IcoX, IcoMail, DISC_ICONS, IcoActivity } from "./icons";
import { Card, SectionHead, Button, Field, DateLabel, Pill, DemoBanner, EmptyState } from "./ui";
import { DatePicker, TimePicker, DurationPicker, DaySelect } from "./pickers";
import { PlanningAccordion, stLbl, stStyle } from "./accordion";


// ── Sélecteur discipline visuel ──────────────────────────────────────────────
function DiscSelect({ label, value, onChange, options, C }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const selected = options.find(d => String(d.id) === String(value));

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position:"relative" }}>
      {label && <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>{label}</div>}
      <button type="button" onClick={()=>setOpen(o=>!o)}
        style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${open ? C.accent : C.border}`, borderRadius:8, background:C.surface, cursor:"pointer", display:"flex", alignItems:"center", gap:8, textAlign:"left", boxSizing:"border-box", transition:"border-color .15s" }}>
        {selected ? (
          <>
            <span style={{ width:22, height:22, borderRadius:6, background:`${selected.color||C.accent}20`, border:`1px solid ${selected.color||C.accent}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>{selected.icon||"🏃"}</span>
            <span style={{ fontSize:13, fontWeight:600, color:C.text, flex:1 }}>{selected.name}</span>
          </>
        ) : (
          <span style={{ fontSize:13, color:C.textMuted, flex:1 }}>— Choisir —</span>
        )}
        <span style={{ fontSize:10, color:C.textMuted, marginLeft:"auto" }}>▾</span>
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:C.surface, border:`1.5px solid ${C.accent}`, borderRadius:10, zIndex:200, boxShadow:"0 8px 24px rgba(0,0,0,.12)", overflow:"hidden", maxHeight:220, overflowY:"auto" }}>
          {options.map(d => {
            const active = String(d.id) === String(value);
            return (
              <button key={d.id} type="button" onClick={()=>{ onChange(String(d.id)); setOpen(false); }}
                style={{ width:"100%", padding:"9px 12px", border:"none", background:active ? `${d.color||C.accent}12` : "transparent", cursor:"pointer", display:"flex", alignItems:"center", gap:10, textAlign:"left", borderBottom:`1px solid ${C.borderSoft}` }}>
                <span style={{ width:26, height:26, borderRadius:7, background:`${d.color||C.accent}20`, border:`1.5px solid ${d.color||C.accent}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{d.icon||"🏃"}</span>
                <span style={{ fontSize:13, fontWeight:active?700:500, color:active?d.color||C.accent:C.text }}>{d.name}</span>
                {active && <span style={{ marginLeft:"auto", color:d.color||C.accent, fontSize:12 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


function PlanningSessionCard({ sess, expandedId, bookings, discs, onToggle, onChangeStatus, onDelete, onCancel, onAddBooking, onSendReminder }) {
  const allDiscs = discs?.length ? discs : DISCIPLINES;
  const disc = allDiscs.find(d=>String(d.id)===String(sess.disciplineId)) || allDiscs[0] || { name:"Cours", color:C.accent, icon:"🧘" };
  const bl     = bookings[sess.id]||[];
  const booked = bl.length ? bl.filter(b=>b.st==="confirmed").length : sess.booked;
  const wait   = bl.length ? bl.filter(b=>b.st==="waitlist").length  : sess.waitlist;
  const pct    = booked/sess.spots;
  const isExp  = expandedId===sess.id;

  return (
    <div style={{ border:`1.5px solid ${isExp?C.accent:C.borderSoft}`, borderRadius:14, overflow:"hidden", marginBottom:10, boxShadow:isExp?`0 2px 12px rgba(176,120,72,.13)`:"0 1px 3px rgba(0,0,0,.05)", transition:"all .2s" }}>
      <div
        onClick={()=>onToggle(sess.id)}
        style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", cursor:"pointer", background:isExp?C.accentBg:C.surface, transition:"background .15s" }}
        onMouseEnter={e=>{ if(!isExp) e.currentTarget.style.background=C.surfaceWarm; }}
        onMouseLeave={e=>{ if(!isExp) e.currentTarget.style.background=C.surface; }}>
        <div style={{ width:4, height:40, borderRadius:3, background:disc.color, flexShrink:0 }}/>
        <div style={{ fontSize:14, fontWeight:800, color:C.accent, width:42, flexShrink:0 }}>{sess.time}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{disc.name}</div>
          <div style={{ fontSize:13, color:C.textSoft, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:2 }}>{sess.teacher} · {sess.room} · {sess.duration}min</div>
        </div>
        <div style={{ flexShrink:0, textAlign:"right", marginRight:6 }}>
          <div style={{ fontSize:15, fontWeight:800, color:pct>=1?C.warn:C.text }}>{booked}/{sess.spots}</div>
          <div style={{ width:52, height:4, background:C.bgDeep, borderRadius:3, marginTop:4 }}>
            <div style={{ height:"100%", width:`${Math.min(pct*100,100)}%`, background:pct>=1?C.warn:pct>.75?C.accent:C.ok, borderRadius:3 }}/>
          </div>
          {wait>0 && <div style={{ fontSize:11, color:C.accent, fontWeight:700, marginTop:2 }}>+{wait} att.</div>}
        </div>
        <span style={{ flexShrink:0, display:"inline-flex", transition:"transform .2s", transform:isExp?"rotate(180deg)":"none" }}><IcoChevron s={18} c={C.textMuted}/></span>
        {isExp && (
          <div onClick={e=>e.stopPropagation()} style={{ display:"flex", gap:5, flexShrink:0 }}>
            {sess.status !== "cancelled" && onCancel && (
              <button onClick={()=>onCancel(sess.id)}
                style={{ fontSize:12, padding:"4px 10px", borderRadius:7, border:`1px solid ${C.border}`, background:C.surface, color:C.textMuted, cursor:"pointer", fontWeight:600 }}>
                Annuler
              </button>
            )}
            {onDelete && (
              <button onClick={()=>{ if(window.confirm("Supprimer cette séance définitivement ?")) onDelete(sess.id); }}
                style={{ fontSize:12, padding:"4px 10px", borderRadius:7, border:`1px solid #EFC8BC`, background:"#FFF5F5", color:C.warn, cursor:"pointer", fontWeight:600 }}>
                ✕
              </button>
            )}
          </div>
        )}
      </div>
      {sess.status === "cancelled" && (
        <div style={{ background:"#FFF5F5", padding:"4px 14px", fontSize:12, color:C.warn, fontWeight:600 }}>⚠ Séance annulée</div>
      )}
      {isExp && <PlanningAccordion sess={sess} sessId={sess.id} bookings={bookings} onChangeStatus={onChangeStatus} onAddBooking={onAddBooking} onSendReminder={onSendReminder}/>}
    </div>
  );
}

// ── DASHBOARD SESSION CARD (réutilise PlanningAccordion) ─────────────────────

function Planning({ isMobile }) {
  const { discs, studioId } = useContext(AppCtx);
  const [sessions, setSessions] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [bookings, setBookings] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [fd, setFd] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [nS, setNS] = useState({ disciplineId:"", teacher:"", date:"", time:"09:00", duration:60, spots:12, level:"Tous niveaux", room:"Studio A" });
  const [coachesList, setCoachesList] = useState([]);
  // Mode récurrence
  const [recMode, setRecMode] = useState(false); // false = séance unique, true = récurrence
  const [recFrom, setRecFrom] = useState("");
  const [recTo, setRecTo]     = useState("");
  const [recSlots, setRecSlots] = useState([]); // créneaux sélectionnés [{day,time,duration,disciplineId}]
  const [recPreview, setRecPreview] = useState([]); // dates générées prévisualisées
  const [recFilterDisc, setRecFilterDisc] = useState(null); // filtre discipline étape 1
  const [isDemoData, setIsDemoData] = useState(false);
  const [addBookingModal, setAddBookingModal] = useState(null); // sessId ou null
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const p = isMobile?12:28;

  // Utilitaire : convertir "Lun/Mar/…" → numéro JS getDay()
  const DAY_NUM = { Lun:1, Mar:2, Mer:3, Jeu:4, Ven:5, Sam:6, Dim:0 };

  // Charger la liste des coachs — directement depuis profiles
  useEffect(() => {
    if (!studioId) return;
    createClient().from("profiles")
      .select("id, first_name, last_name, role")
      .eq("studio_id", studioId)
      .in("role", ["coach", "admin"])
      .then(({ data: profs }) => {
        if (!profs?.length) return;
        setCoachesList(
          profs
            .map(p => ({ id: p.id, name: `${p.first_name||""} ${p.last_name||""}`.trim() }))
            .filter(c => c.name)
        );
      });
  }, [studioId]);

  // Charger les sessions dès que studioId est disponible dans le context
  // Forcer le rechargement des disciplines si le contexte est encore vide
  const [localDiscs, setLocalDiscs] = useState([]);
  const effectiveDiscs = discs?.length ? discs : localDiscs;
  useEffect(() => {
    if (!studioId || discs?.length) return;
    createClient().from("disciplines")
      .select("id,name,icon,color,slots")
      .eq("studio_id", studioId).order("created_at")
      .then(({ data }) => {
        if (data?.length) setLocalDiscs(data.map(d => ({ ...d, slots: d.slots||[] })));
      });
  }, [studioId, discs?.length]);

  useEffect(() => {
    if (!studioId) return;
    setDbLoading(true);
    const sb = createClient();
    sb.from("sessions")
      .select("id, discipline_id, teacher, room, level, session_date, session_time, duration_min, spots, status")
      .eq("studio_id", studioId).order("session_date").order("session_time")
      .then(async ({ data, error }) => {
        if (error) { console.error("load sessions", error); setDbLoading(false); return; }
        if (!data || data.length === 0) { setSessions(SESSIONS_DEMO); setIsDemoData(true); setDbLoading(false); return; }
        const mapped = data.map(s => ({
          id: s.id, disciplineId: s.discipline_id,
          teacher: s.teacher || "", room: s.room || "Studio A", level: s.level || "Tous niveaux",
          date: s.session_date, time: s.session_time?.slice(0,5) || "09:00",
          duration: s.duration_min || 60, spots: s.spots || 12,
          status: s.status || "scheduled", booked: 0, waitlist: 0,
        }));
        const sessionIds = mapped.map(s => s.id);
        const { data: bkData } = await sb.from("bookings")
          .select("id, session_id, member_id, status, attended, members(first_name, last_name, email, phone)")
          .in("session_id", sessionIds);
        const map = {};
        (bkData || []).forEach(b => {
          if (!map[b.session_id]) map[b.session_id] = [];
          map[b.session_id].push({
            id: b.id, memberId: b.member_id, st: b.status, attended: b.attended ?? null,
            name: b.members ? `${b.members.first_name || ""} ${b.members.last_name || ""}`.trim() : "—",
            email: b.members?.email || "", phone: b.members?.phone || "",
          });
        });
        setBookings(map);
        setSessions(mapped.map(s => ({
          ...s,
          booked:   (map[s.id] || []).filter(b => b.st === "confirmed").length,
          waitlist: (map[s.id] || []).filter(b => b.st === "waitlist").length,
        })));
        setDbLoading(false);
      });
  }, [studioId]);

  // Recalcule le preview quand les paramètres récurrence changent
  useEffect(() => {
    if (!recMode || !recFrom || !recTo || recSlots.length === 0) { setRecPreview([]); return; }
    const from = new Date(recFrom); from.setHours(0,0,0,0);
    const toRaw = new Date(recTo); toRaw.setHours(23,59,59,0);
    const maxTo = new Date(from); maxTo.setMonth(maxTo.getMonth() + 3);
    const to = toRaw > maxTo ? maxTo : toRaw;
    if (from > to) { setRecPreview([]); return; }
    const generated = [];
    recSlots.forEach(slot => {
      const targetDay = DAY_NUM[slot.day];
      const cur = new Date(from);
      // Avancer jusqu'au bon jour de la semaine
      while (cur.getDay() !== targetDay) cur.setDate(cur.getDate() + 1);
      while (cur <= to) {
        generated.push({
          id: Date.now() + Math.random(),
          disciplineId: slot.disciplineId,
          teacher: slot.teacher || nS.teacher || "",
          date: cur.toISOString().slice(0,10),
          time: slot.time,
          duration: slot.duration || 60,
          spots: nS.spots || 12,
          level: nS.level || "Tous niveaux",
          room: nS.room || "Studio A",
          booked: 0, waitlist: 0,
        });
        cur.setDate(cur.getDate() + 7); // semaine suivante
      }
    });
    generated.sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    setRecPreview(generated);
  }, [recMode, recFrom, recTo, recSlots, nS.teacher, nS.spots, nS.level, nS.room]);

  const filtered = fd ? sessions.filter(s=>s.disciplineId===fd) : sessions;

  const dates = [...new Set(filtered.map(s=>s.date))].sort();

  const addSession = async () => {
    if (!nS.date || !studioId) return;
    const sess = { ...nS, disciplineId: nS.disciplineId || null };
    const tempId = `tmp-${Date.now()}`;
    setSessions(prev => [...prev, { id:tempId, ...sess, booked:0, waitlist:0 }]);
    setShowAdd(false);
    setNS({ disciplineId:"", teacher:"", date:"", time:"09:00", duration:60, spots:12, level:"Tous niveaux", room:"Studio A" });
    try {
      const sb = createClient();
      console.log("INSERT session — studioId:", studioId, "disciplineId:", sess.disciplineId, "date:", sess.date);
      const { data, error } = await sb.from("sessions").insert({
        studio_id: studioId, discipline_id: sess.disciplineId || null,
        teacher: sess.teacher || "", room: sess.room || "Studio A", level: sess.level || "Tous niveaux",
        session_date: sess.date, session_time: sess.time,
        duration_min: parseInt(sess.duration) || 60, spots: parseInt(sess.spots) || 12,
        status: "scheduled",
      }).select("id").single();
      if (error) {
        console.error("insert session ERROR — code:", error.code, "msg:", error.message, "hint:", error.hint);
        setSessions(prev=>prev.filter(s=>s.id!==tempId));
        alert("❌ Erreur Supabase:\n" + error.message + "\nCode: " + error.code + (error.hint ? "\nHint: " + error.hint : ""));
      } else if (data?.id) {
        if (isDemoData) {
          setSessions([{ id:data.id, ...sess, booked:0, waitlist:0 }]);
          setIsDemoData(false);
        } else {
          setSessions(prev => prev.map(s => s.id===tempId ? {...s, id:data.id} : s));
        }
      }
    } catch(e) { console.error("insert session", e); setSessions(prev=>prev.filter(s=>s.id!==tempId)); }
  };

  const deleteSession = async (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (!studioId) return;
    try { await createClient().from("sessions").delete().eq("id", id); }
    catch(e) { console.error("delete session", e); }
  };

  const cancelSession = async (id) => {
    setSessions(prev => prev.map(s => s.id===id ? {...s, status:"cancelled"} : s));
    if (!studioId) return;
    try { await createClient().from("sessions").update({ status:"cancelled" }).eq("id", id); }
    catch(e) { console.error("cancel session", e); }
  };

  const addRecurringSessions = async () => {
    if (recPreview.length === 0 || !studioId) return;
    setSessions(prev => [...prev, ...recPreview]);
    setShowAdd(false); setRecMode(false);
    setRecFrom(""); setRecTo(""); setRecSlots([]); setRecPreview([]);
    try {
      const rows = recPreview.map(s => ({
        studio_id: studioId, discipline_id: s.disciplineId || null,
        teacher: s.teacher || "", room: s.room || "Studio A", level: s.level || "Tous niveaux",
        session_date: s.date, session_time: s.time,
        duration_min: parseInt(s.duration) || 60, spots: parseInt(s.spots) || 12,
        status: "scheduled",
      }));
      const { error } = await createClient().from("sessions").insert(rows);
      if (error) console.error("insert recurring", error);
      else if (isDemoData) {
        // Remplacer les démos par les vraies données récurrentes
        setSessions(recPreview);
        setIsDemoData(false);
      }
    } catch(e) { console.error("insert recurring", e); }
  };

  const handleToggle = (id) => setExpandedId(prev => prev===id ? null : id);

  const handleChangeStatus = (bid, sid, ns) => {
    setBookings(prev => {
      const nb = { ...prev };
      nb[sid] = (nb[sid]||[]).map(b => b.id===bid ? { ...b, st:ns } : b);
      return nb;
    });
  };

  const handleAddBooking = (sessId) => {
    setAddBookingModal(sessId);
    setMemberSearch(""); setMemberResults([]);
  };

  const searchMembers = async (q) => {
    setMemberSearch(q);
    if (!q || q.length < 2) { setMemberResults([]); return; }
    setSearchLoading(true);
    const { data } = await createClient().from("members")
      .select("id, first_name, last_name, email, phone")
      .eq("studio_id", studioId)
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(8);
    setMemberResults(data || []);
    setSearchLoading(false);
  };

  const confirmAddBooking = async (member) => {
    const sessId = addBookingModal;
    const sess = sessions.find(s => s.id === sessId);
    if (!sess || !member) return;
    const isFull = sess.booked >= sess.spots;
    const { data, error } = await createClient().from("bookings").insert({
      session_id: sessId,
      member_id: member.id,
      status: isFull ? "waitlist" : "confirmed",
    }).select().single();
    if (!error && data) {
      const newB = { id: data.id, memberId: member.id, st: data.status, attended: null,
        name: `${member.first_name || ""} ${member.last_name || ""}`.trim(),
        email: member.email || "", phone: member.phone || "" };
      setBookings(prev => ({ ...prev, [sessId]: [...(prev[sessId]||[]), newB] }));
      setSessions(prev => prev.map(s => s.id===sessId ? { ...s, booked: s.booked + (data.status==="confirmed"?1:0) } : s));
    }
    setAddBookingModal(null);
  };

  const handleSendReminder = async (sessId) => {
    const sess = sessions.find(s=>s.id===sessId);
    const bl = (bookings[sessId]||[]).filter(b=>b.st==="confirmed");
    if (!bl.length) return;
    try {
      await fetch("/api/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessId, studioId, members: bl.map(b=>({ email:b.email, name:b.name })), sess }),
      });
    } catch(e) { console.error("reminder", e); }
  };

  return (
    <div>
      {isDemoData && <DemoBanner/>}

      {/* ── Modale inscrire un adhérent ── */}
      {addBookingModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={()=>setAddBookingModal(null)}>
          <div style={{ background:C.surface, borderRadius:16, padding:24, width:"100%", maxWidth:420, boxShadow:"0 8px 40px rgba(0,0,0,.18)" }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:17, fontWeight:800, color:C.text, marginBottom:16 }}>Inscrire un adhérent</div>
            <input
              autoFocus
              placeholder="Rechercher par nom ou email…"
              value={memberSearch}
              onChange={e=>searchMembers(e.target.value)}
              style={{ width:"100%", padding:"10px 14px", borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 }}
            />
            {searchLoading && <div style={{ fontSize:13, color:C.textMuted, padding:"4px 0" }}>Recherche…</div>}
            {memberResults.length > 0 && (
              <div style={{ borderRadius:9, border:`1px solid ${C.borderSoft}`, overflow:"hidden" }}>
                {memberResults.map(m => (
                  <div key={m.id}
                    onClick={()=>confirmAddBooking(m)}
                    style={{ padding:"10px 14px", cursor:"pointer", borderBottom:`1px solid ${C.borderSoft}`, transition:"background .1s" }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.accentBg}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{m.first_name} {m.last_name}</div>
                    <div style={{ fontSize:12, color:C.textMuted }}>{m.email} {m.phone ? "· "+m.phone : ""}</div>
                  </div>
                ))}
              </div>
            )}
            {memberSearch.length >= 2 && !searchLoading && memberResults.length === 0 && (
              <div style={{ fontSize:13, color:C.textMuted, textAlign:"center", padding:"12px 0" }}>Aucun adhérent trouvé</div>
            )}
            <button onClick={()=>setAddBookingModal(null)}
              style={{ marginTop:14, width:"100%", padding:"9px", borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", color:C.textSoft, fontSize:14, cursor:"pointer" }}>
              Annuler
            </button>
          </div>
        </div>
      )}
      <div style={{ padding:p }}>
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:18, alignItems:"center", WebkitOverflowScrolling:"touch" }}>
        <Button sm variant={fd===null?"primary":"ghost"} onClick={()=>setFd(null)}>Toutes</Button>
        {((discs?.length ? discs : DISCIPLINES)).map(d=>{ const Ico=DISC_ICONS[d.id]; return <Button key={d.id} sm variant={fd===d.id?"primary":"ghost"} onClick={()=>setFd(d.id)}><span style={{display:"flex",alignItems:"center",gap:5}}>{Ico&&<Ico s={13} c={fd===d.id?C.surface:d.color}/>}{d.name}</span></Button>; })}
        <div style={{ marginLeft:"auto", flexShrink:0 }}><Button sm variant="primary" onClick={()=>{
          const allD = (discs?.length ? discs : DISCIPLINES);
          if (!showAdd && allD.length > 0 && !nS.disciplineId) {
            setNS(prev => ({ ...prev, disciplineId: String(allD[0].id) }));
          }
          setShowAdd(!showAdd);
        }}>＋ Séance</Button></div>
      </div>

      {showAdd && (
        <Card style={{ marginBottom:18, borderTop:`3px solid ${C.accent}` }}>
          {/* Toggle séance unique / récurrence */}
          <div style={{ display:"flex", gap:6, marginBottom:18 }}>
            <button onClick={()=>setRecMode(false)}
              style={{ flex:1, padding:"8px", borderRadius:8, border:`1.5px solid ${recMode?C.border:C.accent}`, background:recMode?"none":C.accentLight, color:recMode?C.textMuted:C.accent, fontSize:13, fontWeight:recMode?400:700, cursor:"pointer" }}>
              <span style={{display:"flex",alignItems:"center",gap:6}}><IcoCalendar2 s={14} c="inherit"/> Séance unique</span>
            </button>
            <button onClick={()=>setRecMode(true)}
              style={{ flex:1, padding:"8px", borderRadius:8, border:`1.5px solid ${recMode?C.accent:C.border}`, background:recMode?C.accentLight:"none", color:recMode?C.accent:C.textMuted, fontSize:13, fontWeight:recMode?700:400, cursor:"pointer" }}>
              <span style={{display:"flex",alignItems:"center",gap:6}}><IcoActivity s={14} c="inherit"/> Récurrence</span>
            </button>
          </div>

          {/* ── MODE SÉANCE UNIQUE ── */}
          {!recMode && (
            <>
              <div style={{ fontSize:13, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:.5, marginBottom:14 }}>Créer une séance</div>
              <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:14 }}>
                <DiscSelect label="Discipline" value={nS.disciplineId} C={C}
                  options={((discs?.length ? discs : DISCIPLINES)).map(d=>({id:String(d.id), name:d.name, icon:d.icon, color:d.color}))}
                  onChange={v=>{
                  const allD = (discs?.length ? discs : DISCIPLINES);
                  const disc = allD.find(d=>String(d.id)===String(v));
                  const slot = disc?.slots?.[0];
                  setNS({...nS, disciplineId:v, ...(slot?{time:slot.time, duration:slot.duration||60}:{})});
                }}/>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5}}>Professeur</label>
                  <select value={nS.teacher} onChange={e=>setNS({...nS,teacher:e.target.value})}
                    style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:14,color:C.text,background:C.surface,outline:"none",boxSizing:"border-box"}}>
                    <option value="">— Choisir un coach —</option>
                    {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    {coachesList.length === 0 && <option disabled>Aucun coach configuré</option>}
                  </select>
                </div>
                <DatePicker label="Date" value={nS.date} onChange={v=>setNS({...nS,date:v})}/>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.8,marginBottom:5}}>Heure</div>
                  <TimePicker value={nS.time} onChange={v=>setNS({...nS,time:v})}/>
                </div>
                <Field label="Durée (min)" type="number" value={nS.duration} onChange={v=>setNS({...nS,duration:v})}/>
                <Field label="Places" type="number" value={nS.spots} onChange={v=>setNS({...nS,spots:v})}/>
                <Field label="Niveau" value={nS.level} onChange={v=>setNS({...nS,level:v})} opts={["Tous niveaux","Débutant","Intermédiaire","Avancé"]}/>
                <Field label="Salle" value={nS.room} onChange={v=>setNS({...nS,room:v})} placeholder="Studio A"/>
              </div>
              <div style={{ marginTop:16, display:"flex", gap:10 }}>
                <Button variant="primary" onClick={addSession}>Créer la séance</Button>
                <Button variant="ghost" onClick={()=>setShowAdd(false)}>Annuler</Button>
              </div>
            </>
          )}

          {/* ── MODE RÉCURRENCE ── */}
          {recMode && (() => {
            // Utiliser les discs du context (modifiés dans DisciplinesPage)
            const allSlotsRaw = (effectiveDiscs||[]).flatMap(d =>
              (d.slots||[]).map((s,i) => ({ key:`${d.id}-${i}`, disciplineId:d.id, discName:d.name, discColor:d.color||C.accent, discIcon:d.icon||"🏃", day:s.day, time:s.time, duration:s.duration||60, teacher:"" }))
            );
            // Filtre par discipline
            const allSlots = recFilterDisc ? allSlotsRaw.filter(s=>s.disciplineId===recFilterDisc) : allSlotsRaw;
            const isSelected = (k) => recSlots.some(s=>s.key===k);
            const dayLabel = (d) => ({Lun:"Lundi",Mar:"Mardi",Mer:"Mercredi",Jeu:"Jeudi",Ven:"Vendredi",Sam:"Samedi",Dim:"Dimanche"}[d]||d);

            // Sélectionner/désélectionner un créneau
            const toggleSlot = (slot) => {
              setRecSlots(prev => isSelected(slot.key)
                ? prev.filter(s=>s.key!==slot.key)
                : [...prev, {...slot, teacher: nS.teacher}]
              );
            };

            // Changer le coach d'un créneau sélectionné
            const updateSlotCoach = (key, teacher) => {
              setRecSlots(prev => prev.map(s => s.key===key ? {...s, teacher} : s));
            };

            // Supprimer une séance précise dans le preview
            const removePreviewItem = (previewId) => {
              setRecPreview(prev => prev.filter(s => s.id !== previewId));
            };

            // Changer le coach d'une séance précise dans le preview
            const updatePreviewCoach = (previewId, teacher) => {
              setRecPreview(prev => prev.map(s => s.id===previewId ? {...s, teacher} : s));
            };

            return (
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.accent, textTransform:"uppercase", letterSpacing:.5, marginBottom:14 }}>Générer des séances récurrentes</div>

                {/* ── ÉTAPE 1 : Créneaux ── */}
                <div style={{ marginBottom:4 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8 }}>
                        1 · Créneaux à inclure
                      </div>
                      {allSlots.length > 0 && (() => {
                        const allSelected = allSlots.every(s => isSelected(s.key));
                        return (
                          <button onClick={()=>{
                            if (allSelected) {
                              setRecSlots(prev => prev.filter(s => !allSlots.some(sl => sl.key===s.key)));
                            } else {
                              const toAdd = allSlots.filter(s => !isSelected(s.key)).map(s=>({...s, teacher:nS.teacher}));
                              setRecSlots(prev => [...prev, ...toAdd]);
                            }
                          }} style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:8, border:`1.5px solid ${allSelected?C.accent:C.border}`, background:allSelected?C.accentLight:"transparent", color:allSelected?C.accentDark:C.textMid, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                            {allSelected ? "✓ Tout désélectionner" : "Tout sélectionner"}
                          </button>
                        );
                      })()}
                    </div>
                    {allSlotsRaw.length > 0 && (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        <button onClick={()=>setRecFilterDisc(null)}
                          style={{ padding:"4px 10px", borderRadius:20, border:`1.5px solid ${!recFilterDisc?C.accent:C.border}`, background:!recFilterDisc?C.accentLight:"transparent", color:!recFilterDisc?C.accentDark:C.textMid, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                          Toutes
                        </button>
                        {(effectiveDiscs||[]).filter(d=>(d.slots||[]).length>0).map(d=>{
                          const active = recFilterDisc===d.id;
                          return (
                            <button key={d.id} onClick={()=>setRecFilterDisc(active?null:d.id)}
                              style={{ padding:"4px 10px", borderRadius:20, border:`1.5px solid ${active?(d.color||C.accent):C.border}`, background:active?`${d.color||C.accent}18`:"transparent", color:active?(d.color||C.accent):C.textMid, fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                              {d.icon||""} {d.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {allSlotsRaw.length === 0 ? (
                    <div style={{ padding:"14px", background:"#FFF8F0", borderRadius:10, border:`1px dashed ${C.border}`, fontSize:13, color:C.textSoft, marginBottom:12 }}>
                      {recFilterDisc
                        ? <>ℹ Aucun créneau pour cette discipline. Allez dans <strong>Disciplines</strong> pour en ajouter.</>
                        : <>ℹ Aucun créneau configuré. Allez dans <strong>Disciplines</strong> pour définir les horaires.</>
                      }
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
                      {allSlots.map(slot => {
                        const sel = isSelected(slot.key);
                        const selSlot = recSlots.find(s=>s.key===slot.key);
                        const slotColor = slot.discColor || C.accent;
                        return (
                          <div key={slot.key} style={{ borderRadius:12, border:`2px solid ${sel ? slotColor : C.border}`, background:sel ? `${slotColor}0D` : C.surface, overflow:"hidden", transition:"all .15s" }}>
                            <div onClick={()=>toggleSlot(slot)} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", cursor:"pointer" }}>
                              {/* Checkbox custom */}
                              <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${sel ? slotColor : C.border}`, background:sel ? slotColor : "transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
                                {sel && <span style={{ color:"#fff", fontSize:13, fontWeight:800, lineHeight:1 }}>✓</span>}
                              </div>
                              {/* Icône discipline */}
                              <span style={{ width:32, height:32, borderRadius:8, background:`${slotColor}20`, border:`1.5px solid ${slotColor}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{slot.discIcon}</span>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:13, fontWeight:700, color: sel ? slotColor : C.text }}>{slot.discName}</div>
                                <div style={{ fontSize:11, color:C.textSoft, marginTop:1 }}>
                                  <span style={{ fontWeight:600 }}>{dayLabel(slot.day)}</span> · {slot.time} · {slot.duration} min
                                </div>
                              </div>
                              {sel && <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:8, background:slotColor, color:"#fff", flexShrink:0 }}>✓ Sélectionné</span>}
                            </div>
                            {sel && (
                              <div style={{ borderTop:`1px solid ${slotColor}30`, padding:"8px 14px 10px", display:"flex", alignItems:"center", gap:10, background:`${slotColor}08` }}>
                                <span style={{ fontSize:11, fontWeight:700, color:slotColor, flexShrink:0, textTransform:"uppercase", letterSpacing:.6 }}>Coach</span>
                                <select value={selSlot?.teacher||""} onChange={e=>updateSlotCoach(slot.key, e.target.value)}
                                  style={{ flex:1, padding:"6px 10px", border:`1.5px solid ${slotColor}50`, borderRadius:7, fontSize:13, color:C.text, background:C.surface, outline:"none" }}>
                                  <option value="">— Coach par défaut ({nS.teacher||"non défini"}) —</option>
                                  {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── ÉTAPE 2 : Coach par défaut + paramètres ── */}
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>2 · Paramètres</div>
                <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`, gap:12, marginBottom:16 }}>
                  <div style={{ gridColumn:"span 2" }}>
                    <label style={{fontSize:11,fontWeight:700,color:C.textMuted,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5}}>Coach par défaut</label>
                    <select value={nS.teacher} onChange={e=>{
                        const t = e.target.value;
                        setNS(s=>({...s,teacher:t}));
                        // Appliquer aux créneaux sans coach spécifique
                        setRecSlots(prev=>prev.map(s=>(!s.teacher)?{...s,teacher:t}:s));
                      }}
                      style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:14,color:C.text,background:C.surface,outline:"none",boxSizing:"border-box"}}>
                      <option value="">— Choisir un coach —</option>
                      {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <Field label="Places" type="number" value={nS.spots} onChange={v=>setNS({...nS,spots:v})}/>
                  <Field label="Salle" value={nS.room} onChange={v=>setNS({...nS,room:v})} placeholder="Studio A"/>
                </div>

                {/* ── ÉTAPE 3 : Période ── */}
                <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>3 · Période</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                  <DatePicker label="Du" value={recFrom} onChange={v=>setRecFrom(v)}/>
                  <DatePicker label="Au" value={recTo} onChange={v=>{
                    if (recFrom) {
                      const max = new Date(recFrom);
                      max.setMonth(max.getMonth() + 3);
                      const chosen = new Date(v);
                      setRecTo(chosen > max ? max.toISOString().slice(0,10) : v);
                    } else setRecTo(v);
                  }} minDate={recFrom} maxDate={recFrom ? (() => { const d=new Date(recFrom); d.setMonth(d.getMonth()+3); return d.toISOString().slice(0,10); })() : undefined}/>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>⚠ Période max 3 mois</div>
                </div>

                {/* ── PRÉVISUALISATION éditable ── */}
                {recPreview.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.8 }}>
                        4 · Séances générées
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:"#3A6E46", background:"#EAF5EC", border:"1px solid #A8D5B0", borderRadius:6, padding:"2px 8px" }}>
                        {recPreview.length} séance{recPreview.length>1?"s":""}
                      </span>
                    </div>
                    <div style={{ maxHeight:280, overflowY:"auto", display:"flex", flexDirection:"column", gap:4, paddingRight:2 }}>
                      {recPreview.map((s) => {
                        const disc = DISCIPLINES.find(d=>d.id===s.disciplineId)||DISCIPLINES[0];
                        const d = new Date(s.date);
                        const label = d.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
                        return (
                          <div key={s.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", background:"#F8FBF8", border:"1px solid #D4E8D6", borderRadius:8 }}>
                            <span style={{fontSize:13,flexShrink:0}}>{disc.icon}</span>
                            <span style={{fontSize:12,fontWeight:600,color:"#2A5E38",flex:"0 0 160px",whiteSpace:"nowrap"}}>{label} · {s.time} · {s.duration}min</span>
                            {/* Coach modifiable par séance */}
                            <select value={s.teacher||""} onChange={e=>updatePreviewCoach(s.id, e.target.value)}
                              style={{flex:1,padding:"4px 8px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:12,color:C.text,background:"#fff",outline:"none",minWidth:0}}>
                              <option value="">— coach —</option>
                              {coachesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            {/* Bouton supprimer */}
                            <button onClick={()=>removePreviewItem(s.id)}
                              style={{background:"none",border:"none",cursor:"pointer",padding:"2px 4px",color:"#F87171",fontSize:16,lineHeight:1,flexShrink:0}}
                              title="Supprimer cette séance">
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display:"flex", gap:10 }}>
                  <Button variant="primary" onClick={addRecurringSessions} disabled={recPreview.length===0}>
                    ✦ Créer {recPreview.length>0?`${recPreview.length} séance${recPreview.length>1?"s":""}`:"les séances"}
                  </Button>
                  <Button variant="ghost" onClick={()=>setShowAdd(false)}>Annuler</Button>
                </div>
              </div>
            );
          })()}
        </Card>
      )}

      {dates.map(date=>(
        <div key={date} style={{ marginBottom:22 }}>
          <DateLabel date={date}/>
          {filtered.filter(s=>s.date===date).map(s=>(
            <PlanningSessionCard
              key={s.id}
              sess={s}
              expandedId={expandedId}
              bookings={bookings}
              discs={discs}
              onToggle={handleToggle}
              onChangeStatus={handleChangeStatus}
              onAddBooking={handleAddBooking}
              onSendReminder={handleSendReminder}
              onDelete={deleteSession}
              onCancel={cancelSession}
            />
          ))}
        </div>
      ))}
    </div>
    </div>
  );
}


export { Planning, PlanningSessionCard };