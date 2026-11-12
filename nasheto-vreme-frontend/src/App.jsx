import { useEffect, useMemo, useState } from "react";
import {
  answerQuestion,
  clearAuth,
  createMoment,
  createPdfPreview,
  downloadPdfBook,
  getApiBaseUrl,
  getAuth,
  getFamily,
  getFamilyAnswers,
  getFamilyMembers,
  getTimeline,
  getTodayQuestion,
  listMoments,
  login,
  logoutSession,
  me,
  refreshToken,
  register,
  setApiBaseUrl,
  setAuth,
  uploadImage
} from "./api.js";

const initialLogin = { email: "", password: "" };
const initialRegister = { email: "", password: "", firstName: "", lastName: "", familyName: "" };
const initialAnswer = { questionId: "", answerText: "" };
const initialMoment = { title: "", description: "", imageUrl: "" };
const initialPdf = {
  period: "monthly",
  style: "family-story",
  includeMoments: true,
  includeAnswers: true
};

export default function App() {
  const [tab, setTab] = useState("login");
  const [auth, setAuthState] = useState(getAuth());
  const [apiBaseUrl, setApiBaseUrlState] = useState(getApiBaseUrl());
  const [authInfo, setAuthInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const [profile, setProfile] = useState(null);
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [moments, setMoments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [uploadResult, setUploadResult] = useState("");
  const [todayQuestion, setTodayQuestion] = useState(null);
  const [output, setOutput] = useState("Ready.");
  const [bootstrapping, setBootstrapping] = useState(true);

  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [answerForm, setAnswerForm] = useState(initialAnswer);
  const [momentForm, setMomentForm] = useState(initialMoment);
  const [pdfForm, setPdfForm] = useState(initialPdf);
  const [uploadFile, setUploadFile] = useState(null);

  const isLogged = Boolean(auth?.accessToken);

  const profileInfo = useMemo(() => {
    if (!profile) {
      return "Not loaded";
    }
    return `${profile.firstName} ${profile.lastName} | ${profile.familyName || "No family"}`;
  }, [profile]);

  function formatDate(value) {
    if (!value) {
      return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString("bg-BG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function resolveCreatedByName(createdById) {
    if (!createdById || members.length === 0) {
      return "-";
    }
    const creator = members.find((member) => Number(member.userId) === Number(createdById));
    if (!creator) {
      return "-";
    }
    return `${creator.firstName} ${creator.lastName}`;
  }

  function show(data) {
    setOutput(typeof data === "string" ? data : JSON.stringify(data, null, 2));
  }

  function resetDashboardState() {
    setProfile(null);
    setFamily(null);
    setMembers([]);
    setAnswers([]);
    setMoments([]);
    setTimeline([]);
    setPdfPreview(null);
    if (pdfPreviewUrl) {
      window.URL.revokeObjectURL(pdfPreviewUrl);
    }
    setPdfPreviewUrl("");
    setUploadResult("");
    setTodayQuestion(null);
    setAnswerForm(initialAnswer);
    setMomentForm(initialMoment);
    setPdfForm(initialPdf);
    setUploadFile(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      const current = getAuth();
      if (current?.accessToken) {
        setAuthState(current);
        try {
          await refreshDashboardData();
        } catch {
          // Keep the app usable even if initial data loading fails.
        }
        if (!cancelled) {
          setBootstrapping(false);
        }
        return;
      }

      try {
        const refreshed = await refreshToken();
        if (cancelled) {
          return;
        }
        setAuth(refreshed);
        setAuthState(refreshed);
        await refreshDashboardData();
        setAuthInfo("Session restored.");
      } catch {
        if (!cancelled) {
          clearAuth();
          setAuthState(null);
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    }

    bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        window.URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  function handleAuthError(error) {
    clearAuth();
    setAuthState(null);
    resetDashboardState();
    setAuthInfo("Session expired. Please log in again.");
    show({ error: error.message });
  }

  async function withBusy(action, options = {}) {
    setBusy(true);
    try {
      return await action();
    } catch (error) {
      if (options.authSensitive) {
        handleAuthError(error);
      } else {
        show({ error: error.message });
      }
      return null;
    } finally {
      setBusy(false);
    }
  }

  function updateForm(setter) {
    return (event) => {
      const { name, type, checked, value } = event.target;
      setter((current) => ({
        ...current,
        [name]: type === "checkbox" ? checked : value
      }));
    };
  }

  async function loadProfile() {
    const result = await me();
    setProfile(result);
    return result;
  }

  async function loadFamilyData(profileValue = profile) {
    if (!profileValue?.familyId) {
      return null;
    }

    const [familyResult, membersResult] = await Promise.all([
      getFamily(profileValue.familyId),
      getFamilyMembers(profileValue.familyId)
    ]);

    setFamily(familyResult);
    setMembers(membersResult);
    return { familyResult, membersResult };
  }

  async function loadAnswers(profileValue = profile) {
    if (!profileValue?.familyId) {
      return [];
    }
    const result = await getFamilyAnswers(profileValue.familyId);
    setAnswers(result);
    return result;
  }

  async function loadMoments(profileValue = profile) {
    if (!profileValue?.familyId) {
      return [];
    }
    const result = await listMoments(profileValue.familyId);
    setMoments(result);
    return result;
  }

  async function loadTimeline(profileValue = profile) {
    if (!profileValue?.familyId) {
      return [];
    }
    const result = await getTimeline(profileValue.familyId, "ALL", 20);
    setTimeline(result);
    return result;
  }

  async function refreshDashboardData() {
    const profileResult = await loadProfile();
    if (!profileResult?.familyId) {
      return;
    }

    await Promise.all([
      loadFamilyData(profileResult),
      loadMoments(profileResult),
      loadAnswers(profileResult),
      loadTimeline(profileResult)
    ]);
  }

  async function submitLogin(event) {
    event.preventDefault();
    await withBusy(async () => {
      const result = await login(loginForm);
      setAuth(result);
      setAuthState(result);
      setAuthInfo("Login successful.");
      await refreshDashboardData();
      show(result);
    });
  }

  async function submitRegister(event) {
    event.preventDefault();
    await withBusy(async () => {
      const result = await register(registerForm);
      setAuth(result);
      setAuthState(result);
      setAuthInfo("Registration successful. Dashboard loaded.");
      await refreshDashboardData();
      show(result);
    });
  }

  function submitConfig(event) {
    event.preventDefault();
    setApiBaseUrl(apiBaseUrl);
    show({ saved: true, apiBaseUrl });
  }

  function logout() {
    logoutSession().catch(() => null);
    clearAuth();
    setAuthState(null);
    resetDashboardState();
    setTab("login");
    setAuthInfo("You are logged out.");
    show("Logged out");
  }

  async function onRefreshProfile() {
    await withBusy(async () => {
      await refreshDashboardData();
      show("Profile and family data refreshed.");
    }, { authSensitive: true });
  }

  async function onRefreshToken() {
    await withBusy(async () => {
      const result = await refreshToken();
      setAuth(result);
      setAuthState(result);
      await refreshDashboardData();
      show(result);
    }, { authSensitive: true });
  }

  async function onLoadFamily() {
    await withBusy(async () => {
      await loadFamilyData();
      show("Family data refreshed.");
    }, { authSensitive: true });
  }

  async function onLoadAnswers() {
    await withBusy(async () => {
      await loadAnswers();
      show("Answers refreshed.");
    }, { authSensitive: true });
  }

  async function onLoadMoments() {
    await withBusy(async () => {
      await loadMoments();
      show("Moments refreshed.");
    }, { authSensitive: true });
  }

  async function onLoadTimeline() {
    await withBusy(async () => {
      await loadTimeline();
      show("Timeline refreshed.");
    }, { authSensitive: true });
  }

  async function onLoadTodayQuestion() {
    await withBusy(async () => {
      const result = await getTodayQuestion();
      setTodayQuestion(result);
      setAnswerForm((current) => ({ ...current, questionId: String(result.id) }));
      show(result);
    });
  }

  async function submitAnswer(event) {
    event.preventDefault();
    await withBusy(async () => {
      if (!profile?.familyId) {
        throw new Error("Profile is not loaded.");
      }

      const result = await answerQuestion(Number(answerForm.questionId), {
        familyId: Number(profile.familyId),
        answerText: answerForm.answerText
      });

      await loadAnswers();
      show(result);
    }, { authSensitive: true });
  }

  async function submitMoment(event) {
    event.preventDefault();
    await withBusy(async () => {
      if (!profile?.familyId) {
        throw new Error("Profile is not loaded.");
      }

      const result = await createMoment({
        familyId: Number(profile.familyId),
        title: momentForm.title,
        description: momentForm.description,
        imageUrl: momentForm.imageUrl
      });

      setMomentForm(initialMoment);
      await loadMoments();
      show(result);
    }, { authSensitive: true });
  }

  async function submitUpload(event) {
    event.preventDefault();
    await withBusy(async () => {
      if (!profile?.familyId) {
        throw new Error("Profile is not loaded.");
      }
      if (!uploadFile) {
        throw new Error("Please select an image file.");
      }

      const result = await uploadImage(Number(profile.familyId), uploadFile);
      setUploadResult(`Uploaded: ${result.fileName}`);
      show(result);
    }, { authSensitive: true });
  }

  async function submitPdfPreview(event) {
    event.preventDefault();
    await withBusy(async () => {
      if (!profile?.familyId) {
        throw new Error("Profile is not loaded.");
      }

      const result = await createPdfPreview({
        familyId: Number(profile.familyId),
        period: pdfForm.period,
        style: pdfForm.style,
        includeMoments: pdfForm.includeMoments,
        includeAnswers: pdfForm.includeAnswers
      });

      const previewFile = await downloadPdfBook({
        familyId: Number(profile.familyId),
        period: pdfForm.period,
        style: pdfForm.style,
        includeMoments: pdfForm.includeMoments,
        includeAnswers: pdfForm.includeAnswers
      });

      if (pdfPreviewUrl) {
        window.URL.revokeObjectURL(pdfPreviewUrl);
      }

      const nextPreviewUrl = window.URL.createObjectURL(previewFile.blob);
      setPdfPreview(result);
      setPdfPreviewUrl(nextPreviewUrl);
      show(result);
    }, { authSensitive: true });
  }

  async function onDownloadPdf() {
    await withBusy(async () => {
      if (!profile?.familyId) {
        throw new Error("Profile is not loaded.");
      }

      const result = await downloadPdfBook({
        familyId: Number(profile.familyId),
        period: pdfForm.period,
        style: pdfForm.style,
        includeMoments: pdfForm.includeMoments,
        includeAnswers: pdfForm.includeAnswers
      });

      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nasheto-vreme.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      show("PDF downloaded.");
    }, { authSensitive: true });
  }

  return (
    <>
      {bootstrapping ? (
        <section className="auth-screen">
          <div className="auth-card">
            <p className="small-muted">Restoring session...</p>
          </div>
        </section>
      ) : null}
      {!bootstrapping && !isLogged ? (
        <section className="auth-screen" id="authScreen">
          <div className="auth-card">
            <div className="brand-row">
              <div className="brand-mark">NV</div>
              <div>
                <h1>Nasheto Vreme</h1>
                <p className="small-muted">Family space for moments and conversations</p>
              </div>
            </div>

            <div className="auth-tabs">
              <button className={tab === "login" ? "active" : ""} id="showLoginBtn" type="button" onClick={() => setTab("login")}>
                Login
              </button>
              <button className={tab === "register" ? "active" : ""} id="showRegisterBtn" type="button" onClick={() => setTab("register")}>
                Register
              </button>
            </div>

            {tab === "login" ? (
              <form className="auth-form" id="loginForm" onSubmit={submitLogin}>
                <input name="email" type="email" placeholder="Email" value={loginForm.email} onChange={updateForm(setLoginForm)} required />
                <input name="password" type="password" placeholder="Password" value={loginForm.password} onChange={updateForm(setLoginForm)} required />
                <button disabled={busy} type="submit">{busy ? "Loading..." : "Login"}</button>
              </form>
            ) : (
              <form className="auth-form" id="registerForm" onSubmit={submitRegister}>
                <input name="email" type="email" placeholder="Email" value={registerForm.email} onChange={updateForm(setRegisterForm)} required />
                <input name="password" type="password" placeholder="Password" value={registerForm.password} onChange={updateForm(setRegisterForm)} required />
                <input name="firstName" type="text" placeholder="First name" value={registerForm.firstName} onChange={updateForm(setRegisterForm)} required />
                <input name="lastName" type="text" placeholder="Last name" value={registerForm.lastName} onChange={updateForm(setRegisterForm)} required />
                <input name="familyName" type="text" placeholder="Family name" value={registerForm.familyName} onChange={updateForm(setRegisterForm)} required />
                <button disabled={busy} type="submit">{busy ? "Loading..." : "Create account"}</button>
              </form>
            )}

            <p className="small-muted" id="authInfo">{authInfo}</p>
          </div>
        </section>
      ) : null}
      {!bootstrapping && isLogged ? (
        <section className="shell" id="appScreen">
          <aside className="sidebar">
            <div className="brand-row">
              <div className="brand-mark">NV</div>
              <div>
                <strong>Nasheto Vreme</strong>
                <p className="small-muted">Family dashboard</p>
              </div>
            </div>

            <form className="config-form" id="configForm" onSubmit={submitConfig}>
              <label htmlFor="apiBaseUrl">API Base URL</label>
              <input
                id="apiBaseUrl"
                name="apiBaseUrl"
                type="text"
                placeholder="http://localhost:8088/api/v1"
                value={apiBaseUrl}
                onChange={(event) => setApiBaseUrlState(event.target.value)}
              />
              <button type="submit">Save</button>
            </form>

            <div className="user-meta">
              <p id="profileInfo">{profileInfo}</p>
              <button id="meBtn" type="button" onClick={onRefreshProfile}>Refresh profile</button>
              <button id="refreshBtn" type="button" onClick={onRefreshToken}>Refresh token</button>
              <button id="logoutBtn" className="secondary" type="button" onClick={logout}>Logout</button>
            </div>
          </aside>

          <main className="main-content">
            <div className="topbar">
              <h2>Welcome back</h2>
              <p className="small-muted" id="configInfo">Using backend: {getApiBaseUrl()}</p>
            </div>

            <section className="card soft">
              <h3>Your profile</h3>
              <div className="info-grid" id="profileCard">
                <InfoItem label="Name" value={profile ? `${profile.firstName} ${profile.lastName}` : "-"} />
                <InfoItem label="Email" value={profile?.email || "-"} />
                <InfoItem label="Role" value={profile?.role || "-"} />
                <InfoItem label="Family" value={profile?.familyName || family?.name || "-"} />
              </div>
            </section>

            <section className="card">
              <div className="cardhead">
                <h3>Your family</h3>
                <button id="loadFamilyBtn" type="button" onClick={onLoadFamily}>Refresh</button>
              </div>
              <div className="info-grid" id="familyCard">
                <InfoItem label="Family" value={family?.name || "-"} />
                <InfoItem label="Created by" value={resolveCreatedByName(family?.createdBy)} />
                <InfoItem label="Created at" value={formatDate(family?.createdAt)} />
              </div>
              <div className="list" id="membersList">
                {members.length === 0 ? <p className="small-muted">No items yet.</p> : members.map((member) => (
                  <article className="list-item" key={member.id || `${member.email}-${member.role}`}>
                    <h4>{member.firstName} {member.lastName}</h4>
                    <div className="list-meta">{member.role} | {member.email}</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="cardhead">
                <h3>Question for today</h3>
                <button id="todayQuestionBtn" type="button" onClick={onLoadTodayQuestion}>Load</button>
              </div>
              <p className="question-box" id="todayQuestionText">
                {todayQuestion ? todayQuestion.title : "Press \"Load\" to get today's question."}
              </p>
              <form className="grid2" id="answerForm" onSubmit={submitAnswer}>
                <input name="questionId" type="number" placeholder="Question ID" value={answerForm.questionId} onChange={updateForm(setAnswerForm)} required />
                <input name="answerText" type="text" placeholder="Answer text" value={answerForm.answerText} onChange={updateForm(setAnswerForm)} required />
                <button type="submit">Send answer</button>
              </form>
              <div className="cardhead compact">
                <h3>Family answers</h3>
                <button id="loadAnswersBtn" type="button" onClick={onLoadAnswers}>Load</button>
              </div>
              <div className="list" id="answersList">
                {answers.length === 0 ? <p className="small-muted">No items yet.</p> : answers.map((answer) => (
                  <article className="list-item" key={answer.id || `${answer.authorName}-${answer.createdAt}`}>
                    <h4>{answer.questionTitle}</h4>
                    <p>{answer.answerText}</p>
                    <div className="list-meta">by {answer.authorName} | {formatDate(answer.createdAt)}</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="cardhead">
                <h3>Family moments</h3>
                <button id="listMomentsBtn" type="button" onClick={onLoadMoments}>Load</button>
              </div>
              <form className="grid2" id="createMomentForm" onSubmit={submitMoment}>
                <input name="title" type="text" placeholder="Title" value={momentForm.title} onChange={updateForm(setMomentForm)} required />
                <input name="description" type="text" placeholder="Description" value={momentForm.description} onChange={updateForm(setMomentForm)} />
                <input name="imageUrl" type="text" placeholder="Image URL" value={momentForm.imageUrl} onChange={updateForm(setMomentForm)} />
                <button type="submit">Create moment</button>
              </form>
              <div className="list" id="momentsList">
                {moments.length === 0 ? <p className="small-muted">No items yet.</p> : moments.map((moment) => (
                  <article className="list-item" key={moment.id || `${moment.title}-${moment.createdAt}`}>
                    <h4>{moment.title}</h4>
                    <p>{moment.description || "No description"}</p>
                    <div className="list-meta">{formatDate(moment.createdAt)}</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="card">
              <h3>Upload image</h3>
              <form className="row" id="uploadForm" onSubmit={submitUpload}>
                <input
                  name="file"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                  required
                />
                <button type="submit">Upload</button>
              </form>
              <div className="small-muted" id="uploadResult">{uploadResult}</div>
            </section>

            <section className="card">
              <div className="cardhead">
                <h3>Family timeline</h3>
                <button id="loadTimelineBtn" type="button" onClick={onLoadTimeline}>Load</button>
              </div>
              <div className="list" id="timelineList">
                {timeline.length === 0 ? <p className="small-muted">No items yet.</p> : timeline.map((item) => (
                  <article className="list-item" key={item.id || `${item.type}-${item.createdAt}-${item.title}`}>
                    <h4>{item.type} | {item.title}</h4>
                    <p>{item.details || "No details"}</p>
                    <div className="list-meta">{item.author || "Family"} | {formatDate(item.createdAt)}</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="card">
              <h3>Family PDF book (preview)</h3>
              <form className="grid2" id="pdfExportForm" onSubmit={submitPdfPreview}>
                <input name="period" type="text" placeholder="Period (monthly/yearly/custom)" value={pdfForm.period} onChange={updateForm(setPdfForm)} required />
                <input name="style" type="text" placeholder="Style" value={pdfForm.style} onChange={updateForm(setPdfForm)} required />
                <label>
                  <input name="includeMoments" type="checkbox" checked={pdfForm.includeMoments} onChange={updateForm(setPdfForm)} /> Include moments
                </label>
                <label>
                  <input name="includeAnswers" type="checkbox" checked={pdfForm.includeAnswers} onChange={updateForm(setPdfForm)} /> Include answers
                </label>
                <button type="submit">Generate preview</button>
              </form>
              <button id="downloadPdfBtn" type="button" onClick={onDownloadPdf}>Download PDF</button>
              <div className="info-grid" id="pdfPreviewCard">
                <InfoItem label="Status" value={pdfPreview?.status || "-"} />
                <InfoItem label="Period" value={pdfPreview?.period || "-"} />
                <InfoItem label="Style" value={pdfPreview?.style || "-"} />
                <InfoItem label="Moments" value={pdfPreview?.includedMoments ?? "-"} />
                <InfoItem label="Answers" value={pdfPreview?.includedAnswers ?? "-"} />
              </div>
              {pdfPreviewUrl ? (
                <iframe
                  title="PDF Preview"
                  src={pdfPreviewUrl}
                  style={{ width: "100%", minHeight: 420, border: "1px solid #e7ded2", borderRadius: 12, marginTop: 10 }}
                />
              ) : null}
            </section>

            <section className="card">
              <h3>Debug output</h3>
              <pre id="output">{output}</pre>
            </section>
          </main>
        </section>
      ) : null}
    </>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <b>{label}</b>
      <span>{value ?? "-"}</span>
    </div>
  );
}
