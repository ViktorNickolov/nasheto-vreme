import {
  clearAuth,
  getAuth,
  getApiBaseUrl,
  getFamily,
  getFamilyAnswers,
  getFamilyMembers,
  getTimeline,
  createPdfPreview,
  downloadPdfBook,
  login,
  me,
  refreshToken,
  register,
  setApiBaseUrl,
  setAuth,
  getTodayQuestion,
  answerQuestion,
  createMoment,
  listMoments,
  uploadImage
} from "./api.js";

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");
const authInfo = document.getElementById("authInfo");

const output = document.getElementById("output");
const configInfo = document.getElementById("configInfo");
const apiBaseUrlInput = document.getElementById("apiBaseUrl");
const profileInfo = document.getElementById("profileInfo");
const profileCard = document.getElementById("profileCard");
const familyCard = document.getElementById("familyCard");
const membersList = document.getElementById("membersList");
const answersList = document.getElementById("answersList");
const momentsList = document.getElementById("momentsList");
const timelineList = document.getElementById("timelineList");
const pdfPreviewCard = document.getElementById("pdfPreviewCard");
const uploadResult = document.getElementById("uploadResult");
const todayQuestionText = document.getElementById("todayQuestionText");

const showLoginBtn = document.getElementById("showLoginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

let currentProfile = null;

function show(data) {
  output.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

function renderInfoGrid(container, items) {
  container.innerHTML = items
    .map((item) => `<div class="info-item"><b>${item.label}</b><span>${item.value ?? "-"}</span></div>`)
    .join("");
}

function renderList(container, rows, mapper) {
  if (!rows.length) {
    container.innerHTML = `<p class="small-muted">No items yet.</p>`;
    return;
  }
  container.innerHTML = rows.map(mapper).join("");
}

function bindForm(id, handler) {
  document.getElementById(id).addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target).entries());
    try {
      const result = await handler(values, event.target);
      show(result);
    } catch (error) {
      show({ error: error.message });
    }
  });
}

function setAuthTab(tab) {
  const isLogin = tab === "login";
  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);
  showLoginBtn.classList.toggle("active", isLogin);
  showRegisterBtn.classList.toggle("active", !isLogin);
}

function renderScreenByAuth() {
  const isLogged = Boolean(getAuth()?.accessToken);
  authScreen.classList.toggle("hidden", isLogged);
  appScreen.classList.toggle("hidden", !isLogged);
}

function updateFamilyInputs() {
  if (!currentProfile?.familyId) {
    return;
  }

  const selectors = [
    "#answerForm input[name='questionId']"
  ];

  selectors.forEach((selector) => {
    const input = document.querySelector(selector);
    if (input) {
      input.placeholder = input.name === "questionId" ? "Question ID (from card above)" : input.placeholder;
    }
  });
}

function setProfile(profile) {
  currentProfile = profile;
  if (!profile) {
    profileInfo.textContent = "Not loaded";
    return;
  }

  profileInfo.textContent = `${profile.firstName} ${profile.lastName} | family #${profile.familyId}`;
  renderInfoGrid(profileCard, [
    { label: "Name", value: `${profile.firstName} ${profile.lastName}` },
    { label: "Email", value: profile.email },
    { label: "Role", value: profile.role },
    { label: "Family ID", value: profile.familyId }
  ]);
  updateFamilyInputs();
}

async function loadProfile() {
  const profile = await me();
  setProfile(profile);
  return profile;
}

async function loadFamilyData() {
  if (!currentProfile?.familyId) {
    return;
  }

  const family = await getFamily(currentProfile.familyId);
  const members = await getFamilyMembers(currentProfile.familyId);

  renderInfoGrid(familyCard, [
    { label: "Family", value: family.name },
    { label: "Created by", value: family.createdBy },
    { label: "Created at", value: family.createdAt }
  ]);

  renderList(membersList, members, (member) => `
    <article class="list-item">
      <h4>${member.firstName} ${member.lastName}</h4>
      <div class="list-meta">${member.role} | ${member.email}</div>
    </article>
  `);
}

async function loadAnswers() {
  if (!currentProfile?.familyId) {
    return;
  }

  const answers = await getFamilyAnswers(currentProfile.familyId);
  renderList(answersList, answers, (answer) => `
    <article class="list-item">
      <h4>${answer.questionTitle}</h4>
      <p>${answer.answerText}</p>
      <div class="list-meta">by ${answer.authorName} | ${answer.createdAt}</div>
    </article>
  `);
}

async function loadMoments() {
  if (!currentProfile?.familyId) {
    return;
  }

  const moments = await listMoments(currentProfile.familyId);
  renderList(momentsList, moments, (moment) => `
    <article class="list-item">
      <h4>${moment.title}</h4>
      <p>${moment.description || "No description"}</p>
      <div class="list-meta">${moment.createdAt}</div>
    </article>
  `);
}

async function loadTimeline() {
  if (!currentProfile?.familyId) {
    return;
  }

  const items = await getTimeline(currentProfile.familyId, "ALL", 20);
  renderList(timelineList, items, (item) => `
    <article class="list-item">
      <h4>${item.type} | ${item.title}</h4>
      <p>${item.details || "No details"}</p>
      <div class="list-meta">${item.author || "Family"} | ${item.createdAt}</div>
    </article>
  `);
}

async function refreshDashboardData() {
  await loadProfile();
  await loadFamilyData();
  await loadMoments();
  await loadAnswers();
  await loadTimeline();
}

function handleAuthError(error) {
  clearAuth();
  setProfile(null);
  renderScreenByAuth();
  show({ error: error.message });
}

function renderConfigInfo() {
  const baseUrl = getApiBaseUrl();
  apiBaseUrlInput.value = baseUrl;
  configInfo.textContent = `Using backend: ${baseUrl}`;
}

bindForm("configForm", async (values) => {
  setApiBaseUrl(values.apiBaseUrl || "http://localhost:8088/api/v1");
  renderConfigInfo();
  return { saved: true };
});

bindForm("registerForm", async (values) => {
  const result = await register(values);
  setAuth(result);
  authInfo.textContent = "Registration successful. Dashboard loaded.";
  renderScreenByAuth();
  await refreshDashboardData();
  return result;
});

bindForm("loginForm", async (values) => {
  const result = await login(values);
  setAuth(result);
  authInfo.textContent = "Login successful.";
  renderScreenByAuth();
  await refreshDashboardData();
  return result;
});

bindForm("answerForm", async (values) => {
  if (!currentProfile?.familyId) {
    throw new Error("Profile is not loaded.");
  }
  return answerQuestion(Number(values.questionId), {
    familyId: Number(currentProfile.familyId),
    answerText: values.answerText
  });
});

bindForm("createMomentForm", async (values) => {
  if (!currentProfile?.familyId) {
    throw new Error("Profile is not loaded.");
  }
  return createMoment({
    familyId: Number(currentProfile.familyId),
    title: values.title,
    description: values.description,
    imageUrl: values.imageUrl
  });
});

bindForm("uploadForm", async (_, form) => {
  if (!currentProfile?.familyId) {
    throw new Error("Profile is not loaded.");
  }
  const fileInput = form.querySelector("input[name='file']");
  const file = fileInput.files[0];
  const result = await uploadImage(Number(currentProfile.familyId), file);
  uploadResult.textContent = `Uploaded: ${result.fileName}`;
  return result;
});

bindForm("pdfExportForm", async (values) => {
  if (!currentProfile?.familyId) {
    throw new Error("Profile is not loaded.");
  }

  const result = await createPdfPreview({
    familyId: Number(currentProfile.familyId),
    period: values.period,
    style: values.style,
    includeMoments: values.includeMoments === "on",
    includeAnswers: values.includeAnswers === "on"
  });

  renderInfoGrid(pdfPreviewCard, [
    { label: "Export ID", value: result.exportId },
    { label: "Status", value: result.status },
    { label: "Period", value: result.period },
    { label: "Style", value: result.style },
    { label: "Moments", value: result.includedMoments },
    { label: "Answers", value: result.includedAnswers }
  ]);

  return result;
});

document.getElementById("downloadPdfBtn").addEventListener("click", async () => {
  try {
    if (!currentProfile?.familyId) {
      throw new Error("Profile is not loaded.");
    }

    const periodInput = document.querySelector("#pdfExportForm input[name='period']");
    const styleInput = document.querySelector("#pdfExportForm input[name='style']");
    const includeMoments = document.querySelector("#pdfExportForm input[name='includeMoments']").checked;
    const includeAnswers = document.querySelector("#pdfExportForm input[name='includeAnswers']").checked;

    const result = await downloadPdfBook({
      familyId: Number(currentProfile.familyId),
      period: periodInput.value,
      style: styleInput.value,
      includeMoments,
      includeAnswers
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
  } catch (error) {
    handleAuthError(error);
  }
});

document.getElementById("meBtn").addEventListener("click", async () => {
  try {
    await refreshDashboardData();
    show("Profile and family data refreshed.");
  } catch (error) {
    handleAuthError(error);
  }
});

document.getElementById("refreshBtn").addEventListener("click", async () => {
  try {
    const result = await refreshToken();
    setAuth(result);
    await refreshDashboardData();
    show(result);
  } catch (error) {
    handleAuthError(error);
  }
});

document.getElementById("loadFamilyBtn").addEventListener("click", async () => {
  try {
    await loadFamilyData();
    show("Family data refreshed.");
  } catch (error) {
    handleAuthError(error);
  }
});

document.getElementById("loadAnswersBtn").addEventListener("click", async () => {
  try {
    await loadAnswers();
    show("Answers refreshed.");
  } catch (error) {
    handleAuthError(error);
  }
});

document.getElementById("listMomentsBtn").addEventListener("click", async () => {
  try {
    await loadMoments();
    show("Moments refreshed.");
  } catch (error) {
    handleAuthError(error);
  }
});

document.getElementById("loadTimelineBtn").addEventListener("click", async () => {
  try {
    await loadTimeline();
    show("Timeline refreshed.");
  } catch (error) {
    handleAuthError(error);
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearAuth();
  setProfile(null);
  renderScreenByAuth();
  setAuthTab("login");
  authInfo.textContent = "You are logged out.";
  show("Logged out");
});

document.getElementById("todayQuestionBtn").addEventListener("click", async () => {
  try {
    const question = await getTodayQuestion();
    todayQuestionText.textContent = `${question.id}. ${question.title}`;
    const questionIdInput = document.querySelector("#answerForm input[name='questionId']");
    if (questionIdInput) {
      questionIdInput.value = question.id;
    }
    show(question);
  } catch (error) {
    show({ error: error.message });
  }
});

renderConfigInfo();
setAuthTab("login");
renderScreenByAuth();

showLoginBtn.addEventListener("click", () => setAuthTab("login"));
showRegisterBtn.addEventListener("click", () => setAuthTab("register"));

if (getAuth()?.accessToken) {
  refreshDashboardData().catch(handleAuthError);
}


