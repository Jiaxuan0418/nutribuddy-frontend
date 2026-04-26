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

.nb-app{display:flex;min-height:100vh}

/* Sidebar */
.nb-sidebar{width:220px;min-height:100vh;background:#fff;border-right:1.5px solid ${C.border};
  display:flex;flex-direction:column;padding:24px 0;position:fixed;top:0;left:0;z-index:100}
.nb-logo{display:flex;align-items:center;gap:10px;padding:0 20px 24px;border-bottom:1px solid ${C.border}}
.nb-logo-icon{width:40px;height:40px;border-radius:12px;background:${C.greenLight};
  display:flex;align-items:center;justify-content:center;font-size:22px}
.nb-logo-text{font-family:'Nunito',sans-serif;font-weight:900;font-size:18px;color:${C.green}}
.nb-logo-sub{font-size:10px;color:${C.muted};font-weight:400}
.nb-nav{flex:1;padding:16px 12px}
.nb-nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;
  cursor:pointer;transition:all .18s;color:${C.muted};font-size:14px;font-weight:600;margin-bottom:2px}
.nb-nav-item:hover{background:${C.greenLight};color:${C.green}}
.nb-nav-item.active{background:${C.green};color:#fff}
.nb-nav-icon{font-size:17px;width:20px;text-align:center}
.nb-sidebar-user{padding:16px 20px;border-top:1px solid ${C.border}}
.nb-sidebar-avatar{width:36px;height:36px;border-radius:50%;background:${C.green};
  color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px}

/* Main content */
.nb-main{flex:1;margin-left:220px;padding:32px}

/* Cards */
.nb-card{background:#fff;border-radius:16px;border:1.5px solid ${C.border};padding:24px;margin-bottom:20px}
.nb-card-title{font-size:16px;font-weight:800;color:${C.text};margin-bottom:16px}

/* Buttons */
.btn-green{background:${C.green};color:#fff;padding:12px 24px;border-radius:10px;
  font-family:'Nunito',sans-serif;font-weight:800;font-size:14px;transition:all .18s}
.btn-green:hover{background:${C.greenDark};transform:translateY(-1px);box-shadow:0 4px 14px rgba(76,175,125,.35)}
.btn-outline{background:#fff;color:${C.green};border:1.5px solid ${C.green};padding:10px 20px;border-radius:10px;
  font-family:'Nunito',sans-serif;font-weight:700;font-size:14px;transition:all .18s}
.btn-outline:hover{background:${C.greenLight}}
.btn-ghost{background:transparent;color:${C.muted};padding:8px 14px;border-radius:8px;font-size:13px;
  font-weight:600;transition:all .18s}
.btn-ghost:hover{background:${C.greenLight};color:${C.green}}

/* Inputs */
.nb-input{width:100%;padding:11px 14px;border:1.5px solid ${C.border};border-radius:10px;
  font-size:14px;color:${C.text};background:#fafffe;transition:border .18s}
.nb-input:focus{border-color:${C.green};background:#fff}
.nb-label{display:block;font-size:12px;font-weight:700;color:${C.muted};margin-bottom:6px;letter-spacing:.3px;text-transform:uppercase}
.nb-form-group{margin-bottom:16px}
.nb-select{width:100%;padding:11px 14px;border:1.5px solid ${C.border};border-radius:10px;
  font-size:14px;color:${C.text};background:#fafffe;appearance:none}
.nb-select:focus{border-color:${C.green}}

/* Progress bar */
.nb-progress{background:#eaf5ee;border-radius:99px;height:8px;overflow:hidden;margin-top:6px}
.nb-progress-fill{height:100%;border-radius:99px;transition:width .5s ease}

/* Stat pills */
.nb-stat{display:flex;flex-direction:column;align-items:center;background:${C.greenLight};
  border-radius:12px;padding:14px 18px;min-width:90px}
.nb-stat-val{font-family:'Nunito',sans-serif;font-size:22px;font-weight:900;color:${C.green}}
.nb-stat-lbl{font-size:11px;color:${C.muted};font-weight:700;margin-top:2px;text-transform:uppercase}

/* Tags */
.tag{display:inline-flex;align-items:center;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:700}
.tag-green{background:${C.greenLight};color:${C.green}}
.tag-orange{background:#fef3eb;color:${C.orange}}

/* Chat bubble */
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

/* Meal card */
.meal-card{background:#fff;border:1.5px solid ${C.border};border-radius:14px;padding:16px;
  display:flex;align-items:center;gap:14px;transition:box-shadow .18s}
.meal-card:hover{box-shadow:0 4px 20px rgba(76,175,125,.15)}
.meal-emoji{font-size:32px;width:52px;height:52px;border-radius:12px;background:${C.greenLight};
  display:flex;align-items:center;justify-content:center}
.meal-info{flex:1}
.meal-name{font-weight:700;font-size:15px;color:${C.text}}
.meal-sub{font-size:12px;color:${C.muted};margin-top:2px}
.meal-cals{font-family:'Nunito',sans-serif;font-weight:900;font-size:16px;color:${C.orange}}

/* Auth pages */
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

/* Onboarding */
.onboard-wrap{min-height:100vh;background:linear-gradient(135deg,#e8f7ee,#d4f0e0);
  display:flex;align-items:center;justify-content:center;padding:24px}
.onboard-card{background:#fff;border-radius:24px;padding:48px;max-width:520px;width:100%;
  box-shadow:0 20px 60px rgba(76,175,125,.18)}
.step-dots{display:flex;gap:8px;justify-content:center;margin-bottom:32px}
.step-dot{width:10px;height:10px;border-radius:50%;background:#ddd;transition:all .3s}
.step-dot.active{background:${C.green};width:28px;border-radius:5px}

/* Animations */
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.fade-in{animation:fadeIn .35s ease forwards}

@media(max-width:700px){
  .nb-sidebar{display:none}
  .nb-main{margin-left:0}
  .auth-box{flex-direction:column}
  .auth-left{padding:32px;min-height:0}
}
`;