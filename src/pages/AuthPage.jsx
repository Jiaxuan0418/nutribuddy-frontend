// src/pages/AuthPage.jsx

import { useState } from "react";
import { C } from "../theme";
import nutriLogo from "../assets/nutribuddy_logo.png";
import mascotImg from "../assets/nutribuddy_authpagecartoon.png";

const API_URL = "https://JxChan-nutribuddy-backend.hf.space/api";

// ── Styles ────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #d4f0e2 0%, #c2ebd6 40%, #a8dfc4 100%)",
    display: "flex", flexDirection: "column",
  },
  navbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 185px",
  },
  navLogoImg:  { height: 90, width: "auto", objectFit: "contain" },
  navLoginBtn: {
    background: C.green, color: "#fff", border: "none", borderRadius: 99,
    padding: "10px 28px", fontFamily: "'Nunito', sans-serif", fontWeight: 800,
    fontSize: 14, cursor: "pointer", boxShadow: "0 2px 10px rgba(76,175,125,0.3)", transition: "all .18s",
  },
  outerCard: {
    flex: 1, margin: "0 200px 40px", background: "rgba(255,255,255,0.45)",
    backdropFilter: "blur(12px)", borderRadius: 28, display: "flex",
    alignItems: "center", padding: "40px 60px", gap: 60,
    boxShadow: "0 8px 40px rgba(76,175,125,0.12)",
  },
  leftPanel:   { flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start" },
  mascotBox: {
    width: "100%", marginBottom: 16,
    display: "flex", alignItems: "center", justifyContent: "flex-start",
  },
  tagline:     { fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 34, color: C.green, lineHeight: 1.2, marginBottom: 24 },
  featureRow:  { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  featureIcon: {
    fontSize: 20, width: 36, height: 36, background: "rgba(255,255,255,0.7)",
    borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  featureText: { fontSize: 15, fontWeight: 600, color: C.text },
  formCard:    {
    width: 400, background: "#fff", borderRadius: 24,
    boxShadow: "0 4px 30px rgba(76,175,125,0.13)", overflow: "hidden", flexShrink: 0,
  },
  tabBar: { display: "flex", background: "#efefef", padding: 5, gap: 4, borderRadius: "24px 24px 0 0" },
  tabActive: {
    flex: 1, padding: "11px 0", textAlign: "center", fontFamily: "'Nunito', sans-serif",
    fontWeight: 800, fontSize: 14, cursor: "pointer", background: C.green, color: "#fff",
    borderRadius: 99, border: "none", transition: "all .2s",
  },
  tabInactive: {
    flex: 1, padding: "11px 0", textAlign: "center", fontFamily: "'Nunito', sans-serif",
    fontWeight: 700, fontSize: 14, cursor: "pointer", background: "transparent", color: "#aaa",
    borderRadius: 99, border: "none", transition: "all .2s",
  },
  formBody:    { padding: "30px 36px 28px" },
  pillInput:   {
    width: "100%", padding: "13px 20px", border: "none", borderRadius: 99,
    background: "#f0f0f0", fontSize: 14, color: C.text, outline: "none", marginBottom: 12,
    fontFamily: "'Lato', sans-serif", boxSizing: "border-box", display: "block",
  },
  pillSelect:  {
    width: "100%", padding: "13px 20px", border: "none", borderRadius: 99,
    background: "#f0f0f0", fontSize: 14, color: C.text, outline: "none", marginBottom: 12,
    fontFamily: "'Lato', sans-serif", boxSizing: "border-box", display: "block", cursor: "pointer",
  },
  pillBtn: {
    width: "100%", padding: "14px", border: "none", borderRadius: 99, background: C.green,
    color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15,
    cursor: "pointer", marginTop: 4, transition: "all .18s",
    boxShadow: "0 4px 14px rgba(76,175,125,0.35)",
  },
  rememberRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, marginTop: 4 },
  rememberLeft:{ display: "flex", alignItems: "center", gap: 8 },
  rememberText:{ fontSize: 13, color: C.text, fontWeight: 600 },
  forgotLink:  { fontSize: 13, color: C.green, cursor: "pointer", fontWeight: 700 },
  bottomText:  { textAlign: "center", fontSize: 13, color: C.text, marginTop: 16, fontWeight: 600 },
  link:        { color: C.green, fontWeight: 700, cursor: "pointer" },
  helpText:    { textAlign: "center", fontSize: 12, color: C.muted, marginTop: 8, paddingBottom: 4, fontWeight: 600 },
  checkRow:    { display: "flex", alignItems: "center", gap: 8, marginBottom: 16, marginTop: 4 },
  checkText:   { fontSize: 13, color: C.text },
  error:       { color: C.danger, fontSize: 12, marginBottom: 8, textAlign: "center" },
  success:     { color: C.green,  fontSize: 12, marginBottom: 8, textAlign: "center", fontWeight: 700 },
  sectionLabel:{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 8, marginTop: 4 },
  backLink:    { fontSize: 13, color: C.muted, cursor: "pointer", textAlign: "center", marginTop: 12, display: "block" },

  // Modal
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
  },
  modalBox: {
    background: "#fff", borderRadius: 20, width: "100%", maxWidth: 620, maxHeight: "80vh",
    display: "flex", flexDirection: "column", boxShadow: "0 12px 48px rgba(0,0,0,0.2)", overflow: "hidden",
  },
  modalHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 28px", borderBottom: "1px solid #eee",
    fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 18, color: C.green,
  },
  modalClose:   { background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.muted, lineHeight: 1 },
  modalBody:    { padding: "24px 28px", overflowY: "auto", fontSize: 13.5, color: C.text, lineHeight: 1.7 },
  modalSection: { marginBottom: 20 },
  modalSectionTitle: { fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15, color: C.green, marginBottom: 6 },
  modalFooter:  { padding: "16px 28px", borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end" },
  modalBtn:     {
    background: C.green, color: "#fff", border: "none", borderRadius: 99,
    padding: "10px 28px", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer",
  },
};

// ── Security questions ─────────────────────────────────────────
const SECURITY_QUESTIONS = [
  "What is the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the name of your primary school?",
  "What is the name of the city where you were born?",
  "What was the make of your first car?",
  "What is your oldest sibling's middle name?",
  "What was the name of your childhood best friend?",
];

// ── Legal document content ────────────────────────────────────
const TOS_SECTIONS = [
  { title: "1. Acceptance of Terms",     body: "By creating an account on NutriBuddy, you agree to these Terms of Service. If you do not agree, please do not use the app. We may update these terms from time to time and will notify you of significant changes." },
  { title: "2. Use of the App",          body: "NutriBuddy is a personal nutrition tracking tool designed to help you monitor your diet and health goals. You must be at least 13 years old to use this app. You are responsible for keeping your account credentials secure and for all activity that occurs under your account." },
  { title: "3. Health Disclaimer",       body: "NutriBuddy is not a medical application. The nutrition targets, meal plans, and dietary suggestions provided are for general informational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making significant changes to your diet." },
  { title: "4. Your Content",            body: "Any information you enter into NutriBuddy (such as food logs, weight, and health goals) belongs to you. We do not claim ownership of your personal data. You may delete your account and associated data at any time." },
  { title: "5. Prohibited Conduct",      body: "You agree not to misuse NutriBuddy in any way, including attempting to access other users' data, reverse-engineer the application, or use it for any unlawful purpose." },
  { title: "6. Limitation of Liability", body: "NutriBuddy is provided on an \"as is\" basis. We are not liable for any health outcomes, data loss, or damages arising from your use of the app. Use it at your own discretion." },
  { title: "7. Changes & Termination",   body: "We reserve the right to modify or discontinue the service at any time. We may also suspend accounts that violate these terms. You may stop using NutriBuddy at any time." },
];

const PRIVACY_SECTIONS = [
  { title: "1. What We Collect",          body: "When you use NutriBuddy, we collect information you provide directly, including your name, email address, and password, as well as health data such as your age, weight, height, gender, activity level, dietary preferences, allergies, and food log entries." },
  { title: "2. How We Use Your Data",     body: "We use your information solely to operate NutriBuddy and personalise your experience — for example, to calculate your nutrition targets, generate meal suggestions, and display your food log history. We do not sell, rent, or share your personal data with third parties for marketing purposes." },
  { title: "3. Data Storage & Security",  body: "Your password is stored as a secure bcrypt hash and is never stored in plain text. All data is stored in a local database. We take reasonable technical measures to protect your information, but no system is completely secure and we cannot guarantee absolute security." },
  { title: "4. Health Data",              body: "We understand that health data is sensitive. Information such as your weight, height, dietary restrictions, and food logs is used only to provide you with personalised nutrition features within the app. This data is never shared with third parties." },
  { title: "5. Your Rights",              body: "You have the right to access, correct, or delete your personal data at any time. You can update your profile information from the Profile page, or contact us to request full account deletion." },
  { title: "6. Cookies & Local Storage",  body: "NutriBuddy may use your browser's local storage to keep you logged in when you choose \"Remember Me.\" This data stays on your device and is cleared when you log out." },
  { title: "7. Changes to This Policy",   body: "We may update this Privacy Policy from time to time. Continued use of NutriBuddy after changes are posted means you accept the updated policy. We encourage you to review this page periodically." },
  { title: "8. Contact",                  body: "If you have any questions or concerns about your data, please reach out to the NutriBuddy development team through the Help section of the app." },
];

const HELP_SECTIONS = [
  { title: "🔐 How do I create an account?",         body: "Click the 'Sign up' tab, fill in your name, email, and a password, choose a security question and answer (used for password recovery), then tick the Terms of Service checkbox and click 'Create Account'." },
  { title: "🔑 I forgot my password. What do I do?", body: "On the Login tab, click 'Forgot password?' Enter the email address linked to your account, answer your security question correctly, then set a new password." },
  { title: "📊 How are my nutrition targets calculated?", body: "NutriBuddy uses the Mifflin-St Jeor formula to estimate your Basal Metabolic Rate (BMR) and then applies an activity multiplier to get your Total Daily Energy Expenditure (TDEE). Macros are split based on your selected goal (lose, maintain, or gain)." },
  { title: "🥗 Can I update my goals and body info?",  body: "Yes! Go to the Profile page after logging in. You can update your weight, height, activity level, and goal at any time. Your nutrition targets will recalculate automatically." },
  { title: "📝 How does the Food Log work?",           body: "Go to the Food Log page and click '+ Log Food'. Enter the food name, which meal it belongs to (Breakfast, Lunch, Dinner, or Snack), and its nutritional values. Your daily totals will update instantly." },
  { title: "💬 What is the Chatbot for?",              body: "The NutriBuddy chatbot can answer nutrition questions, suggest meals based on your preferences and targets, and give personalised dietary advice. Just type your question and it will respond." },
  { title: "🔒 Is my health data safe?",               body: "Yes. Your password is always stored as a secure hash and never in plain text. Your health data is stored privately and never shared with third parties. See our Privacy Policy for full details." },
  { title: "🚪 How do I log out?",                     body: "Click the 'Log Out' button in the sidebar. If you ticked 'Remember Me' during login, logging out will also clear your saved session from the browser." },
];

// ── Generic doc/info modal ────────────────────────────────────
function DocModal({ title, sections, onClose }) {
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span>{title}</span>
          <button style={S.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={S.modalBody}>
          {sections.map((sec) => (
            <div style={S.modalSection} key={sec.title}>
              <div style={S.modalSectionTitle}>{sec.title}</div>
              <p style={{ margin: 0 }}>{sec.body}</p>
            </div>
          ))}
        </div>
        <div style={S.modalFooter}>
          <button style={S.modalBtn} onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: "📋", text: "Calculate Daily Nutrition Targets (BMR/TDEE)" },
  { icon: "💬", text: "LLM Smart Chat for Dynamic Meal Plans" },
  { icon: "📊", text: "Track Intake & Visualize Trends" },
];

// ── Main component ────────────────────────────────────────────
export default function AuthPage({ onAuth }) {
  const [tab,        setTab]        = useState("signup");
  const [form,       setForm]       = useState({ name: "", email: "", password: "", confirm: "", security_question: SECURITY_QUESTIONS[0], security_answer: "" });
  const [agreed,     setAgreed]     = useState(false);
  const [err,        setErr]        = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading,    setLoading]    = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [modal,      setModal]      = useState(null); // "tos" | "privacy" | "help" | null

  // Forgot password flow: "idle" | "enter_email" | "answer_question" | "new_password" | "done"
  const [fpStep,     setFpStep]     = useState("idle");
  const [fpEmail,    setFpEmail]    = useState("");
  const [fpQuestion, setFpQuestion] = useState("");
  const [fpAnswer,   setFpAnswer]   = useState("");
  const [fpNewPw,    setFpNewPw]    = useState("");
  const [fpConfirm,  setFpConfirm]  = useState("");
  const [fpErr,      setFpErr]      = useState("");

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function switchTab(t) { setTab(t); setErr(""); setSuccessMsg(""); resetFp(); }

  function resetFp() {
    setFpStep("idle"); setFpEmail(""); setFpQuestion("");
    setFpAnswer(""); setFpNewPw(""); setFpConfirm(""); setFpErr("");
  }

  // ── Signup ──
  async function handleSignup() {
    if (!form.name || !form.email || !form.password)  { setErr("Please fill in all fields before continuing."); return; }
    if (form.password !== form.confirm)                { setErr("Your passwords don't match. Please re-enter them."); return; }
    if (!form.security_answer.trim())                  { setErr("Please provide an answer to your security question."); return; }
    if (!agreed)                                       { setErr("Please agree to the Terms of Service to create your account."); return; }

    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, password: form.password,
          security_question: form.security_question, security_answer: form.security_answer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      onAuth({ id: data.user_id, name: form.name, email: form.email }, true, false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Login ──
  async function handleLogin() {
    if (!form.email || !form.password) { setErr("Please enter your email and password to log in."); return; }
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      onAuth(data.user, false, rememberMe);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot password: Step 1 — fetch security question ──
  async function fpLookup() {
    if (!fpEmail) { setFpErr("Please enter your email address."); return; }
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/security-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFpQuestion(data.security_question);
      setFpStep("answer_question");
      setFpErr("");
    } catch (e) {
      setFpErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot password: Step 2 — verify answer & set new password ──
  async function fpReset() {
    if (!fpAnswer)               { setFpErr("Please enter your answer."); return; }
    if (!fpNewPw)                { setFpErr("Please enter a new password."); return; }
    if (fpNewPw !== fpConfirm)   { setFpErr("Passwords don't match. Please re-enter them."); return; }
    if (fpNewPw.length < 6)      { setFpErr("Password must be at least 6 characters."); return; }

    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail, security_answer: fpAnswer, new_password: fpNewPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFpStep("done");
      setFpErr("");
    } catch (e) {
      setFpErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Render forgot-password panel (replaces login form) ──
  function ForgotPasswordPanel() {
    if (fpStep === "done") {
      return (
        <>
          <div style={{ textAlign: "center", fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ textAlign: "center", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 16, color: C.green, marginBottom: 8 }}>
            Password updated!
          </div>
          <p style={{ textAlign: "center", fontSize: 13, color: C.muted, marginBottom: 20 }}>
            Your password has been changed successfully. You can now log in with your new password.
          </p>
          <button style={S.pillBtn} onClick={() => { resetFp(); setTab("login"); }}>
            Back to Log In
          </button>
        </>
      );
    }

    if (fpStep === "answer_question") {
      return (
        <>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
            🔒 Verify your identity
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
            Answer your security question to reset your password.
          </p>
          <div style={{ background: "#f0f7f4", borderRadius: 12, padding: "12px 16px", marginBottom: 14, fontSize: 13, fontWeight: 700, color: C.green }}>
            {fpQuestion}
          </div>
          <input style={S.pillInput} type="text" placeholder="Your answer"
            value={fpAnswer} onChange={e => setFpAnswer(e.target.value)} />
          <input style={S.pillInput} type="password" placeholder="New password"
            value={fpNewPw} onChange={e => setFpNewPw(e.target.value)} />
          <input style={S.pillInput} type="password" placeholder="Confirm new password"
            value={fpConfirm} onChange={e => setFpConfirm(e.target.value)} />
          {fpErr && <div style={S.error}>{fpErr}</div>}
          <button style={S.pillBtn} onClick={fpReset}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <span style={S.backLink} onClick={resetFp}>← Back to Log In</span>
        </>
      );
    }

    // fpStep === "enter_email"
    return (
      <>
        <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
          🔑 Forgot your password?
        </div>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
          Enter the email address linked to your account and we'll verify your identity with a security question.
        </p>
        <input style={S.pillInput} type="email" placeholder="Your email address"
          value={fpEmail} onChange={e => setFpEmail(e.target.value)} />
        {fpErr && <div style={S.error}>{fpErr}</div>}
        <button style={S.pillBtn} onClick={fpLookup}>
          {loading ? "Looking up..." : "Continue"}
        </button>
        <span style={S.backLink} onClick={resetFp}>← Back to Log In</span>
      </>
    );
  }

  return (
    <div style={S.page}>

      {/* ── Modals ── */}
      {modal === "tos"     && <DocModal title="📄 Terms of Service" sections={TOS_SECTIONS}     onClose={() => setModal(null)} />}
      {modal === "privacy" && <DocModal title="🔒 Privacy Policy"   sections={PRIVACY_SECTIONS} onClose={() => setModal(null)} />}
      {modal === "help"    && <DocModal title="❓ Help & FAQs"       sections={HELP_SECTIONS}    onClose={() => setModal(null)} />}

      {/* ── Navbar ── */}
      <div style={S.navbar}>
        <img src={nutriLogo} alt="NutriBuddy" style={S.navLogoImg} />
        <button
          style={S.navLoginBtn}
          onClick={() => switchTab("login")}
          onMouseEnter={e => e.currentTarget.style.background = C.greenDark}
          onMouseLeave={e => e.currentTarget.style.background = C.green}
        >
          Log in
        </button>
      </div>

      {/* ── Outer card ── */}
      <div style={S.outerCard}>

        {/* Left panel */}
        <div style={S.leftPanel}>
          <div style={S.mascotBox}>
            <img src={mascotImg} alt="NutriBuddy mascot" style={{ width: 520, height: 320, objectFit: "contain", marginLeft: -16 }} />
          </div>
          <div style={S.tagline}>Eat healthy,<br />effortlessly.</div>
          {FEATURES.map((f) => (
            <div style={S.featureRow} key={f.text}>
              <div style={S.featureIcon}>{f.icon}</div>
              <span style={S.featureText}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div style={S.formCard}>
          <div style={S.tabBar}>
            <button style={tab === "login"  ? S.tabActive : S.tabInactive} onClick={() => switchTab("login")}>Log in</button>
            <button style={tab === "signup" ? S.tabActive : S.tabInactive} onClick={() => switchTab("signup")}>Sign up</button>
          </div>

          <div style={S.formBody}>

            {/* ── Login tab ── */}
            {tab === "login" && (
              fpStep === "idle" ? (
                <>
                  <input style={S.pillInput} type="email"    placeholder="Email"    value={form.email}    onChange={set("email")} />
                  <input style={S.pillInput} type="password" placeholder="Password" value={form.password} onChange={set("password")} />
                  <div style={S.rememberRow}>
                    <div style={S.rememberLeft}>
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                        style={{ accentColor: C.green, width: 15, height: 15 }} />
                      <span style={S.rememberText}>Remember me</span>
                    </div>
                    <span style={S.forgotLink} onClick={() => setFpStep("enter_email")}>Forgot password?</span>
                  </div>
                  {err && <div style={S.error}>{err}</div>}
                  <button style={S.pillBtn} onClick={handleLogin}>
                    {loading ? "Logging in..." : "Log in"}
                  </button>
                  <div style={S.bottomText}>
                    Don't have an account?{" "}
                    <span style={S.link} onClick={() => switchTab("signup")}>Sign up</span>
                  </div>
                </>
              ) : (
                <ForgotPasswordPanel />
              )
            )}

            {/* ── Sign up tab ── */}
            {tab === "signup" && (
              <>
                <input style={S.pillInput} type="text"     placeholder="Full Name"        value={form.name}     onChange={set("name")} />
                <input style={S.pillInput} type="email"    placeholder="Email Address"    value={form.email}    onChange={set("email")} />
                <input style={S.pillInput} type="password" placeholder="Create Password"  value={form.password} onChange={set("password")} />
                <input style={S.pillInput} type="password" placeholder="Confirm Password" value={form.confirm}  onChange={set("confirm")} />

                <div style={S.sectionLabel}>Security Question (for password recovery)</div>
                <select style={S.pillSelect} value={form.security_question} onChange={set("security_question")}>
                  {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
                <input style={S.pillInput} type="text" placeholder="Your answer"
                  value={form.security_answer} onChange={set("security_answer")} />

                <div style={S.checkRow}>
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    style={{ accentColor: C.green, width: 15, height: 15 }} />
                  <span style={S.checkText}>
                    I agree to the{" "}
                    <span style={S.link} onClick={() => setModal("tos")}>Terms of Service</span>
                    {" "}&{" "}
                    <span style={S.link} onClick={() => setModal("privacy")}>Privacy Policy</span>
                  </span>
                </div>

                {err       && <div style={S.error}>{err}</div>}
                {successMsg && <div style={S.success}>{successMsg}</div>}

                <button style={S.pillBtn} onClick={handleSignup}>
                  {loading ? "Creating..." : "Create Account"}
                </button>
                <div style={S.bottomText}>
                  Already have an account?{" "}
                  <span style={S.link} onClick={() => switchTab("login")}>Log in</span>
                </div>
              </>
            )}

            <div style={S.helpText}>
              Need help?{" "}
              <span style={S.link} onClick={() => setModal("help")}>Help</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
