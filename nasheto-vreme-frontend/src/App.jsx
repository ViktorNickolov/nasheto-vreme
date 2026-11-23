import { useEffect, useMemo, useState } from "react";
import {
  answerQuestion,
  clearAuth,
  createMoment,
  createPdfPreview,
  downloadUploadedFile,
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
  sendFamilyInvitation,
  setApiBaseUrl,
  setAuth,
  uploadImage,
  uploadProfileImage
} from "./api.js";

const initialLogin = { email: "", password: "" };
const initialRegister = { email: "", password: "", firstName: "", lastName: "", familyName: "", inviteToken: "" };
const initialAnswer = { answerText: "" };
const initialMoment = { title: "", description: "", imageUrl: "" };
const initialInvite = { email: "", role: "CHILD" };
const initialPdf = {
  period: "monthly",
  style: "family-story",
  includeMoments: true,
  includeAnswers: true
};

const dashboardModules = [
  { key: "profile", label: "Моят профил" },
  { key: "family", label: "Вашето семейство" },
  { key: "question", label: "Въпрос на деня" },
  { key: "moments", label: "Семейни моменти" },
  { key: "timeline", label: "Семейна хроника" },
  { key: "pdf", label: "Семейна PDF книга" }
];

const ACTIVE_MODULE_KEY = "nv_active_module";

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

function getInitialActiveModule() {
  if (typeof globalThis === "undefined" || !globalThis.sessionStorage) {
    return "profile";
  }
  const saved = globalThis.sessionStorage.getItem(ACTIVE_MODULE_KEY);
  if (saved && dashboardModules.some((module) => module.key === saved)) {
    return saved;
  }
  return "profile";
}

function readInviteContextFromUrl() {
  if (typeof window === "undefined") {
    return { token: "", email: "" };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    token: (params.get("inviteToken") || "").trim(),
    email: (params.get("inviteEmail") || "").trim()
  };
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
  const [todayQuestion, setTodayQuestion] = useState(null);
  const [output, setOutput] = useState("Ready.");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [activeModule, setActiveModule] = useState(() => getInitialActiveModule());
  const [sidebarHighlight] = useState(() => pickSidebarHighlight());
  const [inviteContext] = useState(() => readInviteContextFromUrl());
  const [selectedTimelineMemberId, setSelectedTimelineMemberId] = useState("all");
  const [selectedTimelineType, setSelectedTimelineType] = useState("all");
  const [timelineDateFrom, setTimelineDateFrom] = useState("");
  const [timelineDateTo, setTimelineDateTo] = useState("");

  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [answerForm, setAnswerForm] = useState(initialAnswer);
  const [momentForm, setMomentForm] = useState(initialMoment);
  const [pdfForm, setPdfForm] = useState(initialPdf);
  const [uploadFile, setUploadFile] = useState(null);
  const [profileUploadFile, setProfileUploadFile] = useState(null);
  const [inviteForm, setInviteForm] = useState(initialInvite);

  const isLogged = Boolean(auth?.accessToken);
  const canInviteMembers = profile?.role === "PARENT";

  const profileInfo = useMemo(() => {
    if (!profile) {
      return "Профилът не е зареден";
    }
    return `${profile.firstName} ${profile.lastName} | ${profile.familyName || "Без семейство"}`;
  }, [profile]);

  const ownAnswers = useMemo(() => {
    if (!profile) {
      return [];
    }
    return answers.filter((answer) => isOwnAnswer(answer, profile));
  }, [answers, profile]);

  const ownMoments = useMemo(() => {
    if (!profile) {
      return [];
    }
    return moments.filter((moment) => isOwnMoment(moment, profile));
  }, [moments, profile]);

  const filteredTimeline = useMemo(() => {
    let result = timeline;

    if (selectedTimelineMemberId !== "all") {
      const selectedMember = members.find((member) => Number(member.userId) === Number(selectedTimelineMemberId));
      if (selectedMember) {
        result = result.filter((item) => matchesTimelineMember(item, selectedMember));
      }
    }

    if (selectedTimelineType !== "all") {
      result = result.filter((item) => matchesTimelineType(item, selectedTimelineType));
    }

    result = result.filter((item) => isWithinDateRange(item?.createdAt, timelineDateFrom, timelineDateTo));
    return result;
  }, [members, selectedTimelineMemberId, selectedTimelineType, timeline, timelineDateFrom, timelineDateTo]);

  const familyMembersWithLogged = useMemo(() => {
    const list = Array.isArray(members) ? [...members] : [];
    if (!profile) {
      return list;
    }

    const exists = list.some((member) => {
      if (member?.userId != null && profile?.id != null) {
        return Number(member.userId) === Number(profile.id);
      }
      return normalizeName(member?.email) === normalizeName(profile?.email);
    });

    if (!exists) {
      list.unshift({
        id: `self-${profile.id || profile.email || "current"}`,
        userId: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: "MEMBER"
      });
    }

    return list;
  }, [members, profile]);

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
    setTodayQuestion(null);
    setAnswerForm(initialAnswer);
    setMomentForm(initialMoment);
    setPdfForm(initialPdf);
    setUploadFile(null);
    setSelectedTimelineMemberId("all");
    setSelectedTimelineType("all");
    setTimelineDateFrom("");
    setTimelineDateTo("");
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      if (inviteContext.token) {
        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", window.location.pathname);
        }
        clearAuth();
        setAuthState(null);
        resetDashboardState();
        setTab("register");
        setRegisterForm((current) => ({
          ...current,
          inviteToken: inviteContext.token,
          email: inviteContext.email || current.email
        }));
        setAuthInfo("Отворихте покана за присъединяване към семейство.");
        if (!cancelled) {
          setBootstrapping(false);
        }
        return;
      }

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
  }, [inviteContext.email, inviteContext.token]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        window.URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  useEffect(() => {
    if (typeof globalThis === "undefined" || !globalThis.sessionStorage) {
      return;
    }
    globalThis.sessionStorage.setItem(ACTIVE_MODULE_KEY, activeModule);
  }, [activeModule]);

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
      if (options.authSensitive && error?.status === 401) {
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

  async function loadTodayQuestionData() {
    const result = await getTodayQuestion();
    setTodayQuestion(result);
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
      loadTimeline(profileResult),
      loadTodayQuestionData()
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
      const payload = {
        ...registerForm,
        familyName: registerForm.familyName?.trim() || "",
        inviteToken: registerForm.inviteToken?.trim() || ""
      };
      const result = await register(payload);
      setAuth(result);
      setAuthState(result);
      setAuthInfo("Успешна регистрация. Таблото е заредено.");
      await refreshDashboardData();
      show(result);
    });
  }

  async function submitInvite(event) {
    event.preventDefault();
    await withBusy(async () => {
      if (!profile?.familyId) {
        throw new Error("Профилът не е зареден.");
      }

      const response = await sendFamilyInvitation(Number(profile.familyId), {
        email: inviteForm.email.trim(),
        role: inviteForm.role
      });
      setInviteForm(initialInvite);
      show(response);
      if (response?.deliveryStatus === "SENT") {
        setAuthInfo("Поканата е изпратена успешно.");
      } else {
        setAuthInfo(`Имейлът не е изпратен (${response?.deliveryStatus || "UNKNOWN"}). Използвайте линка ръчно: ${response?.inviteLink || "-"}`);
      }
    }, { authSensitive: true });
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

      await Promise.all([loadAnswers(), loadTimeline()]);
      show(result);
    }, { authSensitive: true });
  }

  async function submitMoment(event) {
    event.preventDefault();
    await withBusy(async () => {
      if (!profile?.familyId) {
          throw new Error("Профилът не е зареден.");
      }

      let resolvedImageUrl = momentForm.imageUrl;
      if (uploadFile) {
        const uploadResponse = await uploadImage(Number(profile.familyId), uploadFile);
        resolvedImageUrl = uploadResponse.relativePath || resolvedImageUrl;
      }

      const result = await createMoment({
        familyId: Number(profile.familyId),
        title: momentForm.title,
        description: momentForm.description,
        imageUrl: resolvedImageUrl
      });

      setMomentForm(initialMoment);
      setUploadFile(null);
      await Promise.all([loadMoments(), loadTimeline()]);
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

  async function onUploadProfilePhoto() {
    await withBusy(async () => {
      if (!profileUploadFile) {
        throw new Error("Изберете снимка за профила.");
      }
      const updatedProfile = await uploadProfileImage(profileUploadFile);
      setProfile(updatedProfile);
      setProfileUploadFile(null);
      show("Профилната снимка е обновена.");
    }, { authSensitive: true });
  }

  function renderActiveModule() {
    if (activeModule === "profile") {
      return (
        <section className="card">
          <h3>Моят профил</h3>
          <p className="small-muted module-note">Вашето лично пространство и семейна принадлежност.</p>
          {profile?.profileImageUrl ? (
            <ProfileImagePreview filePath={profile.profileImageUrl} />
          ) : (
            <p className="small-muted">Няма профилна снимка.</p>
          )}
          <div className="upload-inline profile-upload-inline">
            <input
              id="profileImageInput"
              className="file-input-hidden"
              type="file"
              accept="image/*"
              onChange={(event) => setProfileUploadFile(event.target.files?.[0] || null)}
            />
            <label htmlFor="profileImageInput" className="file-trigger">Избери профилна снимка</label>
            {profileUploadFile ? <span className="attached-file">{profileUploadFile.name}</span> : null}
            <button type="button" onClick={onUploadProfilePhoto} disabled={!profileUploadFile || busy}>Качи</button>
          </div>
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
            {familyMembersWithLogged.length === 0 ? <p className="small-muted">Все още няма данни.</p> : familyMembersWithLogged.map((member) => (
              <article className="list-item" key={member.id || `${member.email}-${member.role}`}>
                <h4>{member.firstName} {member.lastName}</h4>
                <div className="list-meta">{member.role} | {member.email}</div>
              </article>
            ))}
          </div>
          {canInviteMembers ? (
            <form className="grid2" id="inviteForm" onSubmit={submitInvite}>
              <input
                name="email"
                type="email"
                placeholder="Email за покана"
                value={inviteForm.email}
                onChange={updateForm(setInviteForm)}
                required
              />
              <label className="select-filter">
                Роля
                <select name="role" value={inviteForm.role} onChange={updateForm(setInviteForm)}>
                  <option value="PARENT">Родител</option>
                  <option value="CHILD">Дете</option>
                </select>
              </label>
              <button type="submit">Изпрати покана</button>
            </form>
          ) : (
            <p className="small-muted">Само родител може да изпраща покани.</p>
          )}
        </section>
      );
    }

    if (activeModule === "question") {
      return (
        <section className="card">
          <div className="cardhead">
            <h3>Въпрос на деня</h3>
          </div>
          <p className="question-box" id="todayQuestionText">
            {todayQuestion ? todayQuestion.title : "Въпросът за деня се зарежда..."}
          </p>
          <form className="grid2" id="answerForm" onSubmit={submitAnswer}>
            <input name="answerText" type="text" placeholder="Вашият отговор" value={answerForm.answerText} onChange={updateForm(setAnswerForm)} required />
            <button type="submit">Изпрати отговор</button>
          </form>
          <div className="cardhead compact">
            <h3>Моите отговори</h3>
          </div>
          <div className="list" id="answersList">
            {ownAnswers.length === 0 ? <p className="small-muted">Все още нямате отговори.</p> : ownAnswers.map((answer) => (
              <article className="list-item" key={answer.id || `${answer.authorName}-${answer.createdAt}`}>
                <h4>{answer.questionTitle}</h4>
                <p>{answer.answerText}</p>
                <div className="list-meta">{answer.authorName || "Семейство"} | {formatDate(answer.createdAt)}</div>
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
          </div>
          <form className="grid2" id="createMomentForm" onSubmit={submitMoment}>
            <input name="title" type="text" placeholder="Заглавие" value={momentForm.title} onChange={updateForm(setMomentForm)} required />
            <input name="description" type="text" placeholder="Описание" value={momentForm.description} onChange={updateForm(setMomentForm)} />
            <div className="upload-inline" id="uploadForm">
              <input
                id="uploadFileInput"
                className="file-input-hidden"
                name="file"
                type="file"
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
              />
              <label htmlFor="uploadFileInput" className="file-trigger">Избери файл</label>
              {uploadFile ? <span className="attached-file">Прикачена: {uploadFile.name}</span> : null}
              <button type="submit">Добави момент</button>
            </div>
          </form>
          <span id="uploadResult" className="hidden" aria-hidden="true"></span>
          <div className="list" id="momentsList">
            {ownMoments.length === 0 ? <p className="small-muted">Все още нямате добавени моменти.</p> : ownMoments.map((moment) => (
              <article className="list-item" key={moment.id || `${moment.title}-${moment.createdAt}`}>
                <h4>{moment.title}</h4>
                {moment.imageUrl ? <AttachmentPreview filePath={moment.imageUrl} /> : null}
                <p>{moment.description || "Няма описание"}</p>
                <div className="list-meta">{moment.authorName || "Семейство"} | {formatDate(moment.createdAt)}</div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (activeModule === "timeline") {
      return (
        <section className="card">
          <div className="cardhead">
            <h3>Семейна хроника</h3>
          </div>
          <div className="timeline-filters" id="timelineFilters">
            <button
              className={selectedTimelineType === "all" ? "timeline-filter-chip active" : "timeline-filter-chip"}
              type="button"
              onClick={() => setSelectedTimelineType("all")}
            >
              Всички типове
            </button>
            <button
              className={selectedTimelineType === "question" ? "timeline-filter-chip active" : "timeline-filter-chip"}
              type="button"
              onClick={() => setSelectedTimelineType("question")}
            >
              Въпроси
            </button>
            <button
              className={selectedTimelineType === "moment" ? "timeline-filter-chip active" : "timeline-filter-chip"}
              type="button"
              onClick={() => setSelectedTimelineType("moment")}
            >
              Моменти
            </button>
          </div>
          <div className="timeline-filters timeline-date-filters">
            <label className="timeline-date-input">
              От
              <input type="date" value={timelineDateFrom} onChange={(event) => setTimelineDateFrom(event.target.value)} />
            </label>
            <label className="timeline-date-input">
              До
              <input type="date" value={timelineDateTo} onChange={(event) => setTimelineDateTo(event.target.value)} />
            </label>
            <button
              className="timeline-filter-chip"
              type="button"
              onClick={() => {
                setTimelineDateFrom("");
                setTimelineDateTo("");
              }}
            >
              Изчисти дати
            </button>
          </div>
          <div className="timeline-filters">
            <button
              className={selectedTimelineMemberId === "all" ? "timeline-filter-chip active" : "timeline-filter-chip"}
              type="button"
              onClick={() => setSelectedTimelineMemberId("all")}
            >
              Всички
            </button>
            {members.map((member) => {
              const memberId = String(member.userId);
              const isActive = selectedTimelineMemberId === memberId;
              return (
                <button
                  key={member.id || memberId}
                  className={isActive ? "timeline-filter-chip active" : "timeline-filter-chip"}
                  type="button"
                  onClick={() => setSelectedTimelineMemberId(memberId)}
                >
                  {resolveMemberName(member)}
                </button>
              );
            })}
          </div>
          <div className="list" id="timelineList">
            {filteredTimeline.length === 0 ? <p className="small-muted">Няма записи за избрания член.</p> : filteredTimeline.map((item) => (
              <article className="list-item" key={item.id || `${item.type}-${item.createdAt}-${item.title}`}>
                <h4>{item.type} | {item.title}</h4>
                {item.imageUrl ? <AttachmentPreview filePath={item.imageUrl} /> : null}
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
                {!registerForm.inviteToken?.trim() ? (
                  <input
                    name="familyName"
                    type="text"
                    placeholder="Име на семейство"
                    value={registerForm.familyName}
                    onChange={updateForm(setRegisterForm)}
                    required
                  />
                ) : null}
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

function AttachmentPreview({ filePath }) {
  const [fileHref, setFileHref] = useState("");
  const [contentType, setContentType] = useState("");
  const [downloadName, setDownloadName] = useState("attachment");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    let disposed = false;
    let objectUrl = "";

    async function loadAttachment() {
      if (!filePath) {
        return;
      }

      if (/^https?:\/\//i.test(filePath)) {
        if (!disposed) {
          setFileHref(filePath);
          setContentType("");
          const nameFromUrl = filePath.split("/").pop();
          setDownloadName(nameFromUrl || "attachment");
        }
        return;
      }

      try {
        const result = await downloadUploadedFile(filePath);
        if (disposed) {
          return;
        }

        objectUrl = window.URL.createObjectURL(result.blob);
        setFileHref(objectUrl);
        setContentType(result.contentType || "");
        setDownloadName(result.fileName || "attachment");
      } catch {
        if (!disposed) {
          setFileHref("");
          setContentType("");
          setDownloadName("attachment");
          setIsPreviewOpen(false);
        }
      }
    }

    setFileHref("");
    setContentType("");
    setDownloadName("attachment");
    setIsPreviewOpen(false);
    loadAttachment();

    return () => {
      disposed = true;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [filePath]);

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPreviewOpen]);

  if (fileHref) {
    const isImage = contentType.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(downloadName);
    return (
      <>
        <div className="timeline-file-actions">
          <button className="timeline-link-button" type="button" onClick={() => setIsPreviewOpen(true)}>Виж</button>
          <a className="timeline-download-link" href={fileHref} download={downloadName}>Свали</a>
        </div>
        {isPreviewOpen ? (
          <div className="attachment-modal-backdrop" onClick={() => setIsPreviewOpen(false)} role="presentation">
            <div className="attachment-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
              <button className="attachment-modal-close" type="button" onClick={() => setIsPreviewOpen(false)}>Затвори</button>
              {isImage ? (
                <img className="attachment-modal-image" src={fileHref} alt="Преглед" />
              ) : (
                <iframe className="attachment-modal-frame" src={fileHref} title="Преглед на файл" />
              )}
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return null;
}

function ProfileImagePreview({ filePath }) {
  const [imageSrc, setImageSrc] = useState("");

  useEffect(() => {
    let disposed = false;
    let objectUrl = "";

    async function loadImage() {
      if (!filePath) {
        setImageSrc("");
        return;
      }

      try {
        const result = await downloadUploadedFile(filePath);
        if (disposed) {
          return;
        }
        objectUrl = window.URL.createObjectURL(result.blob);
        setImageSrc(objectUrl);
      } catch {
        if (!disposed) {
          setImageSrc("");
        }
      }
    }

    loadImage();

    return () => {
      disposed = true;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [filePath]);

  if (!imageSrc) {
    return null;
  }

  return <img className="profile-image-preview" src={imageSrc} alt="Профилна снимка" />;
}

function matchesTimelineMember(item, member) {
  if (!item || !member) {
    return false;
  }

  if (item.authorId != null && member.userId != null) {
    return Number(item.authorId) === Number(member.userId);
  }

  return normalizeName(item.author) === normalizeName(resolveMemberName(member));
}

function isOwnAnswer(answer, profile) {
  if (!answer || !profile) {
    return false;
  }

  if (answer.authorId != null && profile.id != null) {
    return Number(answer.authorId) === Number(profile.id);
  }

  return normalizeName(answer.authorName) === normalizeName(`${profile.firstName || ""} ${profile.lastName || ""}`);
}

function isOwnMoment(moment, profile) {
  if (!moment || !profile) {
    return false;
  }

  if (moment.authorId != null && profile.id != null) {
    return Number(moment.authorId) === Number(profile.id);
  }

  return normalizeName(moment.authorName) === normalizeName(`${profile.firstName || ""} ${profile.lastName || ""}`);
}

function matchesTimelineType(item, type) {
  if (type === "question") {
    return item?.type === "ANSWER";
  }
  if (type === "moment") {
    return item?.type === "MOMENT";
  }
  return true;
}

function isWithinDateRange(value, fromDate, toDate) {
  if (!value) {
    return false;
  }

  const itemDate = new Date(value);
  if (Number.isNaN(itemDate.getTime())) {
    return false;
  }

  if (fromDate) {
    const start = new Date(`${fromDate}T00:00:00`);
    if (itemDate < start) {
      return false;
    }
  }

  if (toDate) {
    const end = new Date(`${toDate}T23:59:59.999`);
    if (itemDate > end) {
      return false;
    }
  }

  return true;
}

function resolveMemberName(member) {
  return `${member?.firstName || ""} ${member?.lastName || ""}`.trim() || member?.email || "Член";
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}


