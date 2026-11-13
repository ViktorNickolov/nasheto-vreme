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
const initialAnswer = { answerText: "" };
const initialMoment = { title: "", description: "", imageUrl: "" };
const initialPdf = {
  period: "monthly",
  style: "family-story",
  includeMoments: true,
  includeAnswers: true
};

const dashboardModules = [
  { key: "profile", label: "Моят профил" },
  { key: "family", label: "Вашето семейство" },
  { key: "question", label: "Въпрос за днес" },
  { key: "moments", label: "Семейни моменти" },
  { key: "upload", label: "Качи снимка" },
  { key: "timeline", label: "Семейна хроника" },
  { key: "pdf", label: "Семейна PDF книга" }
];

const sidebarHighlights = [
  {
    title: "Семейна искра",
    text: "Спомените оживяват, когато ги споделяме заедно."
  },
  {
    title: "Миг от днес",
    text: "Всяка снимка е малка врата към щастлив миг."
  },
  {
    title: "Семейна история",
    text: "Семейството е история, която пишем всеки ден."
  },
  {
    title: "Дневен акцент",
    text: "Днес е добър ден да запазим още един красив момент."
  },
  {
    title: "Топла връзка",
    text: "Най-силните връзки се градят с внимание и време."
  }
];

function pickSidebarHighlight() {
  const index = Math.floor(Math.random() * sidebarHighlights.length);
  return sidebarHighlights[index];
}

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
  const [activeModule, setActiveModule] = useState("profile");
  const [sidebarHighlight] = useState(() => pickSidebarHighlight());

  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [answerForm, setAnswerForm] = useState(initialAnswer);
  const [momentForm, setMomentForm] = useState(initialMoment);
  const [pdfForm, setPdfForm] = useState(initialPdf);
  const [uploadFile, setUploadFile] = useState(null);

  const isLogged = Boolean(auth?.accessToken);

  const profileInfo = useMemo(() => {
    if (!profile) {
      return "Профилът не е зареден";
    }
    return `${profile.firstName} ${profile.lastName} | ${profile.familyName || "Без семейство"}`;
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
    setAuthInfo("Сесията е изтекла. Моля, влезте отново.");
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
      setAuthInfo("Успешен вход.");
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
      setAuthInfo("Успешна регистрация. Таблото е заредено.");
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
    setActiveModule("profile");
    setTab("login");
    setAuthInfo("Излязохте успешно.");
    show("Изходът е успешен.");
  }

  async function onRefreshProfile() {
    await withBusy(async () => {
      await refreshDashboardData();
      show("Профилът и семейните данни са обновени.");
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

  async function onLoadAnswers() {
    await withBusy(async () => {
      await loadAnswers();
      show("Отговорите са обновени.");
    }, { authSensitive: true });
  }

  async function onLoadMoments() {
    await withBusy(async () => {
      await loadMoments();
      show("Моментите са обновени.");
    }, { authSensitive: true });
  }

  async function onLoadTimeline() {
    await withBusy(async () => {
      await loadTimeline();
      show("Хрониката е обновена.");
    }, { authSensitive: true });
  }

  async function onLoadTodayQuestion() {
    await withBusy(async () => {
      const result = await getTodayQuestion();
      setTodayQuestion(result);
      show(result);
    });
  }

  async function submitAnswer(event) {
    event.preventDefault();
    await withBusy(async () => {
      if (!profile?.familyId) {
          throw new Error("Профилът не е зареден.");
      }
      if (!todayQuestion?.id) {
          throw new Error("Първо заредете въпрос за деня.");
      }

      const result = await answerQuestion(Number(todayQuestion.id), {
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
          throw new Error("Профилът не е зареден.");
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
          throw new Error("Профилът не е зареден.");
      }
      if (!uploadFile) {
          throw new Error("Моля, изберете снимка.");
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
          throw new Error("Профилът не е зареден.");
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
          throw new Error("Профилът не е зареден.");
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
      show("PDF файлът е изтеглен.");
    }, { authSensitive: true });
  }

  function renderActiveModule() {
    if (activeModule === "profile") {
      return (
        <section className="card">
          <h3>Моят профил</h3>
          <p className="small-muted module-note">Вашето лично пространство и семейна принадлежност.</p>
          <div className="info-grid" id="profileCard">
            <InfoItem label="Потребител" value={profile ? `${profile.firstName} ${profile.lastName}` : "-"} />
            <InfoItem label="Email" value={profile?.email || "-"} />
            <InfoItem label="Семейство" value={profile?.familyName || family?.name || "-"} />
            <InfoItem label="Статус" value={auth?.accessToken ? "Активна сесия" : "Неактивна сесия"} />
          </div>
        </section>
      );
    }

    if (activeModule === "family") {
      return (
        <section className="card">
          <div className="cardhead">
            <h3>Вашето семейство</h3>
          </div>
          <div className="info-grid" id="familyCard">
            <InfoItem label="Семейство" value={family?.name || "-"} />
            <InfoItem label="Създадено от" value={resolveCreatedByName(family?.createdBy)} />
            <InfoItem label="Създадено на" value={formatDate(family?.createdAt)} />
          </div>
          <div className="list" id="membersList">
            {members.length === 0 ? <p className="small-muted">Все още няма данни.</p> : members.map((member) => (
              <article className="list-item" key={member.id || `${member.email}-${member.role}`}>
                <h4>{member.firstName} {member.lastName}</h4>
                <div className="list-meta">{member.role} | {member.email}</div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (activeModule === "question") {
      return (
        <section className="card">
          <div className="cardhead">
            <h3>Въпрос за днес</h3>
            <button id="todayQuestionBtn" type="button" onClick={onLoadTodayQuestion}>Зареди</button>
          </div>
          <p className="question-box" id="todayQuestionText">
            {todayQuestion ? todayQuestion.title : "Натиснете \"Зареди\", за да получите въпрос за деня."}
          </p>
          <form className="grid2" id="answerForm" onSubmit={submitAnswer}>
            <input name="answerText" type="text" placeholder="Вашият отговор" value={answerForm.answerText} onChange={updateForm(setAnswerForm)} required />
            <button type="submit">Изпрати отговор</button>
          </form>
          <div className="cardhead compact">
            <h3>Семейни отговори</h3>
            <button id="loadAnswersBtn" type="button" onClick={onLoadAnswers}>Зареди</button>
          </div>
          <div className="list" id="answersList">
            {answers.length === 0 ? <p className="small-muted">Все още няма данни.</p> : answers.map((answer) => (
              <article className="list-item" key={answer.id || `${answer.authorName}-${answer.createdAt}`}>
                <h4>{answer.questionTitle}</h4>
                <p>{answer.answerText}</p>
                <div className="list-meta">от {answer.authorName} | {formatDate(answer.createdAt)}</div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (activeModule === "moments") {
      return (
        <section className="card">
          <div className="cardhead">
            <h3>Семейни моменти</h3>
            <button id="listMomentsBtn" type="button" onClick={onLoadMoments}>Зареди</button>
          </div>
          <form className="grid2" id="createMomentForm" onSubmit={submitMoment}>
            <input name="title" type="text" placeholder="Заглавие" value={momentForm.title} onChange={updateForm(setMomentForm)} required />
            <input name="description" type="text" placeholder="Описание" value={momentForm.description} onChange={updateForm(setMomentForm)} />
            <input name="imageUrl" type="text" placeholder="Линк към снимка" value={momentForm.imageUrl} onChange={updateForm(setMomentForm)} />
            <button type="submit">Добави момент</button>
          </form>
          <div className="list" id="momentsList">
            {moments.length === 0 ? <p className="small-muted">Все още няма данни.</p> : moments.map((moment) => (
              <article className="list-item" key={moment.id || `${moment.title}-${moment.createdAt}`}>
                <h4>{moment.title}</h4>
                <p>{moment.description || "Няма описание"}</p>
                <div className="list-meta">{formatDate(moment.createdAt)}</div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (activeModule === "upload") {
      return (
        <section className="card">
          <h3>Качи снимка</h3>
          <form className="row" id="uploadForm" onSubmit={submitUpload}>
            <div className="file-picker">
              <input
                id="uploadFileInput"
                className="file-input-hidden"
                name="file"
                type="file"
                accept="image/*"
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
              />
              <label htmlFor="uploadFileInput" className="file-trigger">Избери снимка</label>
              <span className="file-name">{uploadFile?.name || "Няма избран файл"}</span>
            </div>
            <button type="submit">Качи</button>
          </form>
          <div className="small-muted" id="uploadResult">{uploadResult}</div>
        </section>
      );
    }

    if (activeModule === "timeline") {
      return (
        <section className="card">
          <div className="cardhead">
            <h3>Семейна хроника</h3>
            <button id="loadTimelineBtn" type="button" onClick={onLoadTimeline}>Зареди</button>
          </div>
          <div className="list" id="timelineList">
            {timeline.length === 0 ? <p className="small-muted">Все още няма данни.</p> : timeline.map((item) => (
              <article className="list-item" key={item.id || `${item.type}-${item.createdAt}-${item.title}`}>
                <h4>{item.type} | {item.title}</h4>
                <p>{item.details || "Няма подробности"}</p>
                <div className="list-meta">{item.author || "Семейство"} | {formatDate(item.createdAt)}</div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className="card">
        <h3>Семейна PDF книга (преглед)</h3>
        <form className="grid2" id="pdfExportForm" onSubmit={submitPdfPreview}>
          <label className="select-filter">
            Период
            <select name="period" value={pdfForm.period} onChange={updateForm(setPdfForm)}>
              <option value="monthly">Текущ месец</option>
              <option value="yearly">Текуща година</option>
              <option value="custom">Персонален избор</option>
            </select>
          </label>
          <label className="select-filter">
            Стил
            <select name="style" value={pdfForm.style} onChange={updateForm(setPdfForm)}>
              <option value="family-story">Семейна история</option>
              <option value="timeline">Хронологичен</option>
              <option value="highlights">Акценти</option>
            </select>
          </label>
          <label className="check-filter">
            <input name="includeMoments" type="checkbox" checked={pdfForm.includeMoments} onChange={updateForm(setPdfForm)} /> Включи моменти
          </label>
          <label className="check-filter">
            <input name="includeAnswers" type="checkbox" checked={pdfForm.includeAnswers} onChange={updateForm(setPdfForm)} /> Включи отговори
          </label>
          <button type="submit">Генерирай преглед</button>
        </form>
        {pdfPreviewUrl ? (
          <button id="downloadPdfBtn" type="button" onClick={onDownloadPdf}>Изтегли PDF</button>
        ) : (
          <p className="small-muted">След генериране на преглед бутонът за изтегляне ще се появи тук.</p>
        )}
        <div className="info-grid" id="pdfPreviewCard">
          <InfoItem label="Статус" value={pdfPreview?.status || "-"} />
          <InfoItem label="Период" value={pdfPreview?.period || "-"} />
          <InfoItem label="Стил" value={pdfPreview?.style || "-"} />
          <InfoItem label="Моменти" value={pdfPreview?.includedMoments ?? "-"} />
          <InfoItem label="Отговори" value={pdfPreview?.includedAnswers ?? "-"} />
        </div>
        {pdfPreviewUrl ? (
          <iframe
            title="PDF Preview"
            src={pdfPreviewUrl}
            style={{ width: "100%", minHeight: 420, border: "1px solid #e7ded2", borderRadius: 12, marginTop: 10 }}
          />
        ) : null}
      </section>
    );
  }

  return (
    <>
      {bootstrapping ? (
        <section className="auth-screen">
          <div className="auth-card">
            <p className="small-muted">Възстановяване на сесия...</p>
          </div>
        </section>
      ) : null}
      {!bootstrapping && !isLogged ? (
        <section className="auth-screen" id="authScreen">
          <div className="auth-card">
            <div className="brand-row">
                <div className="brand-mark app-logo" aria-label="Лого на приложението"></div>
              <div>
                  <h1>Нашето време</h1>
                  <p className="small-muted">Семейно пространство за спомени и разговори</p>
              </div>
            </div>

            <div className="auth-tabs">
              <button className={tab === "login" ? "active" : ""} id="showLoginBtn" type="button" onClick={() => setTab("login")}>
                Вход
              </button>
              <button className={tab === "register" ? "active" : ""} id="showRegisterBtn" type="button" onClick={() => setTab("register")}>
                Регистрация
              </button>
            </div>

            {tab === "login" ? (
              <form className="auth-form" id="loginForm" onSubmit={submitLogin}>
                <input name="email" type="email" placeholder="Email" value={loginForm.email} onChange={updateForm(setLoginForm)} required />
                <input name="password" type="password" placeholder="Парола" value={loginForm.password} onChange={updateForm(setLoginForm)} required />
                <button disabled={busy} type="submit">{busy ? "Зареждане..." : "Вход"}</button>
              </form>
            ) : (
              <form className="auth-form" id="registerForm" onSubmit={submitRegister}>
                <input name="email" type="email" placeholder="Email" value={registerForm.email} onChange={updateForm(setRegisterForm)} required />
                <input name="password" type="password" placeholder="Парола" value={registerForm.password} onChange={updateForm(setRegisterForm)} required />
                <input name="firstName" type="text" placeholder="Име" value={registerForm.firstName} onChange={updateForm(setRegisterForm)} required />
                <input name="lastName" type="text" placeholder="Фамилия" value={registerForm.lastName} onChange={updateForm(setRegisterForm)} required />
                <input name="familyName" type="text" placeholder="Име на семейство" value={registerForm.familyName} onChange={updateForm(setRegisterForm)} required />
                <button disabled={busy} type="submit">{busy ? "Зареждане..." : "Създай профил"}</button>
              </form>
            )}

            <p className="small-muted" id="authInfo">{authInfo}</p>
          </div>
        </section>
      ) : null}
      {!bootstrapping && isLogged ? (
        <section className="shell" id="appScreen">
          <aside className="sidebar">
            <div className="user-meta">
              <div className="brand-row brand-row-side">
                <div className="brand-mark app-logo" aria-label="Лого на приложението"></div>
                <p className="brand-side-title">Нашето време</p>
              </div>
              <button id="logoutBtn" className="secondary logout-btn" type="button" onClick={logout}>Изход</button>
            </div>

            <section className="sidebar-card module-card">
              <div className="module-menu">
                {dashboardModules.map((module) => (
                  <button
                    key={module.key}
                    type="button"
                    className={activeModule === module.key ? "module-tab active" : "module-tab"}
                    onClick={() => setActiveModule(module.key)}
                  >
                    {module.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="sidebar-card mood-card">
              <h3>{sidebarHighlight.title}</h3>
              <p className="mood-quote">"{sidebarHighlight.text}"</p>
              <div className="mood-ornaments" aria-hidden="true">
                <div className="polaroid-mini">
                  <div className="polaroid-image"></div>
                  <div className="polaroid-line"></div>
                </div>
              </div>
            </section>
          </aside>

          <main className="main-content">
            <div className="topbar">
              <h2>{dashboardModules.find((module) => module.key === activeModule)?.label || "Добре дошли"}</h2>
              <p className="small-muted">{profileInfo}</p>
            </div>
            {renderActiveModule()}

            {/* Debug output intentionally hidden from end users. */}
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
