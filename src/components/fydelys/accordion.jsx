"use client";

import React from "react";
import { C } from "./theme";
import { IcoCheck, IcoX, IcoUndo, IcoUserPlus, IcoMail } from "./icons";
import { CreditBadge } from "./ui";

export function stLbl(s) { return s==="confirmed"?"Confirmé":s==="waitlist"?"En attente":"Annulé"; }
export function stStyle(s) {
  if (s==="confirmed") return { color:C.ok,    background:C.okBg    };
  if (s==="waitlist")  return { color:C.accent, background:C.accentBg };
  return { color:C.warn, background:C.warnBg };
}

export function PlanningAccordion({ sessId, bookings, onChangeStatus, onAddBooking, onSendReminder }) {
  const bl   = bookings[sessId] || [];
  const conf = bl.filter(b=>b.st==="confirmed");
  const wait = bl.filter(b=>b.st==="waitlist");
  const canc = bl.filter(b=>b.st==="cancelled");

  if (!bl.length) return (
    <div style={{ padding:"20px", textAlign:"center", color:C.textMuted, fontSize:15, borderTop:`1px solid ${C.borderSoft}`, background:"#FDFAF7" }}>
      Aucune réservation pour cette séance
    </div>
  );

  return (
    <div style={{ borderTop:`1px solid ${C.borderSoft}`, background:"#FDFAF7" }}>
      <div style={{ display:"flex", gap:5, padding:"8px 13px 0", flexWrap:"wrap" }}>
        <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.ok, background:C.okBg }}>{conf.length} confirmé{conf.length>1?"s":""}</span>
        {wait.length>0 && <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.accent, background:C.accentBg }}>{wait.length} en attente</span>}
        {canc.length>0 && <span style={{ fontSize:12, fontWeight:700, padding:"2px 9px", borderRadius:20, color:C.warn, background:C.warnBg }}>{canc.length} annulé{canc.length>1?"s":""}</span>}
      </div>
      {bl.map(b => (
        <div key={b.id}
          style={{ padding:"10px 13px", borderBottom:`1px solid ${C.borderSoft}`, opacity:b.st==="cancelled"?.45:1, transition:"background .1s" }}
          onMouseEnter={e=>e.currentTarget.style.background="#F5F0EA"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:6 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:C.accentBg, border:`1px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:C.accent, flexShrink:0 }}>{b.fn?.[0]}{b.ln?.[0]}</div>
            <div style={{ fontSize:15, fontWeight:700, color:C.text, flex:1 }}>{b.fn} {b.ln}</div>
            <CreditBadge credits={b.credits} total={b.total} sub={b.sub}/>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, paddingLeft:39 }}>
            <span style={{ padding:"3px 10px", borderRadius:20, fontSize:13, fontWeight:600, whiteSpace:"nowrap", flexShrink:0, ...stStyle(b.st) }}>{stLbl(b.st)}</span>
            <span style={{ fontSize:13, color:C.textSoft, flex:1 }}>{b.phone}</span>
            <div style={{ flexShrink:0 }}>
              {b.st==="waitlist"  && <button onClick={()=>onChangeStatus(b.id,sessId,"confirmed")} style={{ display:"flex",alignItems:"center",gap:5, fontSize:12, padding:"4px 12px", borderRadius:7, fontWeight:600, border:`1px solid #B8DFC4`, color:C.ok,   background:C.okBg,   cursor:"pointer", whiteSpace:"nowrap" }}><IcoCheck s={13} c={C.ok}/>Confirmer</button>}
              {b.st==="confirmed" && <button onClick={()=>onChangeStatus(b.id,sessId,"cancelled")} style={{ display:"flex",alignItems:"center",gap:5, fontSize:12, padding:"4px 12px", borderRadius:7, fontWeight:600, border:`1px solid #EFC8BC`, color:C.warn, background:C.warnBg, cursor:"pointer", whiteSpace:"nowrap" }}><IcoX s={13} c={C.warn}/>Annuler</button>}
              {b.st==="cancelled" && <button onClick={()=>onChangeStatus(b.id,sessId,"confirmed")} style={{ display:"flex",alignItems:"center",gap:5, fontSize:12, padding:"4px 12px", borderRadius:7, fontWeight:600, border:`1px solid #B8CED8`, color:C.info, background:C.infoBg, cursor:"pointer", whiteSpace:"nowrap" }}><IcoUndo s={13} c={C.info}/>Remettre</button>}
            </div>
          </div>
        </div>
      ))}
      <div style={{ padding:"8px 13px", display:"flex", gap:7, flexWrap:"wrap" }}>
        <button onClick={()=>onAddBooking&&onAddBooking(sessId)} style={{ display:"flex",alignItems:"center",gap:6, fontSize:12, padding:"5px 12px", borderRadius:8, fontWeight:600, border:`1px solid #DFC0A0`, color:C.accentDark, background:C.accentBg, cursor:"pointer" }}><IcoUserPlus s={14} c={C.accentDark}/>Inscrire un adhérent</button>
        <button onClick={()=>onSendReminder&&onSendReminder(sessId)} style={{ display:"flex",alignItems:"center",gap:6, fontSize:12, padding:"5px 12px", borderRadius:8, fontWeight:600, border:`1px solid ${C.border}`, color:C.textSoft, background:C.surfaceWarm, cursor:"pointer" }}><IcoMail s={14} c={C.textSoft}/>Envoyer rappel</button>
      </div>
    </div>
  );
}
