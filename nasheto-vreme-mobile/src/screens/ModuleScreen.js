import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput, Switch, Linking, Platform, ScrollView, Image } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { getSessionUser } from "../auth/session";
import {
  answerTodayQuestionMobile,
  createMomentMobile,
  createPdfPreviewMobile,
  downloadPdfMobile,
  downloadUploadedFileMobile,
  getFamilyAnswersMobile,
  getFamilyMembersMobile,
  getFamilyMobile,
  getProfileMobile,
  getTimelineMobile,
  getTodayQuestionMobile,
  listMomentsMobile,
  sendFamilyInvitationMobile,
  uploadProfileImageMobile,
  uploadFamilyFileMobile
} from "../api/http";

const initialPdfForm = {
  period: "monthly",
  style: "family-story",
  includeMoments: true,
  includeAnswers: true
};

export default function ModuleScreen({ route }) {
  const moduleKey = route?.params?.moduleKey || "profile";
  const sessionUser = getSessionUser();

  const [profile, setProfile] = useState(sessionUser);
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [todayQuestion, setTodayQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [moments, setMoments] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const [answerText, setAnswerText] = useState("");
  const [momentTitle, setMomentTitle] = useState("");
  const [momentDescription, setMomentDescription] = useState("");
  const [pickedFile, setPickedFile] = useState(null);
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
          const [loadedFamily, loadedMembers, loadedQuestion, loadedAnswers, loadedMoments, loadedTimeline] = await Promise.all([
            getFamilyMobile(loadedProfile.familyId),
            getFamilyMembersMobile(loadedProfile.familyId),
            getTodayQuestionMobile(),
            getFamilyAnswersMobile(loadedProfile.familyId),
            listMomentsMobile(loadedProfile.familyId),
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
          setTimeline(Array.isArray(loadedTimeline) ? loadedTimeline : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Неуспешно зареждане на данните.");
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
  }, []);

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
      setInfo("Отговорът е изпратен успешно.");
    } catch (err) {
      setError(err.message || "Неуспешно изпращане на отговора.");
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
      setInfo(`Избран файл: ${result.assets[0].name}`);
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
      setInfo(`Избрана профилна снимка: ${result.assets[0].name}`);
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
      setInfo("Профилната снимка е обновена.");
    } catch (err) {
      setError(err.message || "Неуспешно качване на профилна снимка.");
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
      setInfo("Моментът е добавен успешно.");
    } catch (err) {
      setError(err.message || "Неуспешно създаване на момент.");
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
        setInfo("Поканата е изпратена успешно.");
      } else {
        setInfo(`Имейлът не е изпратен (${response?.deliveryStatus || "UNKNOWN"}). Линк: ${response?.inviteLink || "-"}`);
      }
    } catch (err) {
      setError(err.message || "Неуспешно изпращане на поканата.");
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
            setInfo(`Файлът е запазен: ${name}`);
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
      setError(err.message || "Неуспешно отваряне на файла.");
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
      setInfo("PDF прегледът е генериран.");
    } catch (err) {
      setError(err.message || "Неуспешно генериране на PDF преглед.");
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
          setInfo(`PDF файлът е запазен: ${name}`);
        }
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(target);
        setInfo("PDF файлът е готов за споделяне/сваляне.");
      } else {
        const safeUri = await toSafeOpenUri(target);
        await Linking.openURL(safeUri);
        setInfo("PDF файлът е готов за споделяне/сваляне.");
      }
    } catch (err) {
      setError(err.message || "Неуспешно изтегляне на PDF.");
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
          <Text style={styles.fileAction}>Виж</Text>
        </Pressable>
        <Pressable onPress={() => openAttachment(path, "download", preferredName)}>
          <Text style={styles.fileAction}>Свали</Text>
        </Pressable>
      </View>
    );
  }

  if (moduleKey === "profile") {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Моят профил</Text>
        {profileImageUri ? <Image source={{ uri: profileImageUri }} style={styles.profileImage} /> : null}
        {!profileImageUri ? <Text style={styles.emptyText}>Няма профилна снимка.</Text> : null}
        <View style={styles.fileActionsRow}>
          <Pressable onPress={onPickProfilePhoto}>
            <Text style={styles.fileAction}>Избери профилна снимка</Text>
          </Pressable>
          {profilePhotoFile ? <Text style={styles.itemMeta} numberOfLines={1}>{profilePhotoFile.name}</Text> : null}
        </View>
        <Pressable
          style={[styles.primaryBtn, (busy || !profilePhotoFile) && styles.disabled]}
          onPress={onUploadProfilePhoto}
          disabled={busy || !profilePhotoFile}
        >
          <Text style={styles.primaryBtnText}>{busy ? "Качване..." : "Качи снимка"}</Text>
        </Pressable>
        <Text style={styles.rowText}>Потребител: {profile ? `${profile.firstName} ${profile.lastName}` : "-"}</Text>
        <Text style={styles.rowText}>Email: {profile?.email || "-"}</Text>
        <Text style={styles.rowText}>Семейство: {profile?.familyName || family?.name || "-"}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
      </View>
    );
  }

  if (moduleKey === "family") {
    return (
      <ScrollView style={styles.card} contentContainerStyle={styles.cardScrollContent}>
        <Text style={styles.cardTitle}>Вашето семейство</Text>
        <Text style={styles.rowText}>Име: {family?.name || "-"}</Text>
        <Text style={styles.rowText}>Членове: {members.length}</Text>

        {canInviteMembers ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email за покана"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
            />
            <View style={styles.timelineFilters}>
              <Pressable
                style={[styles.filterChip, inviteRole === "PARENT" && styles.filterChipActive]}
                onPress={() => setInviteRole("PARENT")}
              >
                <Text style={[styles.filterChipText, inviteRole === "PARENT" && styles.filterChipTextActive]}>Родител</Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, inviteRole === "CHILD" && styles.filterChipActive]}
                onPress={() => setInviteRole("CHILD")}
              >
                <Text style={[styles.filterChipText, inviteRole === "CHILD" && styles.filterChipTextActive]}>Дете</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.primaryBtn, (busy || !inviteEmail.trim()) && styles.disabled]}
              onPress={onSendInvite}
              disabled={busy || !inviteEmail.trim()}
            >
              <Text style={styles.primaryBtnText}>{busy ? "Изпращане..." : "Изпрати покана"}</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.emptyText}>Само родител може да изпраща покани.</Text>
        )}

        {familyMembersWithLogged.map((member) => (
          <View key={member.id || `${member.email}-${member.role}`} style={styles.item}>
            <Text style={styles.itemTitle}>{member.firstName} {member.lastName}</Text>
            <Text style={styles.itemMeta}>{member.role} | {member.email}</Text>
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
        <Text style={styles.cardTitle}>Въпрос на деня</Text>
        <Text style={styles.questionText}>{loading ? "Зареждане..." : todayQuestion?.title || "Няма наличен въпрос за деня."}</Text>
        <TextInput
          style={styles.input}
          placeholder="Вашият отговор"
          value={answerText}
          onChangeText={setAnswerText}
          multiline
        />
        <Pressable
          style={[styles.primaryBtn, (busy || !todayQuestion?.id || !familyId) && styles.disabled]}
          onPress={onSubmitAnswer}
          disabled={busy || !todayQuestion?.id || !familyId}
        >
          <Text style={styles.primaryBtnText}>{busy ? "Изпращане..." : "Изпрати отговор"}</Text>
        </Pressable>

        {filteredAnswers.slice(0, 4).map((answer) => (
          <View key={answer.id || `${answer.authorName}-${answer.createdAt}`} style={styles.item}>
            <Text style={styles.itemTitle}>{answer.questionTitle || "Въпрос"}</Text>
            <Text style={styles.rowText} numberOfLines={2}>{answer.answerText}</Text>
            <Text style={styles.itemMeta}>{answer.authorName || "Семейство"} | {formatDate(answer.createdAt)}</Text>
          </View>
        ))}
        {filteredAnswers.length === 0 ? <Text style={styles.emptyText}>Все още нямате отговори.</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
      </View>
    );
  }

  if (moduleKey === "moments") {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Семейни моменти</Text>
        <TextInput
          style={styles.input}
          placeholder="Заглавие"
          value={momentTitle}
          onChangeText={setMomentTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Описание"
          value={momentDescription}
          onChangeText={setMomentDescription}
          multiline
        />

        <View style={styles.fileActionsRow}>
          <Pressable onPress={onPickFile}>
            <Text style={styles.fileAction}>Прикачи файл</Text>
          </Pressable>
          {pickedFile ? <Text style={styles.itemMeta} numberOfLines={1}>{pickedFile.name}</Text> : null}
        </View>

        <Pressable
          style={[styles.primaryBtn, (busy || !familyId || !momentTitle.trim()) && styles.disabled]}
          onPress={onCreateMoment}
          disabled={busy || !familyId || !momentTitle.trim()}
        >
          <Text style={styles.primaryBtnText}>{busy ? "Добавяне..." : "Добави момент"}</Text>
        </Pressable>

        {filteredMoments.slice(0, 4).map((moment) => (
          <View key={moment.id || `${moment.title}-${moment.createdAt}`} style={styles.item}>
            <Text style={styles.itemTitle}>{moment.title}</Text>
            <Text style={styles.rowText} numberOfLines={2}>{moment.description || "Няма описание"}</Text>
            {renderAttachmentActions(moment.imageUrl, moment.title)}
            <Text style={styles.itemMeta}>{moment.authorName || "Семейство"} | {formatDate(moment.createdAt)}</Text>
          </View>
        ))}
        {filteredMoments.length === 0 ? <Text style={styles.emptyText}>Все още нямате добавени моменти.</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
      </View>
    );
  }

  if (moduleKey === "timeline") {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Семейна хроника</Text>
        <View style={styles.timelineFilters}>
          <Pressable
            style={[styles.filterChip, selectedTimelineType === "all" && styles.filterChipActive]}
            onPress={() => setSelectedTimelineType("all")}
          >
            <Text style={[styles.filterChipText, selectedTimelineType === "all" && styles.filterChipTextActive]}>Всички типове</Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, selectedTimelineType === "question" && styles.filterChipActive]}
            onPress={() => setSelectedTimelineType("question")}
          >
            <Text style={[styles.filterChipText, selectedTimelineType === "question" && styles.filterChipTextActive]}>Въпроси</Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, selectedTimelineType === "moment" && styles.filterChipActive]}
            onPress={() => setSelectedTimelineType("moment")}
          >
            <Text style={[styles.filterChipText, selectedTimelineType === "moment" && styles.filterChipTextActive]}>Моменти</Text>
          </Pressable>
        </View>
        <View style={styles.timelineDateRow}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="От (YYYY-MM-DD)"
            value={timelineDateFrom}
            onChangeText={setTimelineDateFrom}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="До (YYYY-MM-DD)"
            value={timelineDateTo}
            onChangeText={setTimelineDateTo}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.clearDateBtn} onPress={() => {
            setTimelineDateFrom("");
            setTimelineDateTo("");
          }}>
            <Text style={styles.clearDateText}>Изчисти дати</Text>
          </Pressable>
        </View>
        <View style={styles.timelineFilters}>
          <Pressable
            style={[styles.filterChip, selectedTimelineMemberId === "all" && styles.filterChipActive]}
            onPress={() => setSelectedTimelineMemberId("all")}
          >
            <Text style={[styles.filterChipText, selectedTimelineMemberId === "all" && styles.filterChipTextActive]}>Всички</Text>
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
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{resolveMemberName(member)}</Text>
              </Pressable>
            );
          })}
        </View>
        {filteredTimeline.map((item) => (
          <View key={item.sourceId || `${item.type}-${item.createdAt}`} style={styles.item}>
            <Text style={styles.itemTitle}>{item.type} | {item.title}</Text>
            <Text style={styles.rowText} numberOfLines={2}>{item.details || "Няма подробности"}</Text>
            {renderAttachmentActions(item.imageUrl, item.title)}
            <Text style={styles.itemMeta}>{item.author || "Семейство"} | {formatDate(item.createdAt)}</Text>
          </View>
        ))}
        {filteredTimeline.length === 0 ? <Text style={styles.emptyText}>Няма записи за избрания член.</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Семейна PDF книга</Text>

      <View style={styles.switchRow}>
        <Text style={styles.rowText}>Включи моменти</Text>
        <Switch
          value={pdfForm.includeMoments}
          onValueChange={(value) => setPdfForm((prev) => ({ ...prev, includeMoments: value }))}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.rowText}>Включи отговори</Text>
        <Switch
          value={pdfForm.includeAnswers}
          onValueChange={(value) => setPdfForm((prev) => ({ ...prev, includeAnswers: value }))}
        />
      </View>

      <Pressable style={[styles.primaryBtn, busy && styles.disabled]} onPress={onCreatePdfPreview} disabled={busy || !familyId}>
        <Text style={styles.primaryBtnText}>Генерирай преглед</Text>
      </Pressable>
      <Pressable style={[styles.secondaryBtnInline, busy && styles.disabled]} onPress={onDownloadPdf} disabled={busy || !familyId}>
        <Text style={styles.secondaryBtnText}>Свали PDF</Text>
      </Pressable>

      <Text style={styles.rowText}>Статус: {pdfPreview?.status || "-"}</Text>
      <Text style={styles.rowText}>Период: {pdfPreview?.period || pdfForm.period}</Text>
      <Text style={styles.rowText}>Стил: {pdfPreview?.style || pdfForm.style}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
    </View>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} г., ${hours}:${minutes}`;
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

function resolveMemberName(member) {
  return `${member?.firstName || ""} ${member?.lastName || ""}`.trim() || member?.email || "Член";
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
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

