// src/theme.js — Brand colours & global CSS for NutriBuddy

export const C = {
  green:      "#4CAF7D",
  greenDark:  "#3a9967",
  greenLight: "#e8f5ee",
  greenMid:   "#a8d8bc",
  orange:     "#F4883A",
  bg:         "#f0f9f4",
  card:       "#ffffff",
  border:     "#d6ede0",
  text:       "#1e3a2f",
  muted:      "#7aab90",
  danger:     "#e05252",
};

export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Lato:wght@300;400;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Lato',sans-serif;background:${C.bg};color:${C.text};min-height:100vh}
h1,h2,h3,h4{font-family:'Nunito',sans-serif;font-weight:800}
button{cursor:pointer;border:none;outline:none}
input,select,textarea{font-family:'Lato',sans-serif;outline:none}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:#eaf5ee}
::-webkit-scrollbar-thumb{background:${C.greenMid};border-radius:4px}

/* ═══════════════════════════════════════════════════
   APP SHELL
═══════════════════════════════════════════════════ */
.nb-app{display:flex;min-height:100vh}

/* ═══════════════════════════════════════════════════
   SIDEBAR — Desktop (≥1024px): full 220px fixed sidebar
═══════════════════════════════════════════════════ */
.nb-sidebar{
  width:220px;min-height:100vh;background:#fff;
  border-right:1.5px solid ${C.border};
  display:flex;flex-direction:column;padding:24px 0;
  position:fixed;top:0;left:0;z-index:200;
  transition:width .25s ease;
}
.nb-logo{display:flex;align-items:center;gap:10px;padding:0 20px 24px;border-bottom:1px solid ${C.border}}
.nb-logo-icon{width:40px;height:40px;border-radius:12px;background:${C.greenLight};
  display:flex;align-items:center;justify-content:center;font-size:22px}
.nb-logo-text{font-family:'Nunito',sans-serif;font-weight:900;font-size:18px;color:${C.green}}
.nb-logo-sub{font-size:10px;color:${C.muted};font-weight:400}

.nb-nav{flex:1;padding:16px 12px;overflow-y:auto}
.nb-nav-item{
  display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;
  cursor:pointer;transition:all .18s;color:${C.muted};font-size:14px;font-weight:600;
  margin-bottom:2px;white-space:nowrap;
}
.nb-nav-item:hover{background:${C.greenLight};color:${C.green}}
.nb-nav-item.active{background:${C.green};color:#fff}
.nb-nav-icon{font-size:17px;width:20px;text-align:center;flex-shrink:0}
.nb-nav-label{overflow:hidden;text-overflow:ellipsis}

.nb-sidebar-user{padding:16px 20px;border-top:1px solid ${C.border}}
.nb-sidebar-avatar{
  width:36px;height:36px;border-radius:50%;background:${C.green};
  color:#fff;display:flex;align-items:center;justify-content:center;
  font-weight:800;font-size:15px;flex-shrink:0;
}

/* ═══════════════════════════════════════════════════
   MAIN CONTENT — Desktop
═══════════════════════════════════════════════════ */
.nb-main{flex:1;margin-left:220px;padding:32px}

/* ═══════════════════════════════════════════════════
   MOBILE HEADER BAR (hidden on desktop/tablet)
═══════════════════════════════════════════════════ */
.nb-mobile-header{display:none}

/* ═══════════════════════════════════════════════════
   DRAWER (mobile slide-in panel)
═══════════════════════════════════════════════════ */
.nb-drawer-backdrop{
  display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);
  z-index:300;opacity:0;transition:opacity .25s;
}
.nb-drawer-backdrop.open{opacity:1}

.nb-drawer{
  display:none;position:fixed;top:0;left:0;bottom:0;
  width:260px;background:#fff;z-index:400;
  flex-direction:column;padding:24px 0;
  transform:translateX(-100%);transition:transform .27s cubic-bezier(.4,0,.2,1);
  box-shadow:4px 0 24px rgba(0,0,0,.12);
  overflow-y:auto;
}
.nb-drawer.open{transform:translateX(0)}

/* ═══════════════════════════════════════════════════
   BOTTOM TAB BAR (mobile only)
═══════════════════════════════════════════════════ */
.nb-bottom-nav{display:none}
.nb-bottom-tab{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:2px;background:transparent;border:none;cursor:pointer;
  padding:6px 2px;color:${C.muted};transition:color .18s;min-width:0;
}
.nb-bottom-tab.active{color:${C.green}}
.nb-bottom-tab-icon{font-size:20px;line-height:1}
.nb-bottom-tab-label{font-size:10px;font-weight:700;font-family:'Nunito',sans-serif;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}

/* ═══════════════════════════════════════════════════
   HAMBURGER BUTTON
═══════════════════════════════════════════════════ */
.nb-hamburger{
  background:transparent;border:none;cursor:pointer;
  display:flex;flex-direction:column;gap:5px;padding:4px;
}
.nb-hamburger span{
  display:block;width:22px;height:2.5px;background:${C.text};
  border-radius:2px;transition:all .2s;
}

/* ═══════════════════════════════════════════════════
   CARDS
═══════════════════════════════════════════════════ */
.nb-card{background:#fff;border-radius:16px;border:1.5px solid ${C.border};padding:24px;margin-bottom:20px}
.nb-card-title{font-size:16px;font-weight:800;color:${C.text};margin-bottom:16px}

/* ═══════════════════════════════════════════════════
   BUTTONS
═══════════════════════════════════════════════════ */
.btn-green{background:${C.green};color:#fff;padding:12px 24px;border-radius:10px;
  font-family:'Nunito',sans-serif;font-weight:800;font-size:14px;transition:all .18s}
.btn-green:hover{background:${C.greenDark};transform:translateY(-1px);box-shadow:0 4px 14px rgba(76,175,125,.35)}
.btn-outline{background:#fff;color:${C.green};border:1.5px solid ${C.green};padding:10px 20px;border-radius:10px;
  font-family:'Nunito',sans-serif;font-weight:700;font-size:14px;transition:all .18s}
.btn-outline:hover{background:${C.greenLight}}
.btn-ghost{background:transparent;color:${C.muted};padding:8px 14px;border-radius:8px;font-size:13px;
  font-weight:600;transition:all .18s}
.btn-ghost:hover{background:${C.greenLight};color:${C.green}}

/* ═══════════════════════════════════════════════════
   INPUTS
═══════════════════════════════════════════════════ */
.nb-input{width:100%;padding:11px 14px;border:1.5px solid ${C.border};border-radius:10px;
  font-size:14px;color:${C.text};background:#fafffe;transition:border .18s}
.nb-input:focus{border-color:${C.green};background:#fff}
.nb-label{display:block;font-size:12px;font-weight:700;color:${C.muted};margin-bottom:6px;letter-spacing:.3px;text-transform:uppercase}
.nb-form-group{margin-bottom:16px}
.nb-select{width:100%;padding:11px 14px;border:1.5px solid ${C.border};border-radius:10px;
  font-size:14px;color:${C.text};background:#fafffe;appearance:none}
.nb-select:focus{border-color:${C.green}}

/* ═══════════════════════════════════════════════════
   PROGRESS BAR
═══════════════════════════════════════════════════ */
.nb-progress{background:#eaf5ee;border-radius:99px;height:8px;overflow:hidden;margin-top:6px}
.nb-progress-fill{height:100%;border-radius:99px;transition:width .5s ease}

/* ═══════════════════════════════════════════════════
   STAT PILLS
═══════════════════════════════════════════════════ */
.nb-stat{display:flex;flex-direction:column;align-items:center;background:${C.greenLight};
  border-radius:12px;padding:14px 18px;min-width:90px}
.nb-stat-val{font-family:'Nunito',sans-serif;font-size:22px;font-weight:900;color:${C.green}}
.nb-stat-lbl{font-size:11px;color:${C.muted};font-weight:700;margin-top:2px;text-transform:uppercase}

/* ═══════════════════════════════════════════════════
   TAGS
═══════════════════════════════════════════════════ */
.tag{display:inline-flex;align-items:center;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:700}
.tag-green{background:${C.greenLight};color:${C.green}}
.tag-orange{background:#fef3eb;color:${C.orange}}

/* ═══════════════════════════════════════════════════
   CHAT BUBBLES
═══════════════════════════════════════════════════ */
.chat-bubble{max-width:80%;padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.5;margin-bottom:8px}
.chat-user{background:${C.green};color:#fff;border-bottom-right-radius:4px;align-self:flex-end;margin-left:auto}
.chat-ai{background:#fff;color:${C.text};border:1.5px solid ${C.border};border-bottom-left-radius:4px}
.chat-ai ul{list-style:disc;padding-left:18px}
.chat-ai ol{list-style:decimal;padding-left:18px}
.chat-ai li{margin-bottom:2px}
.chat-typing span{display:inline-block;width:6px;height:6px;background:${C.green};border-radius:50%;margin:0 2px;
  animation:bounce .8s infinite}
.chat-typing span:nth-child(2){animation-delay:.15s}
.chat-typing span:nth-child(3){animation-delay:.3s}
@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}

/* ═══════════════════════════════════════════════════
   MEAL CARD
═══════════════════════════════════════════════════ */
.meal-card{background:#fff;border:1.5px solid ${C.border};border-radius:14px;padding:16px;
  display:flex;align-items:center;gap:14px;transition:box-shadow .18s}
.meal-card:hover{box-shadow:0 4px 20px rgba(76,175,125,.15)}
.meal-emoji{font-size:32px;width:52px;height:52px;border-radius:12px;background:${C.greenLight};
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.meal-info{flex:1;min-width:0}
.meal-name{font-weight:700;font-size:15px;color:${C.text}}
.meal-sub{font-size:12px;color:${C.muted};margin-top:2px}
.meal-cals{font-family:'Nunito',sans-serif;font-weight:900;font-size:16px;color:${C.orange};flex-shrink:0}

/* ═══════════════════════════════════════════════════
   AUTH PAGES
═══════════════════════════════════════════════════ */
.auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,#e8f7ee 0%,#d4f0e0 50%,#c8e8d8 100%);padding:24px}
.auth-box{background:#fff;border-radius:24px;box-shadow:0 20px 60px rgba(76,175,125,.18);
  overflow:hidden;display:flex;max-width:900px;width:100%}
.auth-left{flex:1;padding:48px;background:linear-gradient(160deg,${C.greenLight} 0%,#d8f0e5 100%);
  display:flex;flex-direction:column;justify-content:center}
.auth-right{flex:1;padding:48px;display:flex;flex-direction:column;justify-content:center}
.auth-tabs{display:flex;background:#f0f0f0;border-radius:10px;padding:4px;margin-bottom:28px}
.auth-tab{flex:1;padding:9px;border-radius:8px;font-family:'Nunito',sans-serif;font-weight:800;
  font-size:14px;text-align:center;cursor:pointer;transition:all .18s;color:${C.muted}}
.auth-tab.active{background:${C.green};color:#fff}
.auth-feature{display:flex;align-items:center;gap:12px;margin-top:16px}
.auth-feature-icon{font-size:20px}
.auth-feature-text{font-size:14px;color:${C.text};font-weight:600}

/* ═══════════════════════════════════════════════════
   ONBOARDING
═══════════════════════════════════════════════════ */
.onboard-wrap{min-height:100vh;background:linear-gradient(135deg,#e8f7ee,#d4f0e0);
  display:flex;align-items:center;justify-content:center;padding:24px}
.onboard-card{background:#fff;border-radius:24px;padding:48px;max-width:520px;width:100%;
  box-shadow:0 20px 60px rgba(76,175,125,.18)}
.step-dots{display:flex;gap:8px;justify-content:center;margin-bottom:32px}
.step-dot{width:10px;height:10px;border-radius:50%;background:#ddd;transition:all .3s}
.step-dot.active{background:${C.green};width:28px;border-radius:5px}

/* ═══════════════════════════════════════════════════
   ANIMATIONS
═══════════════════════════════════════════════════ */
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.fade-in{animation:fadeIn .35s ease forwards}

/* ═══════════════════════════════════════════════════
   TABLET — 640px to 1023px
   Icon-only collapsed sidebar
═══════════════════════════════════════════════════ */
@media(min-width:640px) and (max-width:1023px){
  .nb-sidebar{width:64px;padding:16px 0}
  .nb-sidebar .nb-logo{padding:0 0 16px;justify-content:center;border-bottom:1px solid ${C.border}}
  .nb-sidebar .nb-logo img{width:36px}
  .nb-nav{padding:12px 8px}
  .nb-nav-item{
    justify-content:center;padding:10px;border-radius:10px;
    flex-direction:column;gap:4px;font-size:10px;
  }
  .nb-nav-label{display:none}
  .nb-nav-icon{width:auto;font-size:20px}
  .nb-nav-item:hover .nb-nav-label{display:block}
  .nb-sidebar-user{padding:12px 8px}
  .nb-sidebar-user > div{flex-direction:column;gap:6px;align-items:center}
  .nb-sidebar-user > div > div:nth-child(2){display:none}
  .nb-sidebar-avatar{width:32px;height:32px;font-size:13px}
  .nb-main{margin-left:64px;padding:24px}
}

/* Tablet tooltip on hover */
@media(min-width:640px) and (max-width:1023px){
  .nb-nav-item{position:relative}
  .nb-nav-item:hover::after{
    content:attr(data-label);
    position:absolute;left:70px;top:50%;transform:translateY(-50%);
    background:${C.text};color:#fff;padding:5px 10px;border-radius:6px;
    font-size:12px;white-space:nowrap;z-index:999;pointer-events:none;
    font-family:'Nunito',sans-serif;font-weight:700;
    box-shadow:0 2px 8px rgba(0,0,0,.18);
  }
}

/* ═══════════════════════════════════════════════════
   MOBILE — below 640px
   Hide desktop sidebar, show mobile header + bottom nav + drawer
═══════════════════════════════════════════════════ */
@media(max-width:639px){
  /* Hide desktop sidebar */
  .nb-sidebar{display:none}

  /* Show mobile header */
  .nb-mobile-header{
    display:flex;align-items:center;justify-content:space-between;
    position:fixed;top:0;left:0;right:0;z-index:200;
    background:#fff;border-bottom:1.5px solid ${C.border};
    padding:10px 16px;height:56px;
  }

  /* Show drawer elements */
  .nb-drawer-backdrop{display:block}
  .nb-drawer{display:flex}

  /* Show bottom nav */
  .nb-bottom-nav{
    display:flex;align-items:stretch;
    position:fixed;bottom:0;left:0;right:0;z-index:200;
    background:#fff;border-top:1.5px solid ${C.border};
    height:60px;padding:0 4px;
    padding-bottom:env(safe-area-inset-bottom, 0px);
  }

  /* Adjust main content: top header + bottom nav */
  .nb-main{
    margin-left:0;
    padding:16px;
    padding-top:calc(56px + 16px);
    padding-bottom:calc(60px + 16px);
  }

  /* Responsive cards */
  .nb-card{padding:16px;border-radius:12px}

  /* Auth page stacked */
  .auth-box{flex-direction:column}
  .auth-left{padding:28px 24px;min-height:0}
  .auth-right{padding:28px 24px}

  /* Onboarding */
  .onboard-card{padding:28px 20px}

  /* Stat pills smaller */
  .nb-stat{padding:10px 12px;min-width:70px}
  .nb-stat-val{font-size:18px}

  /* Chat bubbles full width */
  .chat-bubble{max-width:90%}
}

/* ═══════════════════════════════════════════════════
   LARGE DESKTOP — ≥1024px
   Restore full sidebar
═══════════════════════════════════════════════════ */
@media(min-width:1024px){
  .nb-sidebar{width:220px;padding:24px 0}
  .nb-sidebar .nb-logo{padding:0 20px 24px}
  .nb-sidebar .nb-logo img{width:100px}
  .nb-nav{padding:16px 12px}
  .nb-nav-item{
    flex-direction:row;justify-content:flex-start;
    padding:10px 12px;font-size:14px;gap:10px;
  }
  .nb-nav-label{display:block}
  .nb-nav-icon{font-size:17px;width:20px}
  .nb-sidebar-user{padding:16px 20px}
  .nb-sidebar-user > div{flex-direction:row}
  .nb-sidebar-user > div > div:nth-child(2){display:block}
  .nb-sidebar-avatar{width:36px;height:36px;font-size:15px}
  .nb-main{margin-left:220px;padding:32px}
}
`;
