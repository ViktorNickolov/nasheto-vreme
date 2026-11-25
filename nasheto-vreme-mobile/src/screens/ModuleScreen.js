import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput, Switch, Linking, Platform, ScrollView, Image } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { getSessionUser } from "../auth/session";
import {
  answerTodayQuestionMobile,
  createEmotionMobile,
  createMomentMobile,
  createPdfPreviewMobile,
  createPrivacyRequestMobile,
  createTogetherActivityMobile,
  downloadPdfMobile,
  downloadUploadedFileMobile,
  exportMyPrivacyDataMobile,
  getFamilyAnswersMobile,
  getFamilyMembersMobile,
  getFamilyMobile,
  getProfileMobile,
  getTimelineMobile,
  getTodayQuestionMobile,
  listEmotionsMobile,
  listMyPrivacyRequestsMobile,
  listMomentsMobile,
  listTogetherActivitiesMobile,
  sendFamilyInvitationMobile,
  uploadProfileImageMobile,
  uploadFamilyFileMobile
} from "../api/http";
import { useAppLanguage } from "../config/language";
import { localizeTimelineType } from "../i18n/timelineTypeLabels";

const initialPdfForm = {
  period: "monthly",
  style: "family-story",
  includeMoments: true,
  includeAnswers: true
};

export default function ModuleScreen({ route }) {
  const { appLanguage } = useAppLanguage();
  const moduleKey = route?.params?.moduleKey || "profile";
  const sessionUser = getSessionUser();

  const [profile, setProfile] = useState(sessionUser);
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [todayQuestion, setTodayQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [moments, setMoments] = useState([]);
  const [emotions, setEmotions] = useState([]);
  const [togetherActivities, setTogetherActivities] = useState([]);
  const [privacyRequests, setPrivacyRequests] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const [answerText, setAnswerText] = useState("");
  const [momentTitle, setMomentTitle] = useState("");
  const [momentDescription, setMomentDescription] = useState("");
  const [pickedFile, setPickedFile] = useState(null);
  const [emotionType, setEmotionType] = useState("HAPPY");
  const [emotionHappened, setEmotionHappened] = useState("");
  const [emotionHelped, setEmotionHelped] = useState("");
  const [emotionNeeds, setEmotionNeeds] = useState("");
  const [emotionWantToTalk, setEmotionWantToTalk] = useState(false);
  const [togetherTitle, setTogetherTitle] = useState("");
  const [togetherCategory, setTogetherCategory] = useState("");
  const [togetherDescription, setTogetherDescription] = useState("");
  const [togetherDuration, setTogetherDuration] = useState("15");
  const [privacyRequestType, setPrivacyRequestType] = useState("EXPORT_DATA");
  const [privacyRequestNote, setPrivacyRequestNote] = useState("");
  const [selectedTimelineMemberId, setSelectedTimelineMemberId] = useState("all");
  const [selectedTimelineType, setSelectedTimelineType] = useState("all");
  const [timelineDateFrom, setTimelineDateFrom] = useState("");
  const [timelineDateTo, setTimelineDateTo] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("CHILD");
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profileImageUri, setProfileImageUri] = useState("");

  const [pdfForm, setPdfForm] = useState(initialPdfForm);
  const [pdfPreview, setPdfPreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const canInviteMembers = profile?.role === "PARENT";
  const questionLanguage = appLanguage === "en" ? "en" : "bg";
  const moduleTitles = questionLanguage === "en"
    ? {
        profile: "My profile",
        family: "Your family",
        question: "Question of the day",
        moments: "Family moments",
        emotions: "Our emotions",
        together: "Time together",
        timeline: "Family timeline",
        pdf: "Family PDF book"
      }
    : {
        profile: "Моят профил",
        family: "Вашето семейство",
        question: "Въпрос на деня",
        moments: "Семейни моменти",
        emotions: "Нашите емоции",
        together: "Време заедно",
        timeline: "Семейна хроника",
        pdf: "Семейна PDF книга"
      };
  const text = questionLanguage === "en"
    ? {
        loadFailed: "Failed to load data.",
        answerSent: "Answer submitted successfully.",
        answerFailed: "Failed to submit answer.",
        fileSelected: "Selected file",
        profilePhotoSelected: "Selected profile photo",
        profilePhotoUpdated: "Profile photo updated.",
        profilePhotoUploadFailed: "Profile photo upload failed.",
        momentAdded: "Moment added successfully.",
        momentCreateFailed: "Failed to create moment.",
        inviteSent: "Invite sent successfully.",
        inviteSendFailed: "Failed to send invite.",
        emailNotSent: "Email was not sent",
        fileSaved: "File saved",
        fileOpenFailed: "Failed to open file.",
        pdfPreviewGenerated: "PDF preview generated.",
        pdfPreviewFailed: "Failed to generate PDF preview.",
        pdfSaved: "PDF file saved",
        pdfReady: "PDF is ready to share/download.",
        pdfDownloadFailed: "Failed to download PDF.",
        view: "View",
        download: "Download",
        noProfilePhoto: "No profile photo.",
        chooseProfilePhoto: "Choose profile photo",
        uploading: "Uploading...",
        uploadPhoto: "Upload photo",
        user: "User",
        email: "Email",
        family: "Family",
        name: "Name",
        members: "Members",
        inviteEmail: "Invite email",
        parent: "Parent",
        child: "Child",
        sending: "Sending...",
        sendInvite: "Send invite",
        parentOnlyInvite: "Only a parent can send invites.",
        loading: "Loading...",
        noQuestion: "No question available today.",
        yourAnswer: "Your answer",
        sendAnswer: "Send answer",
        questionFallback: "Question",
        noAnswers: "You have no answers yet.",
        title: "Title",
        description: "Description",
        attachFile: "Attach file",
        adding: "Adding...",
        addMoment: "Add moment",
        noDescription: "No description",
        noMoments: "You have no moments yet.",
        allTypes: "All types",
        questions: "Questions",
        moments: "Moments",
        dateFrom: "From (YYYY-MM-DD)",
        dateTo: "To (YYYY-MM-DD)",
        clearDates: "Clear dates",
        all: "All",
        noDetails: "No details",
        noTimeline: "No records for selected member.",
        includeMoments: "Include moments",
        includeAnswers: "Include answers",
        generatePreview: "Generate preview",
        downloadPdf: "Download PDF",
        status: "Status",
        period: "Period",
        style: "Style",
        memberFallback: "Member"
        ,emotionType: "Emotion"
        ,happenedNote: "What happened?"
        ,helpedNote: "What helped you?"
        ,needsNote: "What do you need?"
        ,wantToTalk: "Would you like to talk?"
        ,saveEmotion: "Save emotion"
        ,noEmotions: "No shared emotions yet."
        ,togetherTitle: "Activity idea"
        ,togetherCategory: "Category"
        ,togetherDuration: "Duration (minutes)"
        ,saveTogether: "Save activity"
        ,noTogether: "No activities yet."
        ,privacyCenter: "Privacy and data"
        ,privacyRequestType: "Request type"
        ,privacyRequestNote: "Note (optional)"
        ,submitPrivacyRequest: "Submit request"
        ,privacyExport: "Export my data"
        ,privacyRequests: "My requests"
        ,noPrivacyRequests: "No requests yet."
      }
    : {
        loadFailed: "Неуспешно зареждане на данните.",
        answerSent: "Отговорът е изпратен успешно.",
        answerFailed: "Неуспешно изпращане на отговора.",
        fileSelected: "Избран файл",
        profilePhotoSelected: "Избрана профилна снимка",
        profilePhotoUpdated: "Профилната снимка е обновена.",
        profilePhotoUploadFailed: "Неуспешно качване на профилна снимка.",
        momentAdded: "Моментът е добавен успешно.",
        momentCreateFailed: "Неуспешно създаване на момент.",
        inviteSent: "Поканата е изпратена успешно.",
        inviteSendFailed: "Неуспешно изпращане на поканата.",
        emailNotSent: "Имейлът не е изпратен",
        fileSaved: "Файлът е запазен",
        fileOpenFailed: "Неуспешно отваряне на файла.",
        pdfPreviewGenerated: "PDF прегледът е генериран.",
        pdfPreviewFailed: "Неуспешно генериране на PDF преглед.",
        pdfSaved: "PDF файлът е запазен",
        pdfReady: "PDF файлът е готов за споделяне/сваляне.",
        pdfDownloadFailed: "Неуспешно изтегляне на PDF.",
        view: "Виж",
        download: "Свали",
        noProfilePhoto: "Няма профилна снимка.",
        chooseProfilePhoto: "Избери профилна снимка",
        uploading: "Качване...",
        uploadPhoto: "Качи снимка",
        user: "Потребител",
        email: "Имейл",
        family: "Семейство",
        name: "Име",
        members: "Членове",
        inviteEmail: "Email за покана",
        parent: "Родител",
        child: "Дете",
        sending: "Изпращане...",
        sendInvite: "Изпрати покана",
        parentOnlyInvite: "Само родител може да изпраща покани.",
        loading: "Зареждане...",
        noQuestion: "Няма наличен въпрос за деня.",
        yourAnswer: "Вашият отговор",
        sendAnswer: "Изпрати отговор",
        questionFallback: "Въпрос",
        noAnswers: "Все още нямате отговори.",
        title: "Заглавие",
        description: "Описание",
        attachFile: "Прикачи файл",
        adding: "Добавяне...",
        addMoment: "Добави момент",
        noDescription: "Няма описание",
        noMoments: "Все още нямате добавени моменти.",
        allTypes: "Всички типове",
        questions: "Въпроси",
        moments: "Моменти",
        dateFrom: "От (YYYY-MM-DD)",
        dateTo: "До (YYYY-MM-DD)",
        clearDates: "Изчисти дати",
        all: "Всички",
        noDetails: "Няма подробности",
        noTimeline: "Няма записи за избрания член.",
        includeMoments: "Включи моменти",
        includeAnswers: "Включи отговори",
        generatePreview: "Генерирай преглед",
        downloadPdf: "Свали PDF",
        status: "Статус",
        period: "Период",
        style: "Стил",
        memberFallback: "Член"
        ,emotionType: "Емоция"
        ,happenedNote: "Какво се случи?"
        ,helpedNote: "Какво ти помогна?"
        ,needsNote: "От какво имаш нужда?"
        ,wantToTalk: "Искаш ли да поговорим?"
        ,saveEmotion: "Запази емоция"
        ,noEmotions: "Все още няма споделени емоции."
        ,togetherTitle: "Идея за дейност"
        ,togetherCategory: "Категория"
        ,togetherDuration: "Продължителност (минути)"
        ,saveTogether: "Запази дейност"
        ,noTogether: "Все още няма дейности."
        ,privacyCenter: "Поверителност и данни"
        ,privacyRequestType: "Тип заявка"
        ,privacyRequestNote: "Бележка (по желание)"
        ,submitPrivacyRequest: "Изпрати заявка"
        ,privacyExport: "Експорт на моите данни"
        ,privacyRequests: "Моите заявки"
        ,noPrivacyRequests: "Няма изпратени заявки."
      };

  const familyId = useMemo(() => profile?.familyId, [profile]);
  const filteredAnswers = useMemo(() => {
    if (!profile) {
      return [];
    }
    return answers.filter((answer) => isOwnAnswer(answer, profile));
  }, [answers, profile]);
  const filteredMoments = useMemo(() => {
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

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const loadedProfile = await getProfileMobile();
        if (!mounted) {
          return;
        }
        setProfile(loadedProfile);

        if (loadedProfile?.familyId) {
          const [loadedFamily, loadedMembers, loadedQuestion, loadedAnswers, loadedMoments, loadedEmotions, loadedTogether, loadedPrivacyRequests, loadedTimeline] = await Promise.all([
            getFamilyMobile(loadedProfile.familyId),
            getFamilyMembersMobile(loadedProfile.familyId),
            getTodayQuestionMobile(questionLanguage),
            getFamilyAnswersMobile(loadedProfile.familyId),
            listMomentsMobile(loadedProfile.familyId),
            listEmotionsMobile(loadedProfile.familyId),
            listTogetherActivitiesMobile(loadedProfile.familyId),
            listMyPrivacyRequestsMobile(),
            getTimelineMobile(loadedProfile.familyId)
          ]);

          if (!mounted) {
            return;
          }

          setFamily(loadedFamily);
          setMembers(Array.isArray(loadedMembers) ? loadedMembers : []);
          setTodayQuestion(loadedQuestion);
          setAnswers(Array.isArray(loadedAnswers) ? loadedAnswers : []);
          setMoments(Array.isArray(loadedMoments) ? loadedMoments : []);
          setEmotions(Array.isArray(loadedEmotions) ? loadedEmotions : []);
          setTogetherActivities(Array.isArray(loadedTogether) ? loadedTogether : []);
          setPrivacyRequests(Array.isArray(loadedPrivacyRequests) ? loadedPrivacyRequests : []);
          setTimeline(Array.isArray(loadedTimeline) ? loadedTimeline : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || text.loadFailed);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [questionLanguage]);

  useEffect(() => {
    let active = true;

    async function loadProfileImage() {
      if (!profile?.profileImageUrl) {
        if (active) {
          setProfileImageUri("");
        }
        return;
      }

      try {
        const file = await downloadUploadedFileMobile(profile.profileImageUrl);
        if (!active) {
          return;
        }
        const ext = extractExtension(extractFileNameFromDisposition(file.disposition) || "profile.jpg") || ".jpg";
        const target = `${FileSystem.cacheDirectory}profile-${Date.now()}${ext}`;
        await writeBinaryToFile(target, file.bytes);
        if (active) {
          setProfileImageUri(target);
        }
      } catch {
        if (active) {
          setProfileImageUri("");
        }
      }
    }

    loadProfileImage();

    return () => {
      active = false;
    };
  }, [profile?.profileImageUrl]);

  async function onSubmitAnswer() {
    if (!todayQuestion?.id || !familyId || !answerText.trim()) {
      return;
    }

    setBusy(true);
    setError("");
    setInfo("");
    try {
      await answerTodayQuestionMobile(todayQuestion.id, {
        familyId,
        answerText: answerText.trim()
      });

      const [nextAnswers, nextTimeline] = await Promise.all([
        getFamilyAnswersMobile(familyId),
        getTimelineMobile(familyId)
      ]);
      setAnswers(Array.isArray(nextAnswers) ? nextAnswers : []);
      setTimeline(Array.isArray(nextTimeline) ? nextTimeline : []);
      setAnswerText("");
      setInfo(text.answerSent);
    } catch (err) {
      setError(err.message || text.answerFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onPickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: false
    });

    if (!result.canceled && result.assets?.length > 0) {
      setPickedFile(result.assets[0]);
      setInfo(`${text.fileSelected}: ${result.assets[0].name}`);
    }
  }

  async function onPickProfilePhoto() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "image/*",
      copyToCacheDirectory: true,
      multiple: false
    });

    if (!result.canceled && result.assets?.length > 0) {
      setProfilePhotoFile(result.assets[0]);
      setInfo(`${text.profilePhotoSelected}: ${result.assets[0].name}`);
    }
  }

  async function onUploadProfilePhoto() {
    if (!profilePhotoFile) {
      return;
    }

    setBusy(true);
    setError("");
    setInfo("");
    try {
      const updatedProfile = await uploadProfileImageMobile(profilePhotoFile);
      setProfile(updatedProfile);
      setProfilePhotoFile(null);
      setInfo(text.profilePhotoUpdated);
    } catch (err) {
      setError(err.message || text.profilePhotoUploadFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onCreateMoment() {
    if (!familyId || !momentTitle.trim()) {
      return;
    }

    setBusy(true);
    setError("");
    setInfo("");
    try {
      let imageUrl = "";
      if (pickedFile) {
        const upload = await uploadFamilyFileMobile(familyId, pickedFile);
        imageUrl = decorateAttachmentPath(upload?.relativePath || "", pickedFile?.name || "");
      }

      await createMomentMobile({
        familyId,
        title: momentTitle.trim(),
        description: momentDescription.trim(),
        imageUrl
      });

      const [nextMoments, nextTimeline] = await Promise.all([
        listMomentsMobile(familyId),
        getTimelineMobile(familyId)
      ]);

      setMoments(Array.isArray(nextMoments) ? nextMoments : []);
      setTimeline(Array.isArray(nextTimeline) ? nextTimeline : []);
      setMomentTitle("");
      setMomentDescription("");
      setPickedFile(null);
      setInfo(text.momentAdded);
    } catch (err) {
      setError(err.message || text.momentCreateFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onCreateEmotion() {
    if (!familyId) {
      return;
    }

    setBusy(true);
    setError("");
    setInfo("");
    try {
      await createEmotionMobile({
        familyId,
        emotionType,
        happenedNote: emotionHappened,
        helpedNote: emotionHelped,
        needsNote: emotionNeeds,
        wantToTalk: emotionWantToTalk
      });
      const [nextEmotions, nextTimeline] = await Promise.all([
        listEmotionsMobile(familyId),
        getTimelineMobile(familyId)
      ]);
      setEmotions(Array.isArray(nextEmotions) ? nextEmotions : []);
      setTimeline(Array.isArray(nextTimeline) ? nextTimeline : []);
      setEmotionType("HAPPY");
      setEmotionHappened("");
      setEmotionHelped("");
      setEmotionNeeds("");
      setEmotionWantToTalk(false);
    } catch (err) {
      setError(err.message || text.loadFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onCreateTogetherActivity() {
    if (!familyId || !togetherTitle.trim()) {
      return;
    }

    setBusy(true);
    setError("");
    setInfo("");
    try {
      await createTogetherActivityMobile({
        familyId,
        title: togetherTitle.trim(),
        category: togetherCategory.trim(),
        description: togetherDescription.trim(),
        durationMinutes: Number(togetherDuration) || null
      });
      const [nextActivities, nextTimeline] = await Promise.all([
        listTogetherActivitiesMobile(familyId),
        getTimelineMobile(familyId)
      ]);
      setTogetherActivities(Array.isArray(nextActivities) ? nextActivities : []);
      setTimeline(Array.isArray(nextTimeline) ? nextTimeline : []);
      setTogetherTitle("");
      setTogetherCategory("");
      setTogetherDescription("");
      setTogetherDuration("15");
    } catch (err) {
      setError(err.message || text.loadFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitPrivacyRequest() {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await createPrivacyRequestMobile({ requestType: privacyRequestType, note: privacyRequestNote });
      const requests = await listMyPrivacyRequestsMobile();
      setPrivacyRequests(Array.isArray(requests) ? requests : []);
      setPrivacyRequestType("EXPORT_DATA");
      setPrivacyRequestNote("");
    } catch (err) {
      setError(err.message || text.loadFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onExportPrivacyData() {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const payload = await exportMyPrivacyDataMobile();
      setInfo(JSON.stringify(payload));
    } catch (err) {
      setError(err.message || text.loadFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onSendInvite() {
    if (!canInviteMembers) {
      return;
    }

    if (!familyId || !inviteEmail.trim()) {
      return;
    }

    setBusy(true);
    setError("");
    setInfo("");
    try {
      const response = await sendFamilyInvitationMobile(familyId, {
        email: inviteEmail.trim(),
        role: inviteRole
      });
      setInviteEmail("");
      setInviteRole("CHILD");
      if (response?.deliveryStatus === "SENT") {
        setInfo(text.inviteSent);
      } else {
        const statusLabel = localizeInviteStatus(response?.deliveryStatus, questionLanguage);
        const linkLabel = questionLanguage === "en" ? "Link" : "Линк";
        setInfo(`${text.emailNotSent} (${statusLabel}). ${linkLabel}: ${response?.inviteLink || "-"}`);
      }
    } catch (err) {
      setError(err.message || text.inviteSendFailed);
    } finally {
      setBusy(false);
    }
  }

  async function openAttachment(relativePath, mode, preferredName = "") {
    try {
      const file = await downloadUploadedFileMobile(relativePath);
      const serverName = extractFileNameFromDisposition(file.disposition) || "attachment.bin";
      const ext = extractExtension(serverName);
      const fallbackName = preferredName ? `${sanitizeFileName(preferredName)}${ext}` : "";
      const name = file.suggestedName || fallbackName || serverName;
      const target = `${FileSystem.cacheDirectory}${Date.now()}-${name}`;
      await writeBinaryToFile(target, file.bytes);

      if (mode === "download") {
        if (Platform.OS === "android") {
          const saved = await saveFileToAndroidFolder(name, file.contentType, file.bytes);
          if (saved) {
            setInfo(`${text.fileSaved}: ${name}`);
          }
        } else if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(target);
        } else {
          const safeUri = await toSafeOpenUri(target);
          await Linking.openURL(safeUri);
        }
      } else if (Platform.OS === "android") {
        const contentUri = await FileSystem.getContentUriAsync(target);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          type: file.contentType || "application/octet-stream",
          flags: 1
        });
      } else {
        const safeUri = await toSafeOpenUri(target);
        await Linking.openURL(safeUri);
      }
    } catch (err) {
      setError(err.message || text.fileOpenFailed);
    }
  }

  async function onCreatePdfPreview() {
    if (!familyId) {
      return;
    }

    setBusy(true);
    setError("");
    setInfo("");
    try {
      const preview = await createPdfPreviewMobile({
        familyId,
        period: pdfForm.period,
        style: pdfForm.style,
        includeMoments: pdfForm.includeMoments,
        includeAnswers: pdfForm.includeAnswers
      });
      setPdfPreview(preview);
      setInfo(text.pdfPreviewGenerated);
    } catch (err) {
      setError(err.message || text.pdfPreviewFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onDownloadPdf() {
    if (!familyId) {
      return;
    }

    setBusy(true);
    setError("");
    setInfo("");
    try {
      const file = await downloadPdfMobile({
        familyId,
        period: pdfForm.period,
        style: pdfForm.style,
        includeMoments: pdfForm.includeMoments,
        includeAnswers: pdfForm.includeAnswers
      });

      const name = extractFileNameFromDisposition(file.disposition) || "nasheto-vreme.pdf";
      const target = `${FileSystem.cacheDirectory}${Date.now()}-${name}`;
      await writeBinaryToFile(target, file.bytes);

      if (Platform.OS === "android") {
        const saved = await saveFileToAndroidFolder(name, "application/pdf", file.bytes);
        if (saved) {
          setInfo(`${text.pdfSaved}: ${name}`);
        }
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(target);
        setInfo(text.pdfReady);
      } else {
        const safeUri = await toSafeOpenUri(target);
        await Linking.openURL(safeUri);
        setInfo(text.pdfReady);
      }
    } catch (err) {
      setError(err.message || text.pdfDownloadFailed);
    } finally {
      setBusy(false);
    }
  }

  function renderAttachmentActions(path, preferredName = "") {
    if (!path) {
      return null;
    }
    return (
      <View style={styles.fileActionsRow}>
        <Pressable onPress={() => openAttachment(path, "view", preferredName)}>
          <Text style={styles.fileAction}>{text.view}</Text>
        </Pressable>
        <Pressable onPress={() => openAttachment(path, "download", preferredName)}>
          <Text style={styles.fileAction}>{text.download}</Text>
        </Pressable>
      </View>
    );
  }

  if (moduleKey === "profile") {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{moduleTitles.profile}</Text>
        {profileImageUri ? <Image source={{ uri: profileImageUri }} style={styles.profileImage} /> : null}
        {!profileImageUri ? <Text style={styles.emptyText}>{text.noProfilePhoto}</Text> : null}
        <View style={styles.fileActionsRow}>
          <Pressable onPress={onPickProfilePhoto}>
            <Text style={styles.fileAction}>{text.chooseProfilePhoto}</Text>
          </Pressable>
          {profilePhotoFile ? <Text style={styles.itemMeta} numberOfLines={1}>{profilePhotoFile.name}</Text> : null}
        </View>
        <Pressable
          style={[styles.primaryBtn, (busy || !profilePhotoFile) && styles.disabled]}
          onPress={onUploadProfilePhoto}
          disabled={busy || !profilePhotoFile}
        >
          <Text style={styles.primaryBtnText}>{busy ? text.uploading : text.uploadPhoto}</Text>
        </Pressable>
        <Text style={styles.rowText}>{text.user}: {profile ? `${profile.firstName} ${profile.lastName}` : "-"}</Text>
        <Text style={styles.rowText}>{text.email}: {profile?.email || "-"}</Text>
        <Text style={styles.rowText}>{text.family}: {profile?.familyName || family?.name || "-"}</Text>

        <Text style={styles.cardTitle}>{text.privacyCenter}</Text>
        <View style={styles.fileActionsRow}>
          <Pressable onPress={onExportPrivacyData}>
            <Text style={styles.fileAction}>{text.privacyExport}</Text>
          </Pressable>
        </View>
        <View style={styles.timelineFilters}>
          <Pressable
            style={[styles.filterChip, privacyRequestType === "EXPORT_DATA" && styles.filterChipActive]}
            onPress={() => setPrivacyRequestType("EXPORT_DATA")}
          >
            <Text style={[styles.filterChipText, privacyRequestType === "EXPORT_DATA" && styles.filterChipTextActive]}>{text.privacyExport}</Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, privacyRequestType === "DELETE_DATA" && styles.filterChipActive]}
            onPress={() => setPrivacyRequestType("DELETE_DATA")}
          >
            <Text style={[styles.filterChipText, privacyRequestType === "DELETE_DATA" && styles.filterChipTextActive]}>{questionLanguage === "en" ? "Delete data" : "Изтриване на данни"}</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.input}
          placeholder={text.privacyRequestNote}
          value={privacyRequestNote}
          onChangeText={setPrivacyRequestNote}
          multiline
        />
        <Pressable style={[styles.primaryBtn, busy && styles.disabled]} onPress={onSubmitPrivacyRequest} disabled={busy}>
          <Text style={styles.primaryBtnText}>{text.submitPrivacyRequest}</Text>
        </Pressable>
        <Text style={styles.itemTitle}>{text.privacyRequests}</Text>
        {privacyRequests.length === 0 ? <Text style={styles.emptyText}>{text.noPrivacyRequests}</Text> : null}
        {privacyRequests.slice(0, 3).map((request) => (
          <View key={request.id || `${request.requestType}-${request.createdAt}`} style={styles.item}>
            <Text style={styles.itemTitle}>{request.requestType}</Text>
            <Text style={styles.rowText}>{request.note || "-"}</Text>
            <Text style={styles.itemMeta}>{request.status} | {formatDate(request.createdAt, questionLanguage)}</Text>
          </View>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
      </View>
    );
  }

  if (moduleKey === "family") {
    return (
      <ScrollView style={styles.card} contentContainerStyle={styles.cardScrollContent}>
        <Text style={styles.cardTitle}>{moduleTitles.family}</Text>
        <Text style={styles.rowText}>{text.name}: {family?.name || "-"}</Text>
        <Text style={styles.rowText}>{text.members}: {members.length}</Text>

        {canInviteMembers ? (
          <>
            <TextInput
              style={styles.input}
              placeholder={text.inviteEmail}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
            />
            <View style={styles.timelineFilters}>
              <Pressable
                style={[styles.filterChip, inviteRole === "PARENT" && styles.filterChipActive]}
                onPress={() => setInviteRole("PARENT")}
              >
                <Text style={[styles.filterChipText, inviteRole === "PARENT" && styles.filterChipTextActive]}>{text.parent}</Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, inviteRole === "CHILD" && styles.filterChipActive]}
                onPress={() => setInviteRole("CHILD")}
              >
                <Text style={[styles.filterChipText, inviteRole === "CHILD" && styles.filterChipTextActive]}>{text.child}</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.primaryBtn, (busy || !inviteEmail.trim()) && styles.disabled]}
              onPress={onSendInvite}
              disabled={busy || !inviteEmail.trim()}
            >
              <Text style={styles.primaryBtnText}>{busy ? text.sending : text.sendInvite}</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.emptyText}>{text.parentOnlyInvite}</Text>
        )}

        {familyMembersWithLogged.map((member) => (
          <View key={member.id || `${member.email}-${member.role}`} style={styles.item}>
            <Text style={styles.itemTitle}>{member.firstName} {member.lastName}</Text>
            <Text style={styles.itemMeta}>{localizeRole(member.role, questionLanguage)} | {member.email}</Text>
          </View>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
      </ScrollView>
    );
  }

  if (moduleKey === "question") {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{moduleTitles.question}</Text>
        <Text style={styles.questionText}>{loading ? text.loading : todayQuestion?.title || text.noQuestion}</Text>
        <TextInput
          style={styles.input}
          placeholder={text.yourAnswer}
          value={answerText}
          onChangeText={setAnswerText}
          multiline
        />
        <Pressable
          style={[styles.primaryBtn, (busy || !todayQuestion?.id || !familyId) && styles.disabled]}
          onPress={onSubmitAnswer}
          disabled={busy || !todayQuestion?.id || !familyId}
        >
          <Text style={styles.primaryBtnText}>{busy ? text.sending : text.sendAnswer}</Text>
        </Pressable>

        {filteredAnswers.slice(0, 4).map((answer) => (
          <View key={answer.id || `${answer.authorName}-${answer.createdAt}`} style={styles.item}>
            <Text style={styles.itemTitle}>{answer.questionTitle || text.questionFallback}</Text>
            <Text style={styles.rowText} numberOfLines={2}>{answer.answerText}</Text>
            <Text style={styles.itemMeta}>{answer.authorName || text.memberFallback} | {formatDate(answer.createdAt, questionLanguage)}</Text>
          </View>
        ))}
        {filteredAnswers.length === 0 ? <Text style={styles.emptyText}>{text.noAnswers}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
      </View>
    );
  }

  if (moduleKey === "moments") {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{moduleTitles.moments}</Text>
        <TextInput
          style={styles.input}
          placeholder={text.title}
          value={momentTitle}
          onChangeText={setMomentTitle}
        />
        <TextInput
          style={styles.input}
          placeholder={text.description}
          value={momentDescription}
          onChangeText={setMomentDescription}
          multiline
        />

        <View style={styles.fileActionsRow}>
          <Pressable onPress={onPickFile}>
            <Text style={styles.fileAction}>{text.attachFile}</Text>
          </Pressable>
          {pickedFile ? <Text style={styles.itemMeta} numberOfLines={1}>{pickedFile.name}</Text> : null}
        </View>

        <Pressable
          style={[styles.primaryBtn, (busy || !familyId || !momentTitle.trim()) && styles.disabled]}
          onPress={onCreateMoment}
          disabled={busy || !familyId || !momentTitle.trim()}
        >
          <Text style={styles.primaryBtnText}>{busy ? text.adding : text.addMoment}</Text>
        </Pressable>

        {filteredMoments.slice(0, 4).map((moment) => (
          <View key={moment.id || `${moment.title}-${moment.createdAt}`} style={styles.item}>
            <Text style={styles.itemTitle}>{moment.title}</Text>
            <Text style={styles.rowText} numberOfLines={2}>{moment.description || text.noDescription}</Text>
            {renderAttachmentActions(moment.imageUrl, moment.title)}
            <Text style={styles.itemMeta}>{moment.authorName || text.memberFallback} | {formatDate(moment.createdAt, questionLanguage)}</Text>
          </View>
        ))}
        {filteredMoments.length === 0 ? <Text style={styles.emptyText}>{text.noMoments}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
      </View>
    );
  }

  if (moduleKey === "emotions") {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{moduleTitles.emotions}</Text>
        <View style={styles.timelineFilters}>
          {[
            ["HAPPY", questionLanguage === "en" ? "Happy" : "Радост"],
            ["SAD", questionLanguage === "en" ? "Sad" : "Тъга"],
            ["ANGRY", questionLanguage === "en" ? "Angry" : "Гняв"],
            ["FEAR", questionLanguage === "en" ? "Fear" : "Страх"],
            ["CALM", questionLanguage === "en" ? "Calm" : "Спокойствие"],
            ["EXCITED", questionLanguage === "en" ? "Excited" : "Вълнение"]
          ].map(([value, label]) => (
            <Pressable
              key={value}
              style={[styles.filterChip, emotionType === value && styles.filterChipActive]}
              onPress={() => setEmotionType(value)}
            >
              <Text style={[styles.filterChipText, emotionType === value && styles.filterChipTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput style={styles.input} placeholder={text.happenedNote} value={emotionHappened} onChangeText={setEmotionHappened} multiline />
        <TextInput style={styles.input} placeholder={text.helpedNote} value={emotionHelped} onChangeText={setEmotionHelped} multiline />
        <TextInput style={styles.input} placeholder={text.needsNote} value={emotionNeeds} onChangeText={setEmotionNeeds} multiline />
        <View style={styles.switchRow}>
          <Text style={styles.rowText}>{text.wantToTalk}</Text>
          <Switch value={emotionWantToTalk} onValueChange={setEmotionWantToTalk} />
        </View>
        <Pressable style={[styles.primaryBtn, busy && styles.disabled]} onPress={onCreateEmotion} disabled={busy || !familyId}>
          <Text style={styles.primaryBtnText}>{text.saveEmotion}</Text>
        </Pressable>
        {emotions.length === 0 ? <Text style={styles.emptyText}>{text.noEmotions}</Text> : null}
        {emotions.slice(0, 4).map((item) => (
          <View key={item.id || `${item.authorId}-${item.createdAt}`} style={styles.item}>
            <Text style={styles.itemTitle}>{item.emotionType}</Text>
            <Text style={styles.rowText} numberOfLines={2}>{item.happenedNote || item.helpedNote || item.needsNote || text.noDetails}</Text>
            <Text style={styles.itemMeta}>{item.authorName || text.memberFallback} | {formatDate(item.createdAt, questionLanguage)}</Text>
          </View>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
      </View>
    );
  }

  if (moduleKey === "together") {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{moduleTitles.together}</Text>
        <TextInput style={styles.input} placeholder={text.togetherTitle} value={togetherTitle} onChangeText={setTogetherTitle} />
        <TextInput style={styles.input} placeholder={text.togetherCategory} value={togetherCategory} onChangeText={setTogetherCategory} />
        <TextInput style={styles.input} placeholder={text.description} value={togetherDescription} onChangeText={setTogetherDescription} multiline />
        <TextInput
          style={styles.input}
          placeholder={text.togetherDuration}
          value={togetherDuration}
          onChangeText={setTogetherDuration}
          keyboardType="numeric"
        />
        <Pressable style={[styles.primaryBtn, (busy || !familyId || !togetherTitle.trim()) && styles.disabled]} onPress={onCreateTogetherActivity} disabled={busy || !familyId || !togetherTitle.trim()}>
          <Text style={styles.primaryBtnText}>{text.saveTogether}</Text>
        </Pressable>
        {togetherActivities.length === 0 ? <Text style={styles.emptyText}>{text.noTogether}</Text> : null}
        {togetherActivities.slice(0, 4).map((item) => (
          <View key={item.id || `${item.authorId}-${item.createdAt}`} style={styles.item}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.rowText} numberOfLines={2}>{item.description || text.noDescription}</Text>
            <Text style={styles.itemMeta}>{item.category || "-"} | {item.durationMinutes || 0} min | {item.authorName || text.memberFallback}</Text>
          </View>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
      </View>
    );
  }

  if (moduleKey === "timeline") {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{moduleTitles.timeline}</Text>
        <View style={styles.timelineFilters}>
          <Pressable
            style={[styles.filterChip, selectedTimelineType === "all" && styles.filterChipActive]}
            onPress={() => setSelectedTimelineType("all")}
          >
            <Text style={[styles.filterChipText, selectedTimelineType === "all" && styles.filterChipTextActive]}>{text.allTypes}</Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, selectedTimelineType === "question" && styles.filterChipActive]}
            onPress={() => setSelectedTimelineType("question")}
          >
            <Text style={[styles.filterChipText, selectedTimelineType === "question" && styles.filterChipTextActive]}>{text.questions}</Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, selectedTimelineType === "moment" && styles.filterChipActive]}
            onPress={() => setSelectedTimelineType("moment")}
          >
            <Text style={[styles.filterChipText, selectedTimelineType === "moment" && styles.filterChipTextActive]}>{text.moments}</Text>
          </Pressable>
        </View>
        <View style={styles.timelineDateRow}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder={text.dateFrom}
            value={timelineDateFrom}
            onChangeText={setTimelineDateFrom}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder={text.dateTo}
            value={timelineDateTo}
            onChangeText={setTimelineDateTo}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.clearDateBtn} onPress={() => {
            setTimelineDateFrom("");
            setTimelineDateTo("");
          }}>
            <Text style={styles.clearDateText}>{text.clearDates}</Text>
          </Pressable>
        </View>
        <View style={styles.timelineFilters}>
          <Pressable
            style={[styles.filterChip, selectedTimelineMemberId === "all" && styles.filterChipActive]}
            onPress={() => setSelectedTimelineMemberId("all")}
          >
            <Text style={[styles.filterChipText, selectedTimelineMemberId === "all" && styles.filterChipTextActive]}>{text.all}</Text>
          </Pressable>
          {members.map((member) => {
            const memberId = String(member.userId);
            const isActive = selectedTimelineMemberId === memberId;
            return (
              <Pressable
                key={member.id || memberId}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedTimelineMemberId(memberId)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{resolveMemberName(member, questionLanguage)}</Text>
              </Pressable>
            );
          })}
        </View>
        {filteredTimeline.map((item) => (
          <View key={item.sourceId || `${item.type}-${item.createdAt}`} style={styles.item}>
            <Text style={styles.itemTitle}>{localizeTimelineType(item.type, questionLanguage)} | {item.title}</Text>
            <Text style={styles.rowText} numberOfLines={2}>{item.details || text.noDetails}</Text>
            {renderAttachmentActions(item.imageUrl, item.title)}
            <Text style={styles.itemMeta}>{item.author || text.memberFallback} | {formatDate(item.createdAt, questionLanguage)}</Text>
          </View>
        ))}
        {filteredTimeline.length === 0 ? <Text style={styles.emptyText}>{text.noTimeline}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{moduleTitles.pdf}</Text>

      <View style={styles.switchRow}>
        <Text style={styles.rowText}>{text.includeMoments}</Text>
        <Switch
          value={pdfForm.includeMoments}
          onValueChange={(value) => setPdfForm((prev) => ({ ...prev, includeMoments: value }))}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.rowText}>{text.includeAnswers}</Text>
        <Switch
          value={pdfForm.includeAnswers}
          onValueChange={(value) => setPdfForm((prev) => ({ ...prev, includeAnswers: value }))}
        />
      </View>

      <Pressable style={[styles.primaryBtn, busy && styles.disabled]} onPress={onCreatePdfPreview} disabled={busy || !familyId}>
        <Text style={styles.primaryBtnText}>{text.generatePreview}</Text>
      </Pressable>
      <Pressable style={[styles.secondaryBtnInline, busy && styles.disabled]} onPress={onDownloadPdf} disabled={busy || !familyId}>
        <Text style={styles.secondaryBtnText}>{text.downloadPdf}</Text>
      </Pressable>

      <Text style={styles.rowText}>{text.status}: {localizePdfStatus(pdfPreview?.status, questionLanguage)}</Text>
      <Text style={styles.rowText}>{text.period}: {localizePdfPeriod(pdfPreview?.period || pdfForm.period, questionLanguage)}</Text>
      <Text style={styles.rowText}>{text.style}: {localizePdfStyle(pdfPreview?.style || pdfForm.style, questionLanguage)}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
    </View>
  );
}

function formatDate(value, language = "bg") {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(language === "en" ? "en-US" : "bg-BG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function extractFileNameFromDisposition(disposition) {
  if (!disposition) {
    return "";
  }
  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] || "";
}

function decorateAttachmentPath(relativePath, originalName) {
  if (!relativePath || !originalName) {
    return relativePath;
  }
  const separator = relativePath.includes("?") ? "&" : "?";
  return `${relativePath}${separator}orig=${encodeURIComponent(originalName)}`;
}

function sanitizeFileName(value) {
  return String(value || "attachment")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "attachment";
}

function extractExtension(fileName) {
  const match = String(fileName || "").match(/(\.[a-zA-Z0-9]{1,10})$/);
  return match ? match[1] : "";
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
    if (!Number.isNaN(start.getTime()) && itemDate < start) {
      return false;
    }
  }

  if (toDate) {
    const end = new Date(`${toDate}T23:59:59.999`);
    if (!Number.isNaN(end.getTime()) && itemDate > end) {
      return false;
    }
  }

  return true;
}

function resolveMemberName(member, language = "bg") {
  return `${member?.firstName || ""} ${member?.lastName || ""}`.trim() || member?.email || (language === "en" ? "Member" : "Член");
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
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

function localizeInviteStatus(status, language = "bg") {
  if (status === "SENT") {
    return language === "en" ? "Sent" : "Изпратен";
  }
  if (status === "FAILED") {
    return language === "en" ? "Failed" : "Неуспешен";
  }
  return status || (language === "en" ? "Unknown" : "Неизвестен");
}

function localizePdfStatus(status, language = "bg") {
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
  return status;
}

function localizePdfPeriod(period, language = "bg") {
  if (period === "monthly") {
    return language === "en" ? "Current month" : "Текущ месец";
  }
  if (period === "yearly") {
    return language === "en" ? "Current year" : "Текуща година";
  }
  if (period === "custom") {
    return language === "en" ? "Custom range" : "Персонален избор";
  }
  return period || "-";
}

function localizePdfStyle(style, language = "bg") {
  if (style === "family-story") {
    return language === "en" ? "Family story" : "Семейна история";
  }
  if (style === "timeline") {
    return language === "en" ? "Chronological" : "Хронологичен";
  }
  if (style === "highlights") {
    return language === "en" ? "Highlights" : "Акценти";
  }
  return style || "-";
}


async function writeBinaryToFile(path, arrayBuffer) {
  const base64 = arrayBufferToBase64(arrayBuffer);
  await FileSystem.writeAsStringAsync(path, base64, { encoding: "base64" });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return global.btoa(binary);
}

async function saveFileToAndroidFolder(fileName, mimeType, bytes) {
  const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    return false;
  }

  const targetUri = await FileSystem.StorageAccessFramework.createFileAsync(
    permissions.directoryUri,
    fileName || `file-${Date.now()}`,
    mimeType || "application/octet-stream"
  );

  await writeBinaryToSafUri(targetUri, bytes);
  return true;
}

async function writeBinaryToSafUri(uri, arrayBuffer) {
  const base64 = arrayBufferToBase64(arrayBuffer);
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: "base64" });
}

async function toSafeOpenUri(fileUri) {
  if (Platform.OS !== "android") {
    return fileUri;
  }
  try {
    return await FileSystem.getContentUriAsync(fileUri);
  } catch {
    return fileUri;
  }
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fffcf7",
    borderWidth: 1,
    borderColor: "#e2d8cb",
    borderRadius: 18,
    padding: 12,
    paddingTop: 12,
    gap: 10,
    margin: 12,
    shadowColor: "#4f473f",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  cardScrollContent: {
    gap: 10,
    paddingBottom: 8
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#5a4b3f"
  },
  rowText: {
    color: "#6f6256",
    fontSize: 13
  },
  questionText: {
    color: "#6f6256",
    lineHeight: 19,
    fontSize: 13
  },
  input: {
    backgroundColor: "#fbf7f1",
    borderWidth: 1,
    borderColor: "#e1d8cb",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 46,
    textAlignVertical: "top",
    fontSize: 13
  },
  primaryBtn: {
    backgroundColor: "#6f8469",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#607659"
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700"
  },
  secondaryBtnInline: {
    backgroundColor: "#e6ddcf",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d3c4af"
  },
  disabled: {
    opacity: 0.5
  },
  item: {
    backgroundColor: "#f7f2e9",
    borderWidth: 1,
    borderColor: "#e4d8ca",
    borderRadius: 14,
    padding: 10,
    gap: 4
  },
  itemTitle: {
    fontWeight: "700",
    color: "#5a4b3f",
    fontSize: 13
  },
  itemMeta: {
    color: "#867868",
    fontSize: 11
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#d8cbba",
    backgroundColor: "#f3ecdf"
  },
  emptyText: {
    color: "#8b7c6f",
    fontStyle: "italic"
  },
  fileActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap"
  },
  fileAction: {
    color: "#587250",
    textDecorationLine: "underline",
    fontWeight: "700",
    fontSize: 12
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  timelineFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  timelineDateRow: {
    gap: 8
  },
  dateInput: {
    minHeight: 42
  },
  clearDateBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#d8cbba",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f3ecdf"
  },
  clearDateText: {
    color: "#6f6256",
    fontSize: 12,
    fontWeight: "600"
  },
  filterChip: {
    backgroundColor: "#f3ecdf",
    borderWidth: 1,
    borderColor: "#d8cbba",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  filterChipActive: {
    backgroundColor: "#6f8469",
    borderColor: "#607659"
  },
  filterChipText: {
    color: "#6f6256",
    fontSize: 12,
    fontWeight: "600"
  },
  filterChipTextActive: {
    color: "#fff"
  },
  error: {
    color: "#a54b45"
  },
  info: {
    color: "#3f7054"
  },
  secondaryBtnText: {
    color: "#65594e",
    fontWeight: "700"
  }
});

