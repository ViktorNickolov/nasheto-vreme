import { useEffect, useMemo, useState } from "react";
import {
  answerQuestion,
  clearAuth,
  createEmotion,
  createMoment,
  createPrivacyRequest,
  createPdfPreview,
  createTogetherActivity,
  downloadUploadedFile,
  downloadPdfBook,
  exportMyPrivacyData,
  getApiBaseUrl,
  getAuth,
  getFamily,
  getFamilyAnswers,
  getFamilyMembers,
  getTimeline,
  getTodayQuestion,
  listMoments,
  listEmotions,
  listMyPrivacyRequests,
  listTogetherActivities,
  login,
  logoutSession,
  me,
  refreshToken,
  register,
  sendFamilyInvitation,
  setApiBaseUrl,
  setApiLanguage,
  setAuth,
  uploadImage,
  uploadProfileImage
} from "./api.js";
import { localizeTimelineType } from "./i18n/timelineTypeLabels.js";

const initialLogin = { email: "", password: "" };
const initialRegister = { email: "", password: "", firstName: "", lastName: "", familyName: "", inviteToken: "" };
const initialAnswer = { answerText: "" };
const initialMoment = { title: "", description: "", imageUrl: "" };
const initialEmotion = { emotionType: "HAPPY", happenedNote: "", helpedNote: "", needsNote: "", wantToTalk: false };
const initialTogether = { title: "", category: "", description: "", durationMinutes: 15 };
const initialPrivacyRequest = { requestType: "EXPORT_DATA", note: "" };
const initialInvite = { email: "", role: "CHILD" };
const initialPdf = {
  period: "monthly",
  style: "family-story",
  includeMoments: true,
  includeAnswers: true
};

const MODULE_KEYS = ["profile", "family", "question", "moments", "emotions", "together", "timeline", "pdf"];

const dashboardLabels = {
  bg: {
    profile: "Моят профил",
    family: "Вашето семейство",
    question: "Въпрос на деня",
    moments: "Семейни моменти",
    emotions: "Нашите емоции",
    together: "Време заедно",
    timeline: "Семейна хроника",
    pdf: "Семейна PDF книга"
  },
  en: {
    profile: "My profile",
    family: "Your family",
    question: "Question of the day",
    moments: "Family moments",
    emotions: "Our emotions",
    together: "Time together",
    timeline: "Family timeline",
    pdf: "Family PDF book"
  }
};

const ACTIVE_MODULE_KEY = "nv_active_module";
const QUESTION_LANG_KEY = "nv_question_lang";

const sidebarHighlights = {
  bg: [
    { title: "Семейна искра", text: "Спомените оживяват, когато ги споделяме заедно." },
    { title: "Миг от днес", text: "Всяка снимка е малка врата към щастлив миг." },
    { title: "Семейна история", text: "Семейството е история, която пишем всеки ден." },
    { title: "Дневен акцент", text: "Днес е добър ден да запазим още един красив момент." },
    { title: "Топла връзка", text: "Най-силните връзки се градят с внимание и време." }
  ],
  en: [
    { title: "Family spark", text: "Memories come alive when we share them together." },
    { title: "Moment of today", text: "Every photo is a small door to a happy moment." },
    { title: "Family story", text: "Family is a story we write every day." },
    { title: "Daily highlight", text: "Today is a good day to keep one more beautiful memory." },
    { title: "Warm bond", text: "The strongest bonds grow with care and time." }
  ]
};

const webText = {
  bg: {
    inviteOpened: "Отворихте покана за присъединяване към семейство.",
    sessionExpired: "Сесията е изтекла. Моля, влезте отново.",
    loginSuccess: "Успешен вход.",
    registerSuccess: "Успешна регистрация. Таблото е заредено.",
    profileNotLoaded: "Профилът не е зареден.",
    loadQuestionFirst: "Първо заредете въпрос за деня.",
    inviteSent: "Поканата е изпратена успешно.",
    inviteNotSent: "Имейлът не е изпратен",
    loggedOutInfo: "Излязохте успешно.",
    loggedOutOutput: "Изходът е успешен.",
    profileUpdated: "Профилът и семейните данни са обновени.",
    pdfDownloaded: "PDF файлът е изтеглен.",
    chooseProfilePhoto: "Изберете снимка за профила.",
    profilePhotoUpdated: "Профилната снимка е обновена.",
    profileHint: "Вашето лично пространство и семейна принадлежност.",
    noProfilePhoto: "Няма профилна снимка.",
    profilePhotoAlt: "Профилна снимка",
    pickProfilePhoto: "Избери профилна снимка",
    upload: "Качи",
    user: "Потребител",
    family: "Семейство",
    status: "Статус",
    activeSession: "Активна сесия",
    inactiveSession: "Неактивна сесия",
    createdBy: "Създадено от",
    createdOn: "Създадено на",
    noDataYet: "Все още няма данни.",
    inviteEmailPlaceholder: "Email за покана",
    role: "Роля",
    parent: "Родител",
    child: "Дете",
    sendInvite: "Изпрати покана",
    parentOnlyInvite: "Само родител може да изпраща покани.",
    questionLoading: "Въпросът за деня се зарежда...",
    yourAnswer: "Вашият отговор",
    sendAnswer: "Изпрати отговор",
    myAnswers: "Моите отговори",
    noAnswersYet: "Все още нямате отговори.",
    titlePlaceholder: "Заглавие",
    descriptionPlaceholder: "Описание",
    pickFile: "Избери файл",
    attached: "Прикачена:",
    addMoment: "Добави момент",
    noMomentsYet: "Все още нямате добавени моменти.",
    noDescription: "Няма описание",
    allTypes: "Всички типове",
    questions: "Въпроси",
    moments: "Моменти",
    from: "От",
    to: "До",
    clearDates: "Изчисти дати",
    all: "Всички",
    noTimelineForMember: "Няма записи за избрания член.",
    noDetails: "Няма подробности",
    period: "Период",
    currentMonth: "Текущ месец",
    currentYear: "Текуща година",
    customRange: "Персонален избор",
    style: "Стил",
    familyStory: "Семейна история",
    chronological: "Хронологичен",
    highlights: "Акценти",
    includeMoments: "Включи моменти",
    includeAnswers: "Включи отговори",
    preview: "Преглед",
    download: "Свали",
    downloadHint: "След генериране на преглед бутонът за изтегляне ще се появи тук.",
    bootstrapping: "Възстановяване на сесия...",
    appSubtitle: "Семейно пространство за спомени и разговори",
    loginTab: "Вход",
    registerTab: "Регистрация",
    password: "Парола",
    firstName: "Име",
    lastName: "Фамилия",
    familyName: "Име на семейство",
    createProfile: "Създай профил",
    loading: "Зареждане...",
    email: "Имейл",
    appName: "Нашето време",
    noAccountRegister: "Нямате профил? Регистрация",
    haveAccountLogin: "Имате профил? Вход",
    logout: "Изход",
    welcome: "Добре дошли",
    close: "Затвори",
    previewAlt: "Преглед",
    filePreviewTitle: "Преглед на файл",
    memberFallback: "Семейство",
    unknown: "НЕИЗВЕСТНО",
    unknownStatus: "Неизвестен",
    sessionRestored: "Сесията е възстановена.",
    emailNotSentPrefix: "Имейлът не е изпратен",
    familyPulse: "Семеен ритъм",
    quickStats: "Бързи числа",
    answersCount: "Отговори",
    momentsCount: "Моменти",
    timelineCount: "Хроника",
    pulseTipTitle: "Малка идея за днес",
    pulseTip: "Добавете един момент със снимка и кратко описание.",
    emotionType: "Емоция",
    happenedNote: "Какво се случи?",
    helpedNote: "Какво ти помогна?",
    needsNote: "От какво имаш нужда?",
    wantToTalk: "Искаш ли да поговорим?",
    saveEmotion: "Запази емоция",
    noEmotionsYet: "Все още няма споделени емоции.",
    togetherTitlePlaceholder: "Идея за дейност",
    togetherCategoryPlaceholder: "Категория (Разговори, Игри, Навън)",
    durationMinutes: "Продължителност (минути)",
    saveTogetherActivity: "Запази дейност",
    noTogetherActivitiesYet: "Все още няма запазени дейности.",
    privacyCenter: "Поверителност и данни",
    privacyExport: "Експорт на моите данни",
    privacyDelete: "Заявка за изтриване на данни",
    submitPrivacyRequest: "Изпрати заявка",
    privacyRequests: "Моите заявки",
    noPrivacyRequests: "Няма изпратени заявки.",
    privacyRequestType: "Тип заявка",
    privacyRequestNote: "Бележка (по желание)",
    privacyRequestSent: "Заявката е изпратена.",
    privacyExportReady: "Експортът е подготвен и изтеглен.",
    emotionHappy: "Радост",
    emotionSad: "Тъга",
    emotionAngry: "Гняв",
    emotionFear: "Страх",
    emotionCalm: "Спокойствие",
    emotionExcited: "Вълнение"
  },
  en: {
    inviteOpened: "You opened a family invite link.",
    sessionExpired: "Session expired. Please sign in again.",
    loginSuccess: "Signed in successfully.",
    registerSuccess: "Registration successful. Dashboard loaded.",
    profileNotLoaded: "Profile is not loaded.",
    loadQuestionFirst: "Load today's question first.",
    inviteSent: "Invitation sent successfully.",
    inviteNotSent: "Email was not sent",
    loggedOutInfo: "Logged out successfully.",
    loggedOutOutput: "Logout completed.",
    profileUpdated: "Profile and family data were refreshed.",
    pdfDownloaded: "PDF downloaded.",
    chooseProfilePhoto: "Choose a profile photo.",
    profilePhotoUpdated: "Profile photo updated.",
    profileHint: "Your personal space and family context.",
    noProfilePhoto: "No profile photo.",
    profilePhotoAlt: "Profile photo",
    pickProfilePhoto: "Choose profile photo",
    upload: "Upload",
    user: "User",
    family: "Family",
    status: "Status",
    activeSession: "Active session",
    inactiveSession: "Inactive session",
    createdBy: "Created by",
    createdOn: "Created on",
    noDataYet: "No data yet.",
    inviteEmailPlaceholder: "Invite email",
    role: "Role",
    parent: "Parent",
    child: "Child",
    sendInvite: "Send invite",
    parentOnlyInvite: "Only a parent can send invites.",
    questionLoading: "Loading today's question...",
    yourAnswer: "Your answer",
    sendAnswer: "Send answer",
    myAnswers: "My answers",
    noAnswersYet: "You have no answers yet.",
    titlePlaceholder: "Title",
    descriptionPlaceholder: "Description",
    pickFile: "Choose file",
    attached: "Attached:",
    addMoment: "Add moment",
    noMomentsYet: "You have no moments yet.",
    noDescription: "No description",
    allTypes: "All types",
    questions: "Questions",
    moments: "Moments",
    from: "From",
    to: "To",
    clearDates: "Clear dates",
    all: "All",
    noTimelineForMember: "No records for the selected member.",
    noDetails: "No details",
    period: "Period",
    currentMonth: "Current month",
    currentYear: "Current year",
    customRange: "Custom range",
    style: "Style",
    familyStory: "Family story",
    chronological: "Chronological",
    highlights: "Highlights",
    includeMoments: "Include moments",
    includeAnswers: "Include answers",
    preview: "Preview",
    download: "Download",
    downloadHint: "After generating a preview, the download button will appear here.",
    bootstrapping: "Restoring session...",
    appSubtitle: "A family place for memories and conversations",
    loginTab: "Login",
    registerTab: "Register",
    password: "Password",
    firstName: "First name",
    lastName: "Last name",
    familyName: "Family name",
    createProfile: "Create profile",
    loading: "Loading...",
    email: "Email",
    appName: "Our Time",
    noAccountRegister: "No account? Register",
    haveAccountLogin: "Have an account? Login",
    logout: "Logout",
    welcome: "Welcome",
    close: "Close",
    previewAlt: "Preview",
    filePreviewTitle: "File preview",
    memberFallback: "Family",
    unknown: "UNKNOWN",
    unknownStatus: "Unknown",
    sessionRestored: "Session restored.",
    emailNotSentPrefix: "Email was not sent",
    familyPulse: "Family pulse",
    quickStats: "Quick stats",
    answersCount: "Answers",
    momentsCount: "Moments",
    timelineCount: "Timeline",
    pulseTipTitle: "Small idea for today",
    pulseTip: "Add one moment with a photo and short description.",
    emotionType: "Emotion",
    happenedNote: "What happened?",
    helpedNote: "What helped you?",
    needsNote: "What do you need?",
    wantToTalk: "Would you like to talk?",
    saveEmotion: "Save emotion",
    noEmotionsYet: "No shared emotions yet.",
    togetherTitlePlaceholder: "Activity idea",
    togetherCategoryPlaceholder: "Category (Talks, Games, Outdoors)",
    durationMinutes: "Duration (minutes)",
    saveTogetherActivity: "Save activity",
    noTogetherActivitiesYet: "No saved activities yet.",
    privacyCenter: "Privacy and data",
    privacyExport: "Export my data",
    privacyDelete: "Delete data request",
    submitPrivacyRequest: "Submit request",
    privacyRequests: "My requests",
    noPrivacyRequests: "No requests submitted yet.",
    privacyRequestType: "Request type",
    privacyRequestNote: "Note (optional)",
    privacyRequestSent: "Request submitted.",
    privacyExportReady: "Your export has been prepared and downloaded.",
    emotionHappy: "Happy",
    emotionSad: "Sad",
    emotionAngry: "Angry",
    emotionFear: "Fear",
    emotionCalm: "Calm",
    emotionExcited: "Excited"
  }
};

function getDashboardModules(language) {
  const labels = dashboardLabels[language] || dashboardLabels.bg;
  return MODULE_KEYS.map((key) => ({ key, label: labels[key] }));
}

function pickSidebarHighlight(language) {
  const list = sidebarHighlights[language] || sidebarHighlights.bg;
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function getInitialActiveModule() {
  if (typeof globalThis === "undefined" || !globalThis.sessionStorage) {
    return "profile";
  }
  const saved = globalThis.sessionStorage.getItem(ACTIVE_MODULE_KEY);
  if (saved && MODULE_KEYS.includes(saved)) {
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

function detectQuestionLanguage() {
  if (typeof navigator === "undefined") {
    return "bg";
  }
  const locale = (navigator.language || "").toLowerCase();
  return locale.startsWith("en") ? "en" : "bg";
}

function getInitialQuestionLanguage() {
  if (typeof window === "undefined") {
    return detectQuestionLanguage();
  }
  const saved = (window.localStorage.getItem(QUESTION_LANG_KEY) || "").toLowerCase();
  if (saved === "bg" || saved === "en") {
    return saved;
  }
  return detectQuestionLanguage();
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
  const [emotions, setEmotions] = useState([]);
  const [togetherActivities, setTogetherActivities] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [todayQuestion, setTodayQuestion] = useState(null);
  const [output, setOutput] = useState("Ready.");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [activeModule, setActiveModule] = useState(() => getInitialActiveModule());
  const [inviteContext] = useState(() => readInviteContextFromUrl());
  const [selectedTimelineMemberId, setSelectedTimelineMemberId] = useState("all");
  const [selectedTimelineType, setSelectedTimelineType] = useState("all");
  const [timelineDateFrom, setTimelineDateFrom] = useState("");
  const [timelineDateTo, setTimelineDateTo] = useState("");
  const [questionLanguage, setQuestionLanguage] = useState(() => getInitialQuestionLanguage());

  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [answerForm, setAnswerForm] = useState(initialAnswer);
  const [momentForm, setMomentForm] = useState(initialMoment);
  const [pdfForm, setPdfForm] = useState(initialPdf);
  const [uploadFile, setUploadFile] = useState(null);
  const [profileUploadFile, setProfileUploadFile] = useState(null);
  const [inviteForm, setInviteForm] = useState(initialInvite);
  const [emotionForm, setEmotionForm] = useState(initialEmotion);
  const [togetherForm, setTogetherForm] = useState(initialTogether);
  const [privacyRequestForm, setPrivacyRequestForm] = useState(initialPrivacyRequest);
  const [privacyRequests, setPrivacyRequests] = useState([]);

  const isLogged = Boolean(auth?.accessToken);
  const canInviteMembers = profile?.role === "PARENT";
  const ui = useMemo(() => webText[questionLanguage] || webText.bg, [questionLanguage]);
  const languageToggleLabel = questionLanguage === "bg" ? "EN" : "БГ";
  const nextLanguage = questionLanguage === "bg" ? "en" : "bg";
  const dashboardModules = useMemo(() => getDashboardModules(questionLanguage), [questionLanguage]);
  const moduleLabelsByKey = useMemo(
    () => Object.fromEntries(dashboardModules.map((module) => [module.key, module.label])),
    [dashboardModules]
  );
  const sidebarHighlight = useMemo(() => pickSidebarHighlight(questionLanguage), [questionLanguage]);

  const profileInfo = useMemo(() => {
    if (!profile) {
      return ui.profileNotLoaded;
    }
    return `${profile.firstName} ${profile.lastName} | ${profile.familyName || ui.family}`;
  }, [profile, ui]);

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

  const quickStats = useMemo(() => ([
    { key: "answers", label: ui.answersCount, value: ownAnswers.length },
    { key: "moments", label: ui.momentsCount, value: ownMoments.length },
    { key: "timeline", label: ui.timelineCount, value: filteredTimeline.length }
  ]), [ui, ownAnswers.length, ownMoments.length, filteredTimeline.length]);

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
    return date.toLocaleString(questionLanguage === "en" ? "en-US" : "bg-BG", {
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
    setEmotions([]);
    setTogetherActivities([]);
    setTimeline([]);
    setPdfPreview(null);
    if (pdfPreviewUrl) {
      window.URL.revokeObjectURL(pdfPreviewUrl);
    }
    setPdfPreviewUrl("");
    setTodayQuestion(null);
    setAnswerForm(initialAnswer);
    setMomentForm(initialMoment);
    setEmotionForm(initialEmotion);
    setTogetherForm(initialTogether);
    setPrivacyRequestForm(initialPrivacyRequest);
    setPrivacyRequests([]);
    setPdfForm(initialPdf);
    setUploadFile(null);
    setSelectedTimelineMemberId("all");
    setSelectedTimelineType("all");
    setTimelineDateFrom("");
    setTimelineDateTo("");
  }

  useEffect(() => {
    setApiLanguage(questionLanguage);
  }, [questionLanguage]);

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
        setAuthInfo(ui.inviteOpened);
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
        setAuthInfo(ui.sessionRestored);
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
    setAuthInfo(ui.sessionExpired);
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

  async function loadEmotions(profileValue = profile) {
    if (!profileValue?.familyId) {
      return [];
    }
    const result = await listEmotions(profileValue.familyId);
    setEmotions(result);
    return result;
  }

  async function loadTogetherActivities(profileValue = profile) {
    if (!profileValue?.familyId) {
      return [];
    }
    const result = await listTogetherActivities(profileValue.familyId);
    setTogetherActivities(result);
    return result;
  }

  async function loadPrivacyRequestsData() {
    const result = await listMyPrivacyRequests();
    setPrivacyRequests(Array.isArray(result) ? result : []);
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

  async function loadTodayQuestionData(language = questionLanguage) {
    const result = await getTodayQuestion(language);
    setTodayQuestion(result);
    return result;
  }

  async function selectQuestionLanguage(nextLanguage) {
    if (nextLanguage === questionLanguage) {
      return;
    }
    setQuestionLanguage(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(QUESTION_LANG_KEY, nextLanguage);
    }
    if (!isLogged) {
      return;
    }
    await withBusy(async () => {
      await loadTodayQuestionData(nextLanguage);
    });
  }

  async function refreshDashboardData() {
    const profileResult = await loadProfile();
    if (!profileResult?.familyId) {
      return;
    }

    await Promise.all([
      loadFamilyData(profileResult),
      loadMoments(profileResult),
      loadEmotions(profileResult),
      loadTogetherActivities(profileResult),
      loadAnswers(profileResult),
      loadTimeline(profileResult),
      loadTodayQuestionData(),
      loadPrivacyRequestsData()
    ]);
  }

  async function submitLogin(event) {
    event.preventDefault();
    await withBusy(async () => {
      const result = await login(loginForm);
      setAuth(result);
      setAuthState(result);
      setAuthInfo(ui.loginSuccess);
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
      setAuthInfo(ui.registerSuccess);
      await refreshDashboardData();
      show(result);
    });
  }

  async function submitInvite(event) {
    event.preventDefault();
    await withBusy(async () => {
      if (!profile?.familyId) {
        throw new Error(ui.profileNotLoaded);
      }

      const response = await sendFamilyInvitation(Number(profile.familyId), {
        email: inviteForm.email.trim(),
        role: inviteForm.role
      });
      setInviteForm(initialInvite);
      show(response);
      if (response?.deliveryStatus === "SENT") {
        setAuthInfo(ui.inviteSent);
      } else {
        const statusLabel = localizeInviteStatus(response?.deliveryStatus, questionLanguage, ui);
        setAuthInfo(`${ui.emailNotSentPrefix} (${statusLabel}). ${response?.inviteLink || "-"}`);
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
    setAuthInfo(ui.loggedOutInfo);
    show(ui.loggedOutOutput);
  }

  async function onRefreshProfile() {
    await withBusy(async () => {
      await refreshDashboardData();
      show(ui.profileUpdated);
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
          throw new Error(ui.profileNotLoaded);
      }
      if (!todayQuestion?.id) {
          throw new Error(ui.loadQuestionFirst);
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
          throw new Error(ui.profileNotLoaded);
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

  async function submitEmotion(event) {
    event.preventDefault();
    await withBusy(async () => {
      if (!profile?.familyId) {
        throw new Error(ui.profileNotLoaded);
      }

      const result = await createEmotion({
        familyId: Number(profile.familyId),
        emotionType: emotionForm.emotionType,
        happenedNote: emotionForm.happenedNote,
        helpedNote: emotionForm.helpedNote,
        needsNote: emotionForm.needsNote,
        wantToTalk: emotionForm.wantToTalk
      });

      setEmotionForm(initialEmotion);
      await Promise.all([loadEmotions(), loadTimeline()]);
      show(result);
    }, { authSensitive: true });
  }

  async function submitTogetherActivity(event) {
    event.preventDefault();
    await withBusy(async () => {
      if (!profile?.familyId) {
        throw new Error(ui.profileNotLoaded);
      }

      const result = await createTogetherActivity({
        familyId: Number(profile.familyId),
        title: togetherForm.title,
        category: togetherForm.category,
        description: togetherForm.description,
        durationMinutes: Number(togetherForm.durationMinutes) || null
      });

      setTogetherForm(initialTogether);
      await Promise.all([loadTogetherActivities(), loadTimeline()]);
      show(result);
    }, { authSensitive: true });
  }

  async function submitPrivacyRequest(event) {
    event.preventDefault();
    await withBusy(async () => {
      const result = await createPrivacyRequest(privacyRequestForm);
      setPrivacyRequestForm(initialPrivacyRequest);
      setAuthInfo(ui.privacyRequestSent);
      await loadPrivacyRequestsData();
      show(result);
    }, { authSensitive: true });
  }

  async function downloadPrivacyExport() {
    await withBusy(async () => {
      const result = await exportMyPrivacyData();
      const content = JSON.stringify(result, null, 2);
      const blob = new Blob([content], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nasheto-vreme-privacy-export.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setAuthInfo(ui.privacyExportReady);
      show(result);
    }, { authSensitive: true });
  }

  async function submitPdfPreview(event) {
    event.preventDefault();
    await withBusy(async () => {
      if (!profile?.familyId) {
          throw new Error(ui.profileNotLoaded);
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
          throw new Error(ui.profileNotLoaded);
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
      show(ui.pdfDownloaded);
    }, { authSensitive: true });
  }

  async function onUploadProfilePhoto() {
    await withBusy(async () => {
      if (!profileUploadFile) {
        throw new Error(ui.chooseProfilePhoto);
      }
      const updatedProfile = await uploadProfileImage(profileUploadFile);
      setProfile(updatedProfile);
      setProfileUploadFile(null);
      show(ui.profilePhotoUpdated);
    }, { authSensitive: true });
  }

  function renderActiveModule() {
    if (activeModule === "profile") {
      return (
        <section className="card">
          <h3>{moduleLabelsByKey.profile}</h3>
          <p className="small-muted module-note">{ui.profileHint}</p>
          {profile?.profileImageUrl ? (
            <ProfileImagePreview filePath={profile.profileImageUrl} language={questionLanguage} />
          ) : (
            <p className="small-muted">{ui.noProfilePhoto}</p>
          )}
          <div className="upload-inline profile-upload-inline">
            <input
              id="profileImageInput"
              className="file-input-hidden"
              type="file"
              accept="image/*"
              onChange={(event) => setProfileUploadFile(event.target.files?.[0] || null)}
            />
            <label htmlFor="profileImageInput" className="file-trigger">{ui.pickProfilePhoto}</label>
            {profileUploadFile ? <span className="attached-file">{profileUploadFile.name}</span> : null}
            <button type="button" onClick={onUploadProfilePhoto} disabled={!profileUploadFile || busy}>{ui.upload}</button>
          </div>
          <div className="info-grid" id="profileCard">
            <InfoItem label={ui.user} value={profile ? `${profile.firstName} ${profile.lastName}` : "-"} />
            <InfoItem label={ui.email} value={profile?.email || "-"} />
            <InfoItem label={ui.family} value={profile?.familyName || family?.name || "-"} />
            <InfoItem label={ui.status} value={auth?.accessToken ? ui.activeSession : ui.inactiveSession} />
          </div>
          <div className="cardhead compact">
            <h3>{ui.privacyCenter}</h3>
          </div>
          <div className="actions">
            <button type="button" className="secondary" onClick={downloadPrivacyExport}>{ui.privacyExport}</button>
          </div>
          <form className="grid2" onSubmit={submitPrivacyRequest}>
            <label className="select-filter">
              {ui.privacyRequestType}
              <select name="requestType" value={privacyRequestForm.requestType} onChange={updateForm(setPrivacyRequestForm)}>
                <option value="EXPORT_DATA">{ui.privacyExport}</option>
                <option value="DELETE_DATA">{ui.privacyDelete}</option>
              </select>
            </label>
            <input
              name="note"
              type="text"
              placeholder={ui.privacyRequestNote}
              value={privacyRequestForm.note}
              onChange={updateForm(setPrivacyRequestForm)}
            />
            <button type="submit">{ui.submitPrivacyRequest}</button>
          </form>
          <div className="cardhead compact">
            <h3>{ui.privacyRequests}</h3>
          </div>
          <div className="list">
            {privacyRequests.length === 0 ? <p className="small-muted">{ui.noPrivacyRequests}</p> : privacyRequests.map((request) => (
              <article className="list-item" key={request.id}>
                <h4>{request.requestType}</h4>
                <p>{request.note || "-"}</p>
                <div className="list-meta">{request.status} | {formatDate(request.createdAt)}</div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (activeModule === "family") {
      return (
        <section className="card">
          <div className="cardhead">
            <h3>{moduleLabelsByKey.family}</h3>
          </div>
          <div className="info-grid" id="familyCard">
            <InfoItem label={ui.family} value={family?.name || "-"} />
            <InfoItem label={ui.createdBy} value={resolveCreatedByName(family?.createdBy)} />
            <InfoItem label={ui.createdOn} value={formatDate(family?.createdAt)} />
          </div>
          <div className="list" id="membersList">
            {familyMembersWithLogged.length === 0 ? <p className="small-muted">{ui.noDataYet}</p> : familyMembersWithLogged.map((member) => (
              <article className="list-item" key={member.id || `${member.email}-${member.role}`}>
                <h4>{member.firstName} {member.lastName}</h4>
                <div className="list-meta">{localizeRole(member.role, questionLanguage)} | {member.email}</div>
              </article>
            ))}
          </div>
          {canInviteMembers ? (
            <form className="grid2" id="inviteForm" onSubmit={submitInvite}>
              <input
                name="email"
                type="email"
                placeholder={ui.inviteEmailPlaceholder}
                value={inviteForm.email}
                onChange={updateForm(setInviteForm)}
                required
              />
              <label className="select-filter">
                {ui.role}
                <select name="role" value={inviteForm.role} onChange={updateForm(setInviteForm)}>
                  <option value="PARENT">{ui.parent}</option>
                  <option value="CHILD">{ui.child}</option>
                </select>
              </label>
              <button type="submit">{ui.sendInvite}</button>
            </form>
          ) : (
            <p className="small-muted">{ui.parentOnlyInvite}</p>
          )}
        </section>
      );
    }

    if (activeModule === "question") {
      return (
        <section className="card">
          <div className="cardhead">
            <h3>{moduleLabelsByKey.question}</h3>
          </div>
          <p className="question-box" id="todayQuestionText">
            {todayQuestion ? todayQuestion.title : ui.questionLoading}
          </p>
          <form className="grid2" id="answerForm" onSubmit={submitAnswer}>
            <input name="answerText" type="text" placeholder={ui.yourAnswer} value={answerForm.answerText} onChange={updateForm(setAnswerForm)} required />
            <button type="submit">{ui.sendAnswer}</button>
          </form>
          <div className="cardhead compact">
            <h3>{ui.myAnswers}</h3>
          </div>
          <div className="list" id="answersList">
            {ownAnswers.length === 0 ? <p className="small-muted">{ui.noAnswersYet}</p> : ownAnswers.map((answer) => (
              <article className="list-item" key={answer.id || `${answer.authorName}-${answer.createdAt}`}>
                <h4>{answer.questionTitle}</h4>
                <p>{answer.answerText}</p>
                <div className="list-meta">{answer.authorName || ui.memberFallback} | {formatDate(answer.createdAt)}</div>
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
            <h3>{moduleLabelsByKey.moments}</h3>
          </div>
          <form className="grid2" id="createMomentForm" onSubmit={submitMoment}>
            <input name="title" type="text" placeholder={ui.titlePlaceholder} value={momentForm.title} onChange={updateForm(setMomentForm)} required />
            <input name="description" type="text" placeholder={ui.descriptionPlaceholder} value={momentForm.description} onChange={updateForm(setMomentForm)} />
            <div className="upload-inline" id="uploadForm">
              <input
                id="uploadFileInput"
                className="file-input-hidden"
                name="file"
                type="file"
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
              />
              <label htmlFor="uploadFileInput" className="file-trigger">{ui.pickFile}</label>
              {uploadFile ? <span className="attached-file">{ui.attached} {uploadFile.name}</span> : null}
              <button type="submit">{ui.addMoment}</button>
            </div>
          </form>
          <span id="uploadResult" className="hidden" aria-hidden="true"></span>
          <div className="list" id="momentsList">
            {ownMoments.length === 0 ? <p className="small-muted">{ui.noMomentsYet}</p> : ownMoments.map((moment) => (
              <article className="list-item" key={moment.id || `${moment.title}-${moment.createdAt}`}>
                <h4>{moment.title}</h4>
                {moment.imageUrl ? <AttachmentPreview filePath={moment.imageUrl} language={questionLanguage} /> : null}
                <p>{moment.description || ui.noDescription}</p>
                <div className="list-meta">{moment.authorName || ui.memberFallback} | {formatDate(moment.createdAt)}</div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (activeModule === "emotions") {
      const emotionOptions = [
        { value: "HAPPY", label: ui.emotionHappy },
        { value: "SAD", label: ui.emotionSad },
        { value: "ANGRY", label: ui.emotionAngry },
        { value: "FEAR", label: ui.emotionFear },
        { value: "CALM", label: ui.emotionCalm },
        { value: "EXCITED", label: ui.emotionExcited }
      ];

      return (
        <section className="card">
          <div className="cardhead">
            <h3>{moduleLabelsByKey.emotions}</h3>
          </div>
          <form className="grid2" onSubmit={submitEmotion}>
            <label className="select-filter">
              {ui.emotionType}
              <select name="emotionType" value={emotionForm.emotionType} onChange={updateForm(setEmotionForm)}>
                {emotionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="check-filter">
              <input name="wantToTalk" type="checkbox" checked={emotionForm.wantToTalk} onChange={updateForm(setEmotionForm)} /> {ui.wantToTalk}
            </label>
            <input
              name="happenedNote"
              type="text"
              placeholder={ui.happenedNote}
              value={emotionForm.happenedNote}
              onChange={updateForm(setEmotionForm)}
            />
            <input
              name="helpedNote"
              type="text"
              placeholder={ui.helpedNote}
              value={emotionForm.helpedNote}
              onChange={updateForm(setEmotionForm)}
            />
            <input
              name="needsNote"
              type="text"
              placeholder={ui.needsNote}
              value={emotionForm.needsNote}
              onChange={updateForm(setEmotionForm)}
            />
            <button type="submit">{ui.saveEmotion}</button>
          </form>
          <div className="list">
            {emotions.length === 0 ? <p className="small-muted">{ui.noEmotionsYet}</p> : emotions.map((item) => (
              <article className="list-item" key={item.id || `${item.authorId}-${item.createdAt}`}>
                <h4>{item.emotionType}</h4>
                <p>{item.happenedNote || item.helpedNote || item.needsNote || ui.noDetails}</p>
                <div className="list-meta">{item.authorName || ui.memberFallback} | {formatDate(item.createdAt)}</div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (activeModule === "together") {
      return (
        <section className="card">
          <div className="cardhead">
            <h3>{moduleLabelsByKey.together}</h3>
          </div>
          <form className="grid2" onSubmit={submitTogetherActivity}>
            <input
              name="title"
              type="text"
              placeholder={ui.togetherTitlePlaceholder}
              value={togetherForm.title}
              onChange={updateForm(setTogetherForm)}
              required
            />
            <input
              name="category"
              type="text"
              placeholder={ui.togetherCategoryPlaceholder}
              value={togetherForm.category}
              onChange={updateForm(setTogetherForm)}
            />
            <input
              name="description"
              type="text"
              placeholder={ui.descriptionPlaceholder}
              value={togetherForm.description}
              onChange={updateForm(setTogetherForm)}
            />
            <input
              name="durationMinutes"
              type="number"
              min="1"
              max="720"
              placeholder={ui.durationMinutes}
              value={togetherForm.durationMinutes}
              onChange={updateForm(setTogetherForm)}
            />
            <button type="submit">{ui.saveTogetherActivity}</button>
          </form>
          <div className="list">
            {togetherActivities.length === 0 ? <p className="small-muted">{ui.noTogetherActivitiesYet}</p> : togetherActivities.map((item) => (
              <article className="list-item" key={item.id || `${item.authorId}-${item.createdAt}`}>
                <h4>{item.title}</h4>
                <p>{item.description || ui.noDescription}</p>
                <div className="list-meta">
                  {(item.category || "-")} | {(item.durationMinutes || 0)} min | {item.authorName || ui.memberFallback} | {formatDate(item.createdAt)}
                </div>
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
            <h3>{moduleLabelsByKey.timeline}</h3>
          </div>
          <div className="timeline-filters" id="timelineFilters">
            <button
              className={selectedTimelineType === "all" ? "timeline-filter-chip active" : "timeline-filter-chip"}
              type="button"
              onClick={() => setSelectedTimelineType("all")}
            >
              {ui.allTypes}
            </button>
            <button
              className={selectedTimelineType === "question" ? "timeline-filter-chip active" : "timeline-filter-chip"}
              type="button"
              onClick={() => setSelectedTimelineType("question")}
            >
              {ui.questions}
            </button>
            <button
              className={selectedTimelineType === "moment" ? "timeline-filter-chip active" : "timeline-filter-chip"}
              type="button"
              onClick={() => setSelectedTimelineType("moment")}
            >
              {ui.moments}
            </button>
          </div>
          <div className="timeline-filters timeline-date-filters">
            <label className="timeline-date-input">
              {ui.from}
              <input type="date" value={timelineDateFrom} onChange={(event) => setTimelineDateFrom(event.target.value)} />
            </label>
            <label className="timeline-date-input">
              {ui.to}
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
              {ui.clearDates}
            </button>
          </div>
          <div className="timeline-filters">
            <button
              className={selectedTimelineMemberId === "all" ? "timeline-filter-chip active" : "timeline-filter-chip"}
              type="button"
              onClick={() => setSelectedTimelineMemberId("all")}
            >
              {ui.all}
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
                  {resolveMemberName(member, questionLanguage)}
                </button>
              );
            })}
          </div>
          <div className="list" id="timelineList">
            {filteredTimeline.length === 0 ? <p className="small-muted">{ui.noTimelineForMember}</p> : filteredTimeline.map((item) => (
              <article className="list-item" key={item.id || `${item.type}-${item.createdAt}-${item.title}`}>
                <h4>{localizeTimelineType(item.type, questionLanguage)} | {item.title}</h4>
                {item.imageUrl ? <AttachmentPreview filePath={item.imageUrl} language={questionLanguage} /> : null}
                <p>{item.details || ui.noDetails}</p>
                <div className="list-meta">{item.author || ui.memberFallback} | {formatDate(item.createdAt)}</div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className="card">
        <h3>{`${moduleLabelsByKey.pdf} (${ui.preview.toLowerCase()})`}</h3>
        <form className="grid2" id="pdfExportForm" onSubmit={submitPdfPreview}>
          <label className="select-filter">
            {ui.period}
            <select name="period" value={pdfForm.period} onChange={updateForm(setPdfForm)}>
              <option value="monthly">{ui.currentMonth}</option>
              <option value="yearly">{ui.currentYear}</option>
              <option value="custom">{ui.customRange}</option>
            </select>
          </label>
          <label className="select-filter">
            {ui.style}
            <select name="style" value={pdfForm.style} onChange={updateForm(setPdfForm)}>
              <option value="family-story">{ui.familyStory}</option>
              <option value="timeline">{ui.chronological}</option>
              <option value="highlights">{ui.highlights}</option>
            </select>
          </label>
          <label className="check-filter">
            <input name="includeMoments" type="checkbox" checked={pdfForm.includeMoments} onChange={updateForm(setPdfForm)} /> {ui.includeMoments}
          </label>
          <label className="check-filter">
            <input name="includeAnswers" type="checkbox" checked={pdfForm.includeAnswers} onChange={updateForm(setPdfForm)} /> {ui.includeAnswers}
          </label>
          {!pdfPreviewUrl ? <button type="submit">{ui.preview}</button> : null}
        </form>
        {pdfPreviewUrl ? (
          <button id="downloadPdfBtn" type="button" onClick={onDownloadPdf}>{ui.download}</button>
        ) : (
          <p className="small-muted">{ui.downloadHint}</p>
        )}
        {pdfPreviewUrl ? (
          <div className="info-grid" id="pdfPreviewCard">
            <InfoItem label={ui.status} value={localizePdfStatus(pdfPreview?.status, questionLanguage, ui)} />
            <InfoItem label={ui.period} value={localizePdfPeriod(pdfPreview?.period, questionLanguage)} />
            <InfoItem label={ui.style} value={localizePdfStyle(pdfPreview?.style, questionLanguage)} />
            <InfoItem label={ui.moments} value={pdfPreview?.includedMoments ?? "-"} />
            <InfoItem label={ui.myAnswers} value={pdfPreview?.includedAnswers ?? "-"} />
          </div>
        ) : null}
        {pdfPreviewUrl ? (
          <iframe
            title={ui.filePreviewTitle}
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
            <p className="small-muted">{ui.bootstrapping}</p>
          </div>
        </section>
      ) : null}
      {!bootstrapping && !isLogged ? (
        <section className="auth-screen" id="authScreen">
          <div className="auth-card">
            <div className="auth-language-row">
              <button
                type="button"
                className="language-toggle-btn"
                id="appLanguageToggleAuth"
                onClick={() => selectQuestionLanguage(nextLanguage)}
              >
                {languageToggleLabel}
              </button>
            </div>
            <div className="auth-header">
              <h1>{ui.appName}</h1>
              <p className="small-muted">{ui.appSubtitle}</p>
            </div>

            {tab === "login" ? (
              <form className="auth-form" id="loginForm" onSubmit={submitLogin}>
                <input name="email" type="email" placeholder={ui.email} value={loginForm.email} onChange={updateForm(setLoginForm)} required />
                <input name="password" type="password" placeholder={ui.password} value={loginForm.password} onChange={updateForm(setLoginForm)} required />
                <button disabled={busy} type="submit">{busy ? ui.loading : ui.loginTab}</button>
                <button type="button" className="auth-switch-link" onClick={() => setTab("register")}>
                  {ui.noAccountRegister}
                </button>
              </form>
            ) : (
              <form className="auth-form" id="registerForm" onSubmit={submitRegister}>
                <input name="email" type="email" placeholder={ui.email} value={registerForm.email} onChange={updateForm(setRegisterForm)} required />
                <input name="password" type="password" placeholder={ui.password} value={registerForm.password} onChange={updateForm(setRegisterForm)} required />
                <input name="firstName" type="text" placeholder={ui.firstName} value={registerForm.firstName} onChange={updateForm(setRegisterForm)} required />
                <input name="lastName" type="text" placeholder={ui.lastName} value={registerForm.lastName} onChange={updateForm(setRegisterForm)} required />
                {!registerForm.inviteToken?.trim() ? (
                  <input
                    name="familyName"
                    type="text"
                    placeholder={ui.familyName}
                    value={registerForm.familyName}
                    onChange={updateForm(setRegisterForm)}
                    required
                  />
                ) : null}
                <button disabled={busy} type="submit">{busy ? ui.loading : ui.createProfile}</button>
                <button type="button" className="auth-switch-link" onClick={() => setTab("login")}>
                  {ui.haveAccountLogin}
                </button>
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
                <div className="brand-mark app-logo" aria-label={ui.appName}></div>
                <p className="brand-side-title">{ui.appName}</p>
              </div>
              <button id="logoutBtn" className="secondary logout-btn" type="button" onClick={logout}>{ui.logout}</button>
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

            <section className="sidebar-card pulse-card">
              <h3>{ui.familyPulse}</h3>
              <p className="small-muted pulse-subtitle">{ui.quickStats}</p>
              <div className="pulse-stats">
                {quickStats.map((item) => (
                  <article key={item.key} className="pulse-stat-item">
                    <b>{item.value}</b>
                    <span>{item.label}</span>
                  </article>
                ))}
              </div>
              <p className="pulse-tip-title">{ui.pulseTipTitle}</p>
              <p className="pulse-tip-text">{ui.pulseTip}</p>
            </section>
          </aside>

          <main className="main-content">
            <div className="topbar">
              <h2>{dashboardModules.find((module) => module.key === activeModule)?.label || ui.welcome}</h2>
              <div className="topbar-meta">
                <div className="row app-language-switch" id="questionLanguageSwitch">
                  <button
                    type="button"
                    className="language-toggle-btn"
                    id="appLanguageToggle"
                    onClick={() => selectQuestionLanguage(nextLanguage)}
                  >
                    {languageToggleLabel}
                  </button>
                </div>
                <p className="small-muted">{profileInfo}</p>
              </div>
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

function AttachmentPreview({ filePath, language = "bg" }) {
  const labels = language === "en"
    ? { view: "View", download: "Download", close: "Close", previewTitle: "File preview", previewAlt: "Preview" }
    : { view: "Виж", download: "Свали", close: "Затвори", previewTitle: "Преглед на файл", previewAlt: "Преглед" };
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
          <button className="timeline-link-button" type="button" onClick={() => setIsPreviewOpen(true)}>{labels.view}</button>
          <a className="timeline-download-link" href={fileHref} download={downloadName}>{labels.download}</a>
        </div>
        {isPreviewOpen ? (
          <div className="attachment-modal-backdrop" onClick={() => setIsPreviewOpen(false)} role="presentation">
            <div className="attachment-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
              <button className="attachment-modal-close" type="button" onClick={() => setIsPreviewOpen(false)}>{labels.close}</button>
              {isImage ? (
                <img className="attachment-modal-image" src={fileHref} alt={labels.previewAlt} />
              ) : (
                <iframe className="attachment-modal-frame" src={fileHref} title={labels.previewTitle} />
              )}
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return null;
}

function ProfileImagePreview({ filePath, language = "bg" }) {
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

  return <img className="profile-image-preview" src={imageSrc} alt={language === "en" ? "Profile photo" : "Профилна снимка"} />;
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

function resolveMemberName(member, language = "bg") {
  return `${member?.firstName || ""} ${member?.lastName || ""}`.trim() || member?.email || (language === "en" ? "Member" : "Член");
}

function localizeRole(role, language = "bg") {
  if (role === "PARENT") {
    return language === "en" ? "Parent" : "Родител";
  }
  if (role === "CHILD") {
    return language === "en" ? "Child" : "Дете";
  }
  if (role === "MEMBER") {
    return language === "en" ? "Member" : "Член";
  }
  return role || "-";
}

function localizeInviteStatus(status, language = "bg", ui = {}) {
  if (status === "SENT") {
    return language === "en" ? "Sent" : "Изпратен";
  }
  if (status === "FAILED") {
    return language === "en" ? "Failed" : "Неуспешен";
  }
  return status || ui.unknownStatus || ui.unknown || "-";
}

function localizePdfStatus(status, language = "bg", ui = {}) {
  if (!status) {
    return "-";
  }
  if (status === "READY") {
    return language === "en" ? "Ready" : "Готов";
  }
  if (status === "PROCESSING") {
    return language === "en" ? "Processing" : "Обработва се";
  }
  if (status === "FAILED") {
    return language === "en" ? "Failed" : "Неуспешен";
  }
  return status || ui.unknownStatus || ui.unknown || "-";
}

function localizePdfPeriod(period, language = "bg") {
  if (!period) {
    return "-";
  }
  if (period === "monthly") {
    return language === "en" ? "Current month" : "Текущ месец";
  }
  if (period === "yearly") {
    return language === "en" ? "Current year" : "Текуща година";
  }
  if (period === "custom") {
    return language === "en" ? "Custom range" : "Персонален избор";
  }
  return period;
}

function localizePdfStyle(style, language = "bg") {
  if (!style) {
    return "-";
  }
  if (style === "family-story") {
    return language === "en" ? "Family story" : "Семейна история";
  }
  if (style === "timeline") {
    return language === "en" ? "Chronological" : "Хронологичен";
  }
  if (style === "highlights") {
    return language === "en" ? "Highlights" : "Акценти";
  }
  return style;
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}


