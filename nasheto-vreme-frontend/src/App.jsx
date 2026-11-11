import { useMemo, useState } from "react";
import {
  getApiBaseUrl,
  getAuth,
  setApiBaseUrl,
  setAuth,
  clearAuth,
  login,
  register,
  me,
  getTodayQuestion
} from "./api.js";

const initialLogin = { email: "", password: "" };
const initialRegister = { email: "", password: "", firstName: "", lastName: "", familyName: "" };

export default function App() {
  const [tab, setTab] = useState("login");
  const [auth, setAuthState] = useState(getAuth());
  const [apiBaseUrl, setApiBaseUrlState] = useState(getApiBaseUrl());
  const [profile, setProfile] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [output, setOutput] = useState("Ready.");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const isLogged = Boolean(auth?.accessToken);

  const profileText = useMemo(() => {
    if (!profile) {
      return "Not loaded";
    }
    return `${profile.firstName} ${profile.lastName} | family #${profile.familyId}`;
  }, [profile]);

  function show(data) {
    setOutput(typeof data === "string" ? data : JSON.stringify(data, null, 2));
  }

  function saveApiBaseUrl(event) {
    event.preventDefault();
    setApiBaseUrl(apiBaseUrl);
    show({ saved: true, apiBaseUrl });
  }

  async function withBusy(action) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      show({ error: error.message });
    } finally {
      setBusy(false);
    }
  }

  function onLoginChange(event) {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  }

  function onRegisterChange(event) {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
  }

  function onLogout() {
    clearAuth();
    setAuthState(null);
    setProfile(null);
    setQuestion(null);
    setTab("login");
    setMessage("You are logged out.");
    show("Logged out");
  }

  async function submitLogin(event) {
    event.preventDefault();
    await withBusy(async () => {
      const result = await login(loginForm);
      setAuth(result);
      setAuthState(result);
      setMessage("Login successful.");
      show(result);
    });
  }

  async function submitRegister(event) {
    event.preventDefault();
    await withBusy(async () => {
      const result = await register(registerForm);
      setAuth(result);
      setAuthState(result);
      setMessage("Registration successful.");
      show(result);
    });
  }

  async function loadProfile() {
    await withBusy(async () => {
      const result = await me();
      setProfile(result);
      show(result);
    });
  }

  async function loadTodayQuestion() {
    await withBusy(async () => {
      const result = await getTodayQuestion();
      setQuestion(result);
      show(result);
    });
  }

  return (
    <>
      {!isLogged ? (
        <section className="auth-screen" id="authScreen">
          <div className="auth-card">
            <div className="brand-row">
              <div className="brand-mark">NV</div>
              <div>
                <h1>Nasheto Vreme</h1>
                <p className="small-muted">React POC: auth + profile + question flow</p>
              </div>
            </div>

            <div className="auth-tabs">
              <button className={tab === "login" ? "active" : ""} type="button" onClick={() => setTab("login")}>
                Login
              </button>
              <button className={tab === "register" ? "active" : ""} type="button" onClick={() => setTab("register")}>
                Register
              </button>
            </div>

            {tab === "login" ? (
              <form className="auth-form" id="loginForm" onSubmit={submitLogin}>
                <input name="email" type="email" placeholder="Email" value={loginForm.email} onChange={onLoginChange} required />
                <input name="password" type="password" placeholder="Password" value={loginForm.password} onChange={onLoginChange} required />
                <button disabled={busy} type="submit">{busy ? "Loading..." : "Login"}</button>
              </form>
            ) : (
              <form className="auth-form" id="registerForm" onSubmit={submitRegister}>
                <input name="email" type="email" placeholder="Email" value={registerForm.email} onChange={onRegisterChange} required />
                <input name="password" type="password" placeholder="Password" value={registerForm.password} onChange={onRegisterChange} required />
                <input name="firstName" type="text" placeholder="First name" value={registerForm.firstName} onChange={onRegisterChange} required />
                <input name="lastName" type="text" placeholder="Last name" value={registerForm.lastName} onChange={onRegisterChange} required />
                <input name="familyName" type="text" placeholder="Family name" value={registerForm.familyName} onChange={onRegisterChange} required />
                <button disabled={busy} type="submit">{busy ? "Loading..." : "Create account"}</button>
              </form>
            )}

            <p className="small-muted">{message}</p>
          </div>
        </section>
      ) : (
        <section className="shell" id="appScreen">
          <aside className="sidebar">
            <div className="brand-row">
              <div className="brand-mark">NV</div>
              <div>
                <strong>Nasheto Vreme</strong>
                <p className="small-muted">React POC dashboard</p>
              </div>
            </div>

            <form className="config-form" onSubmit={saveApiBaseUrl}>
              <label htmlFor="apiBaseUrl">API Base URL</label>
              <input
                id="apiBaseUrl"
                type="text"
                value={apiBaseUrl}
                onChange={(event) => setApiBaseUrlState(event.target.value)}
                placeholder="http://localhost:8088/api/v1"
              />
              <button type="submit">Save</button>
            </form>

            <div className="user-meta">
              <p>{profileText}</p>
              <button type="button" onClick={loadProfile}>Load profile</button>
              <button className="secondary" type="button" onClick={onLogout}>Logout</button>
            </div>
          </aside>

          <main className="main-content">
            <section className="card">
              <div className="cardhead">
                <h3>Question for today</h3>
                <button type="button" onClick={loadTodayQuestion}>Load</button>
              </div>
              <p className="question-box">
                {question ? `${question.id}. ${question.title}` : "Press \"Load\" to get today's question."}
              </p>
            </section>

            <section className="card">
              <h3>Debug output</h3>
              <pre>{output}</pre>
            </section>
          </main>
        </section>
      )}
    </>
  );
}

