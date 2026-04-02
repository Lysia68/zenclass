"use client";

import React, { useState, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { Button } from "./ui";

const STEPS = [
  { key:"welcome",     title:"Bienvenue !",        icon:"🎉", desc:"Configurons votre studio en quelques étapes" },
  { key:"disciplines", title:"Vos disciplines",     icon:"🧘", desc:"Quels cours proposez-vous ?" },
  { key:"rooms",       title:"Vos salles",          icon:"🏠", desc:"Où se déroulent vos cours ?" },
  { key:"schedule",    title:"Premier cours",       icon:"📅", desc:"Créez votre première séance" },
  { key:"done",        title:"C'est parti !",       icon:"🚀", desc:"Votre studio est prêt" },
];

const DISC_TEMPLATES = [
  { name:"Yoga Vinyasa", icon:"🧘", color:"#C4956A" },
  { name:"Pilates",      icon:"⚡", color:"#6B9E7A" },
  { name:"Méditation",   icon:"☯",  color:"#6A8FAE" },
  { name:"Yin Yoga",     icon:"🌙", color:"#AE7A7A" },
  { name:"Stretching",   icon:"🤸", color:"#9B8EC4" },
  { name:"Yoga Hatha",   icon:"🧘", color:"#D4A276" },
  { name:"Danse",        icon:"💃", color:"#E0829B" },
  { name:"Fitness",      icon:"💪", color:"#5CB85C" },
  { name:"Barre au sol", icon:"🩰", color:"#C48AB0" },
  { name:"Sophrologie",  icon:"🌿", color:"#7BAF7B" },
];

function StudioOnboarding({ onComplete, isMobile }) {
  const { studioId, studioName } = useContext(AppCtx);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Disciplines
  const [selectedDiscs, setSelectedDiscs] = useState([]);
  const [customDisc, setCustomDisc] = useState("");

  // Salles
  const [rooms, setRooms] = useState([{ name:"Studio A", capacity:12 }]);

  const toggleDisc = (d) => {
    setSelectedDiscs(prev =>
      prev.some(x => x.name === d.name) ? prev.filter(x => x.name !== d.name) : [...prev, d]
    );
  };

  const addRoom = () => {
    if (rooms.length >= 5) return;
    const letters = ["A","B","C","D","E"];
    setRooms(prev => [...prev, { name:`Salle ${letters[prev.length]||prev.length+1}`, capacity:10 }]);
  };

  const saveAll = async () => {
    if (!studioId) return;
    setSaving(true);
    const sb = createClient();

    // 1. Créer les disciplines
    if (selectedDiscs.length > 0) {
      for (const d of selectedDiscs) {
        await sb.from("disciplines").insert({
          studio_id: studioId, name: d.name, icon: d.icon, color: d.color, slots: [],
        });
      }
    }

    // 2. Créer les salles
    for (const r of rooms) {
      if (r.name.trim()) {
        await sb.from("rooms").insert({
          studio_id: studioId, name: r.name.trim(), capacity: r.capacity || 10,
        });
      }
    }

    setSaving(false);
    setStep(STEPS.length - 1); // → "C'est parti !"
  };

  const currentStep = STEPS[step];
  const progress = Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(42,31,20,.6)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:C.surface, borderRadius:20, width:"100%", maxWidth:520, maxHeight:"90vh", overflow:"hidden", boxShadow:"0 24px 80px rgba(42,31,20,.25)" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#2A1F14,#5C3D20)", padding:"28px 28px 20px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:8 }}>{currentStep.icon}</div>
          <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>{currentStep.title}</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,.6)" }}>{currentStep.desc}</div>
          {/* Progress bar */}
          <div style={{ marginTop:16, height:4, background:"rgba(255,255,255,.15)", borderRadius:2 }}>
            <div style={{ height:"100%", width:`${progress}%`, background:"#F5D5A8", borderRadius:2, transition:"width .3s" }}/>
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:6 }}>Étape {step + 1} / {STEPS.length}</div>
        </div>

        {/* Body */}
        <div style={{ padding:"24px 28px", maxHeight:"50vh", overflowY:"auto" }}>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:15, color:C.text, lineHeight:1.7, marginBottom:16 }}>
                Bienvenue sur <strong>Fydelys</strong>, {studioName || "votre studio"} !
              </div>
              <div style={{ fontSize:14, color:C.textSoft, lineHeight:1.7 }}>
                En quelques clics, configurez vos disciplines, vos salles et planifiez votre premier cours. Vous pourrez tout modifier ensuite.
              </div>
            </div>
          )}

          {/* Step 1: Disciplines */}
          {step === 1 && (
            <div>
              <div style={{ fontSize:13, color:C.textSoft, marginBottom:14 }}>Sélectionnez vos disciplines ou ajoutez les vôtres :</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                {DISC_TEMPLATES.map(d => {
                  const sel = selectedDiscs.some(x => x.name === d.name);
                  return (
                    <div key={d.name} onClick={() => toggleDisc(d)}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, border:`2px solid ${sel?d.color:C.border}`, background:sel?`${d.color}14`:C.surface, cursor:"pointer", transition:"all .15s" }}>
                      <span style={{ fontSize:20 }}>{d.icon}</span>
                      <span style={{ fontSize:13, fontWeight:sel?700:500, color:sel?d.color:C.text }}>{d.name}</span>
                      {sel && <span style={{ marginLeft:"auto", fontSize:12, color:d.color }}>✓</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input value={customDisc} onChange={e => setCustomDisc(e.target.value)} placeholder="Autre discipline..."
                  style={{ flex:1, padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, outline:"none", background:C.surfaceWarm }}/>
                <button onClick={() => {
                  if (customDisc.trim()) {
                    setSelectedDiscs(prev => [...prev, { name:customDisc.trim(), icon:"✦", color:"#A06838" }]);
                    setCustomDisc("");
                  }
                }} style={{ padding:"9px 16px", borderRadius:8, border:"none", background:C.accent, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>+</button>
              </div>
              {selectedDiscs.length > 0 && (
                <div style={{ marginTop:12, display:"flex", flexWrap:"wrap", gap:6 }}>
                  {selectedDiscs.map(d => (
                    <span key={d.name} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:20, background:`${d.color}18`, border:`1px solid ${d.color}40`, fontSize:12, fontWeight:600, color:d.color }}>
                      {d.icon} {d.name}
                      <span onClick={() => setSelectedDiscs(prev => prev.filter(x => x.name !== d.name))} style={{ cursor:"pointer", fontSize:14 }}>×</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Rooms */}
          {step === 2 && (
            <div>
              <div style={{ fontSize:13, color:C.textSoft, marginBottom:14 }}>Configurez vos espaces de pratique :</div>
              {rooms.map((r, i) => (
                <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"center" }}>
                  <input value={r.name} onChange={e => setRooms(prev => prev.map((x,j) => j===i ? {...x, name:e.target.value} : x))}
                    placeholder="Nom de la salle"
                    style={{ flex:1, padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, outline:"none", background:C.surfaceWarm }}/>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:11, color:C.textMuted }}>Places</span>
                    <input type="number" min={1} max={30} value={r.capacity}
                      onChange={e => setRooms(prev => prev.map((x,j) => j===i ? {...x, capacity:Math.min(30,Math.max(1,parseInt(e.target.value)||1))} : x))}
                      style={{ width:60, padding:"9px 8px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, outline:"none", textAlign:"center", background:C.surfaceWarm }}/>
                  </div>
                  {rooms.length > 1 && (
                    <button onClick={() => setRooms(prev => prev.filter((_,j) => j!==i))}
                      style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:16 }}>×</button>
                  )}
                </div>
              ))}
              {rooms.length < 5 && (
                <button onClick={addRoom}
                  style={{ fontSize:12, padding:"6px 14px", borderRadius:8, border:`1.5px solid ${C.border}`, background:C.surface, color:C.accent, fontWeight:600, cursor:"pointer" }}>
                  + Ajouter une salle
                </button>
              )}
            </div>
          )}

          {/* Step 3: Schedule hint */}
          {step === 3 && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:14, color:C.text, lineHeight:1.7, marginBottom:16 }}>
                {selectedDiscs.length > 0
                  ? `Vos ${selectedDiscs.length} discipline${selectedDiscs.length>1?"s":""} et ${rooms.length} salle${rooms.length>1?"s":""} vont être créées.`
                  : "Aucune discipline sélectionnée — vous pourrez les ajouter plus tard dans Disciplines."
                }
              </div>
              <div style={{ fontSize:13, color:C.textSoft, lineHeight:1.7 }}>
                Après la configuration, rendez-vous dans le <strong>Planning</strong> pour créer vos premières séances et inviter vos membres.
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:15, color:C.text, fontWeight:700, marginBottom:8 }}>
                Votre studio est configuré !
              </div>
              <div style={{ fontSize:13, color:C.textSoft, lineHeight:1.7, marginBottom:12 }}>
                {selectedDiscs.length > 0 && `${selectedDiscs.length} discipline${selectedDiscs.length>1?"s créées":""} · `}
                {rooms.length} salle{rooms.length>1?"s":""} · Prêt à accueillir vos premiers membres
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:16 }}>
                <button onClick={() => { onComplete(); window.dispatchEvent(new CustomEvent("fydelys:nav", { detail:"planning" })); }}
                  style={{ padding:"12px", borderRadius:10, border:"none", background:C.accent, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                  📅 Créer ma première séance
                </button>
                <button onClick={() => { onComplete(); window.dispatchEvent(new CustomEvent("fydelys:nav", { detail:"members" })); }}
                  style={{ padding:"10px", borderRadius:10, border:`1.5px solid ${C.border}`, background:C.surface, color:C.textMid, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  👥 Ajouter des membres
                </button>
                <button onClick={onComplete}
                  style={{ padding:"8px", borderRadius:10, border:"none", background:"transparent", color:C.textMuted, fontSize:12, cursor:"pointer" }}>
                  Passer au tableau de bord
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        {step < STEPS.length - 1 && (
          <div style={{ padding:"16px 28px 24px", display:"flex", gap:10, justifyContent:"space-between" }}>
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)}
                style={{ padding:"10px 20px", borderRadius:10, border:`1.5px solid ${C.border}`, background:C.surface, color:C.textMid, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                ← Retour
              </button>
            ) : <div/>}
            {step === 3 ? (
              <button onClick={saveAll} disabled={saving}
                style={{ padding:"10px 24px", borderRadius:10, border:"none", background:C.accent, color:"#fff", fontSize:14, fontWeight:700, cursor:saving?"wait":"pointer" }}>
                {saving ? "Configuration..." : "Configurer mon studio ✦"}
              </button>
            ) : (
              <button onClick={() => setStep(s => s + 1)}
                style={{ padding:"10px 24px", borderRadius:10, border:"none", background:C.accent, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                {step === 0 ? "Commencer →" : "Suivant →"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { StudioOnboarding };
