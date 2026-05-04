"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Heart, ImagePlus, MessageCircle, Share, X } from "lucide-react";
import { DotsThree, User } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { getStoredProfilePhoto } from "../../lib/profile-media";
import { readAccessToken } from "../../lib/auth-client";
import { paperlogy } from "../../lib/fonts";

type CategoryKey = "all" | "free" | "career" | "help";

type Post = {
  id: string;
  authorId?: string | null;
  category: CategoryKey;
  author: string;
  title: string;
  body: string;
  imageUrls?: string[];
  createdAt: string;
  likes: number;
  comments: number;
  likedByMe?: boolean;
};

type PostComment = {
  id: string;
  postId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type EditingPostState = {
  id: string;
  category: Exclude<CategoryKey, "all">;
  body: string;
  imageUrls: string[];
};

type CommentTranslationState = {
  activeLanguage: "original" | "ko" | "en";
  koBody?: string;
  enBody?: string;
  loadingTarget?: "ko" | "en";
  error?: string;
};

type TranslationState = {
  activeLanguage: "original" | "ko" | "en";
  koTitle?: string;
  koBody?: string;
  enTitle?: string;
  enBody?: string;
  loadingTarget?: "ko" | "en";
  error?: string;
};

const categoryCopy: Record<CategoryKey, { label: { ko: string; en: string }; desc: { ko: string; en: string } }> = {
  all: {
    label: { ko: "전체", en: "All" },
    desc: { ko: "여기서 모든 카테고리 피드를 한 번에 볼 수 있어요.", en: "View posts from every category in one place." }
  },
  free: {
    label: { ko: "자유 소통", en: "Open Chat" },
    desc: { ko: "잡담부터 친구 찾기, 일상 이야기까지 편하게 나눠요.", en: "Share casual thoughts, daily stories, and connect with others." }
  },
  career: {
    label: { ko: "커리어/취업", en: "Career & Jobs" },
    desc: { ko: "포지션, 이력서, 면접, 합격 후기까지 커리어 얘기를 같이 나눠봐요.", en: "Talk about roles, resumes, interviews, and hiring outcomes." }
  },
  help: {
    label: { ko: "질문/도움요청", en: "Questions & Help" },
    desc: { ko: "한국 생활, 비자, 서류, 학교, 행정 관련해서 궁금한 건 편하게 물어보세요.", en: "Ask freely about life in Korea, visas, documents, school, and admin processes." }
  }
};
const draftCategoryGuideTextByLocale: Record<"ko" | "en", Record<Exclude<CategoryKey, "all">, string>> = {
  ko: {
    free: "가벼운 일상, 생각, 경험 등 자유롭게 나누고 싶은 이야기를 적어주세요.",
    career: "취업 준비, 이력서/면접, 직무 고민처럼 커리어에 도움이 되는 내용을 적어주세요.",
    help: "비자, 학교, 서류, 한국 생활 등 도움이 필요한 내용을 구체적으로 적어주세요."
  },
  en: {
    free: "Write anything you want to share freely, such as daily thoughts or experiences.",
    career: "Share practical career topics like job prep, resumes, interviews, or role concerns.",
    help: "Describe clearly what kind of help you need with visas, school, documents, or life in Korea."
  }
};

const COMMUNITY_PAGE_SIZE = 20;
const COMMUNITY_TRANSLATION_CACHE_KEY = "community_translation_cache_v1";
const PROFILE_SQUIRCLE_CLIP_ID = "community-profile-squircle-clip";
const PROFILE_SQUIRCLE_PATH = "M50,0 C74,0 86,3 93,10 C97,14 100,26 100,50 C100,74 97,86 93,90 C86,97 74,100 50,100 C26,100 14,97 7,90 C3,86 0,74 0,50 C0,26 3,14 7,10 C14,3 26,0 50,0 Z";
const PROFILE_SQUIRCLE_FALLBACK_STYLE = {
  clipPath: `url(#${PROFILE_SQUIRCLE_CLIP_ID})`,
  WebkitClipPath: `url(#${PROFILE_SQUIRCLE_CLIP_ID})`
} as const;
const PROFILE_SQUIRCLE_SHAPE_VALUE = "shape(from 50% 0%, curve to 100% 50% with 100% 15%, 100% 35%, curve to 50% 100% with 85% 100%, 65% 100%, curve to 0% 50% with 0% 85%, 0% 65%, curve to 50% 0% with 15% 0%, 35% 0%)";

function CommunitySquircleStroke() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      viewBox="0 0 100 100"
      aria-hidden
      preserveAspectRatio="none"
    >
      <path d={PROFILE_SQUIRCLE_PATH} fill="none" stroke="hsl(var(--border))" strokeWidth="1.2" />
    </svg>
  );
}

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function formatRelativeTime(input: string, locale: "ko" | "en") {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (locale === "ko") {
    if (diffMinutes < 1) return "방금 전";
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  }
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

type FeedModalProps = {
  open: boolean;
  title: string;
  profilePhoto: string | null;
  showProfile?: boolean;
  category: Exclude<CategoryKey, "all">;
  onCategoryChange: (next: Exclude<CategoryKey, "all">) => void;
  body: string;
  onBodyChange: (next: string) => void;
  bodyPlaceholder?: string;
  guideText?: string;
  images: string[];
  onAddImages: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  squircleStyle: Record<string, string>;
  draftCategoryOptions: { key: Exclude<CategoryKey, "all">; label: string }[];
  selectedTopicLabel: string;
  addImagesLabel: string;
  cancelLabel: string;
  attachedImageAlt: string;
  removeImageAriaLabel: string;
};

const FeedModal = ({
  open,
  title,
  profilePhoto,
  showProfile = true,
  category,
  onCategoryChange,
  body,
  onBodyChange,
  bodyPlaceholder = "What would you like to talk about?",
  guideText,
  images,
  onAddImages,
  onRemoveImage,
  onClose,
  onSubmit,
  isSubmitting,
  submitLabel,
  submittingLabel,
  squircleStyle,
  draftCategoryOptions,
  selectedTopicLabel,
  addImagesLabel,
  cancelLabel,
  attachedImageAlt,
  removeImageAriaLabel
}: FeedModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-4">
        <div className="flex items-start gap-3">
          {showProfile ? (
            profilePhoto ? (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-slate-50" style={squircleStyle}>
                <CommunitySquircleStroke />
                <img
                  src={profilePhoto}
                  alt="Company logo preview"
                  className="absolute inset-0 z-10 block h-full w-full scale-[1.08] object-cover bg-muted/30"
                />
              </div>
            ) : (
              <div className="relative grid h-10 w-10 shrink-0 place-items-center bg-slate-100 text-slate-400" style={squircleStyle}>
                <CommunitySquircleStroke />
                <User className="h-5 w-5" weight="regular" />
              </div>
            )
          ) : null}
          <div className="flex-1">
            <p className="mb-2 text-base font-bold text-[#0B1227]">{title}</p>
            <p className="mb-3 text-sm font-normal text-slate-700">{selectedTopicLabel}</p>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {draftCategoryOptions.map((item) => {
                const isActive = category === item.key;
                return (
                  <button
                    key={`feed-modal-${title}-${item.key}`}
                    type="button"
                    onClick={() => onCategoryChange(item.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive ? "bg-[#DBEAFE] text-[#0B46E8]" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            {guideText ? <p className="mb-4 text-xs text-slate-500">{guideText}</p> : null}
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder={bodyPlaceholder}
              className="min-h-[132px] w-full resize-y rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-500"
            />
            <div className="mt-3 flex items-center justify-between">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                <ImagePlus className="h-4 w-4" />
                {addImagesLabel} ({images.length}/5)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onAddImages(e.target.files)}
                />
              </label>
              <div className="flex items-center gap-2">
                <Button type="button" onClick={onClose} disabled={isSubmitting} className="h-10 rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                  {cancelLabel}
                </Button>
                <Button
                  type="button"
                  onClick={onSubmit}
                  disabled={isSubmitting || !body.trim()}
                  className="h-10 rounded-md bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] hover:bg-[#a8ee4d]"
                >
                  {isSubmitting ? submittingLabel : submitLabel}
                </Button>
              </div>
            </div>
            {images.length > 0 ? (
              <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-5">
                {images.map((src, index) => (
                  <div key={`${src.slice(0, 24)}-${title}-${index}`} className="relative">
                    <img src={src} alt={`${attachedImageAlt} ${index + 1}`} className="h-20 w-full rounded-md object-cover" />
                    <button
                      type="button"
                      onClick={() => onRemoveImage(index)}
                      className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-black/80"
                      aria-label={removeImageAriaLabel}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CommunityPage = () => {
  const { user } = useAuthSession();
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const t = useCallback((ko: string, en: string) => (isKo ? ko : en), [isKo]);
  const categories: { key: CategoryKey; label: string; desc: string }[] = [
    { key: "all", label: t(categoryCopy.all.label.ko, categoryCopy.all.label.en), desc: t(categoryCopy.all.desc.ko, categoryCopy.all.desc.en) },
    { key: "free", label: t(categoryCopy.free.label.ko, categoryCopy.free.label.en), desc: t(categoryCopy.free.desc.ko, categoryCopy.free.desc.en) },
    { key: "career", label: t(categoryCopy.career.label.ko, categoryCopy.career.label.en), desc: t(categoryCopy.career.desc.ko, categoryCopy.career.desc.en) },
    { key: "help", label: t(categoryCopy.help.label.ko, categoryCopy.help.label.en), desc: t(categoryCopy.help.desc.ko, categoryCopy.help.desc.en) }
  ];
  const draftCategories = categories.filter(
    (category): category is { key: Exclude<CategoryKey, "all">; label: string; desc: string } => category.key !== "all"
  );
  const draftCategoryGuideText = isKo ? draftCategoryGuideTextByLocale.ko : draftCategoryGuideTextByLocale.en;
  const topComposeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [showFloatingCompose, setShowFloatingCompose] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [draftText, setDraftText] = useState("");
  const [draftCategory, setDraftCategory] = useState<Exclude<CategoryKey, "all">>("free");
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [translations, setTranslations] = useState<Record<string, TranslationState>>({});
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostComment[]>>({});
  const [commentTranslations, setCommentTranslations] = useState<Record<string, CommentTranslationState>>({});
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [commentLoadingByPost, setCommentLoadingByPost] = useState<Record<string, boolean>>({});
  const [likeLoadingByPost, setLikeLoadingByPost] = useState<Record<string, boolean>>({});
  const [expandedBodyByPost, setExpandedBodyByPost] = useState<Record<string, boolean>>({});
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<EditingPostState | null>(null);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [profileSquircleStyle, setProfileSquircleStyle] = useState<Record<string, string>>(PROFILE_SQUIRCLE_FALLBACK_STYLE);
  const activeCategoryMeta = categories.find((category) => category.key === activeCategory) ?? categories[0];

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.CSS.supports("clip-path", PROFILE_SQUIRCLE_SHAPE_VALUE)) {
      setProfileSquircleStyle({
        clipPath: PROFILE_SQUIRCLE_SHAPE_VALUE,
        WebkitClipPath: PROFILE_SQUIRCLE_SHAPE_VALUE
      });
      return;
    }
    setProfileSquircleStyle(PROFILE_SQUIRCLE_FALLBACK_STYLE);
  }, []);
  useEffect(() => {
    if (!user?.id) {
      setProfilePhoto(null);
      return;
    }
    setProfilePhoto(getStoredProfilePhoto(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (activeCategory === "all") return;
    setDraftCategory(activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    const node = topComposeButtonRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = Boolean(entry?.isIntersecting);
        setShowFloatingCompose(!isVisible);
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COMMUNITY_TRANSLATION_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, TranslationState>;
      if (!parsed || typeof parsed !== "object") return;
      const sanitized: Record<string, TranslationState> = {};
      for (const [postId, item] of Object.entries(parsed)) {
        if (!item || typeof item !== "object") continue;
        sanitized[postId] = {
          activeLanguage:
            item.activeLanguage === "ko" || item.activeLanguage === "en" || item.activeLanguage === "original"
              ? item.activeLanguage
              : "original",
          koTitle: typeof item.koTitle === "string" ? item.koTitle : undefined,
          koBody: typeof item.koBody === "string" ? item.koBody : undefined,
          enTitle: typeof item.enTitle === "string" ? item.enTitle : undefined,
          enBody: typeof item.enBody === "string" ? item.enBody : undefined,
          loadingTarget: undefined,
          error: undefined
        };
      }
      setTranslations(sanitized);
    } catch {
      // ignore cache parse errors
    }
  }, []);

  useEffect(() => {
    try {
      const serializable: Record<string, Omit<TranslationState, "loadingTarget" | "error">> = {};
      for (const [postId, item] of Object.entries(translations)) {
        serializable[postId] = {
          activeLanguage: item.activeLanguage,
          koTitle: item.koTitle,
          koBody: item.koBody,
          enTitle: item.enTitle,
          enBody: item.enBody
        };
      }
      window.localStorage.setItem(COMMUNITY_TRANSLATION_CACHE_KEY, JSON.stringify(serializable));
    } catch {
      // ignore cache write errors
    }
  }, [translations]);

  const handleApplySearch = useCallback(() => {
    setSearchQuery(searchInput.trim());
  }, [searchInput]);

  const fetchPosts = useCallback(
    async (cursor?: string | null) => {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      params.set("sortBy", sortBy);
      params.set("limit", String(COMMUNITY_PAGE_SIZE));
      const q = searchQuery.trim();
      if (q) params.set("search", q);
      if (cursor) params.set("cursor", cursor);
      const token = readAccessToken();
      const response = await fetch(`${getApiBaseUrl()}/community/posts?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        items?: Post[];
        nextCursor?: string | null;
      };
      if (!response.ok || payload.ok !== true || !Array.isArray(payload.items)) {
        throw new Error(payload.message ?? t("피드를 불러오지 못했습니다.", "Failed to load feeds."));
      }
      return {
        items: payload.items,
        nextCursor: typeof payload.nextCursor === "string" && payload.nextCursor.trim() ? payload.nextCursor : null
      };
    },
    [activeCategory, searchQuery, sortBy]
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const page = await fetchPosts(null);
        if (cancelled) return;
        setPosts(page.items);
        setNextCursor(page.nextCursor);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : t("피드를 불러오지 못했습니다.", "Failed to load feeds."));
        setPosts([]);
        setNextCursor(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [fetchPosts]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setLoadError(null);
    try {
      const page = await fetchPosts(nextCursor);
      setPosts((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("더보기 로딩에 실패했습니다.", "Failed to load more feeds."));
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPosts, isLoadingMore, nextCursor]);

  const handleDraftImages = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remain = Math.max(0, 5 - draftImages.length);
    if (remain <= 0) return;
    const selected = Array.from(files).slice(0, remain);
    const nextImages = await Promise.all(
      selected.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
            reader.onerror = () => reject(new Error(t("이미지 로드 실패", "Failed to load image")));
            reader.readAsDataURL(file);
          })
      )
    );
    setDraftImages((prev) => [...prev, ...nextImages.filter((item) => item.length > 0)]);
  }, [draftImages.length]);

  const handleToggleLike = useCallback(async (post: Post) => {
    if (!user) {
      setLoadError(t("로그인 후 좋아요를 사용할 수 있습니다.", "You can use likes after logging in."));
      return;
    }
    if (likeLoadingByPost[post.id]) return;
    setLikeLoadingByPost((prev) => ({ ...prev, [post.id]: true }));
    try {
      const token = readAccessToken();
      const endpoint = `${getApiBaseUrl()}/community/posts/${encodeURIComponent(post.id)}/like`;
      const response = await fetch(endpoint, {
        method: post.likedByMe ? "DELETE" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; likes?: number; likedByMe?: boolean };
      if (!response.ok || payload.ok !== true) {
        throw new Error(payload.message ?? t("좋아요 처리에 실패했습니다.", "Failed to process like."));
      }
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? {
                ...item,
                likes: typeof payload.likes === "number" ? payload.likes : item.likes,
                likedByMe: Boolean(payload.likedByMe)
              }
            : item
        )
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("좋아요 처리에 실패했습니다.", "Failed to process like."));
    } finally {
      setLikeLoadingByPost((prev) => ({ ...prev, [post.id]: false }));
    }
  }, [likeLoadingByPost, user]);

  const loadComments = useCallback(async (postId: string) => {
    setCommentLoadingByPost((prev) => ({ ...prev, [postId]: true }));
    try {
      const response = await fetch(`${getApiBaseUrl()}/community/posts/${encodeURIComponent(postId)}/comments`, {
        method: "GET",
        credentials: "include"
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; items?: PostComment[] };
      if (!response.ok || payload.ok !== true || !Array.isArray(payload.items)) {
        throw new Error(payload.message ?? t("댓글을 불러오지 못했습니다.", "Failed to load comments."));
      }
      setCommentsByPost((prev) => ({ ...prev, [postId]: payload.items ?? [] }));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("댓글을 불러오지 못했습니다.", "Failed to load comments."));
    } finally {
      setCommentLoadingByPost((prev) => ({ ...prev, [postId]: false }));
    }
  }, []);

  const handleToggleComments = useCallback(async (postId: string) => {
    const willOpen = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: willOpen }));
    if (willOpen && !commentsByPost[postId]) {
      await loadComments(postId);
    }
  }, [commentsByPost, expandedComments, loadComments]);

  const handleSubmitComment = useCallback(async (postId: string) => {
    if (!user) {
      setLoadError(t("로그인 후 댓글을 작성할 수 있습니다.", "You can write comments after logging in."));
      return;
    }
    const body = (commentDraftByPost[postId] ?? "").trim();
    if (!body) return;
    setCommentLoadingByPost((prev) => ({ ...prev, [postId]: true }));
    try {
      const token = readAccessToken();
      const response = await fetch(`${getApiBaseUrl()}/community/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ body })
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; item?: PostComment; commentCount?: number };
      if (!response.ok || payload.ok !== true || !payload.item) {
        throw new Error(payload.message ?? t("댓글 작성에 실패했습니다.", "Failed to post comment."));
      }
      setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), payload.item as PostComment] }));
      setCommentDraftByPost((prev) => ({ ...prev, [postId]: "" }));
      if (typeof payload.commentCount === "number") {
        setPosts((prev) => prev.map((item) => (item.id === postId ? { ...item, comments: payload.commentCount as number } : item)));
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("댓글 작성에 실패했습니다.", "Failed to post comment."));
    } finally {
      setCommentLoadingByPost((prev) => ({ ...prev, [postId]: false }));
    }
  }, [commentDraftByPost, user]);

  const handleTranslateComment = useCallback(async (comment: PostComment, targetLanguage: "ko" | "en") => {
    const current = commentTranslations[comment.id];
    if (targetLanguage === "ko" && current?.koBody) {
      setCommentTranslations((prev) => ({
        ...prev,
        [comment.id]: { ...prev[comment.id], activeLanguage: "ko", error: undefined }
      }));
      return;
    }
    if (targetLanguage === "en" && current?.enBody) {
      setCommentTranslations((prev) => ({
        ...prev,
        [comment.id]: { ...prev[comment.id], activeLanguage: "en", error: undefined }
      }));
      return;
    }

    setCommentTranslations((prev) => ({
      ...prev,
      [comment.id]: {
        ...prev[comment.id],
        activeLanguage: prev[comment.id]?.activeLanguage ?? "original",
        loadingTarget: targetLanguage,
        error: undefined
      }
    }));

    try {
      const response = await fetch(`${getApiBaseUrl()}/community/translate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: comment.body, targetLanguage })
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; translatedText?: string };
      if (!response.ok || payload.ok !== true || !payload.translatedText) {
        throw new Error(payload.message ?? t("번역에 실패했습니다.", "Translation failed."));
      }
      setCommentTranslations((prev) => ({
        ...prev,
        [comment.id]: {
          ...prev[comment.id],
          activeLanguage: targetLanguage,
          loadingTarget: undefined,
          koBody: targetLanguage === "ko" ? payload.translatedText : prev[comment.id]?.koBody,
          enBody: targetLanguage === "en" ? payload.translatedText : prev[comment.id]?.enBody
        }
      }));
    } catch (error) {
      setCommentTranslations((prev) => ({
        ...prev,
        [comment.id]: {
          ...prev[comment.id],
          loadingTarget: undefined,
          error: error instanceof Error ? error.message : t("번역에 실패했습니다.", "Translation failed.")
        }
      }));
    }
  }, [commentTranslations]);

  const handlePostSubmit = useCallback(async () => {
    const text = draftText.trim();
    if (!text || isPosting) return;
    setIsPosting(true);
    setLoadError(null);
    try {
      const token = readAccessToken();
      if (!token) {
        throw new Error(t("로그인 후 피드를 올릴 수 있습니다.", "You can post feeds after logging in."));
      }
      const response = await fetch(`${getApiBaseUrl()}/community/posts`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: draftCategory,
          body: text,
          imageUrls: draftImages
        })
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; item?: Post };
      if (!response.ok || payload.ok !== true || !payload.item) {
        throw new Error(payload.message ?? t("피드 등록에 실패했습니다.", "Failed to create feed."));
      }
      setPosts((prev) => [payload.item as Post, ...prev]);
      setDraftText("");
      setDraftImages([]);
      setIsComposeOpen(false);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("피드 등록에 실패했습니다.", "Failed to create feed."));
    } finally {
      setIsPosting(false);
    }
  }, [draftCategory, draftImages, draftText, isPosting]);

  const handleDeletePost = useCallback(async (post: Post) => {
    const ok = window.confirm(t("이 글을 삭제할까요?", "Do you want to delete this post?"));
    if (!ok) return;
    try {
      const token = readAccessToken();
      if (!token) throw new Error(t("로그인이 필요합니다.", "Login is required."));
      const response = await fetch(`${getApiBaseUrl()}/community/posts/${encodeURIComponent(post.id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || payload.ok !== true) {
        throw new Error(payload.message ?? t("삭제에 실패했습니다.", "Failed to delete."));
      }
      setPosts((prev) => prev.filter((item) => item.id !== post.id));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("삭제에 실패했습니다.", "Failed to delete."));
    } finally {
      setActivePostMenuId(null);
    }
  }, []);

  const handleUpdatePost = useCallback(async () => {
    if (!editingPost) return;
    const body = editingPost.body.trim();
    if (!body) return;
    setIsUpdatingPost(true);
    try {
      const token = readAccessToken();
      if (!token) throw new Error(t("로그인이 필요합니다.", "Login is required."));
      const target = posts.find((item) => item.id === editingPost.id);
      const response = await fetch(`${getApiBaseUrl()}/community/posts/${encodeURIComponent(editingPost.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          body,
          category: editingPost.category,
          imageUrls: editingPost.imageUrls
        })
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; item?: Post };
      if (!response.ok || payload.ok !== true || !payload.item) {
        throw new Error(payload.message ?? t("수정에 실패했습니다.", "Failed to update."));
      }
      setPosts((prev) => prev.map((item) => (item.id === payload.item!.id ? payload.item! : item)));
      setEditingPost(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t("수정에 실패했습니다.", "Failed to update."));
    } finally {
      setIsUpdatingPost(false);
    }
  }, [editingPost]);

  const handleEditImages = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !editingPost) return;
    const remain = Math.max(0, 5 - editingPost.imageUrls.length);
    if (remain <= 0) return;
    const selected = Array.from(files).slice(0, remain);
    const nextImages = await Promise.all(
      selected.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
            reader.onerror = () => reject(new Error(t("이미지 로드 실패", "Failed to load image")));
            reader.readAsDataURL(file);
          })
      )
    );
    setEditingPost((prev) =>
      prev
        ? {
            ...prev,
            imageUrls: [...prev.imageUrls, ...nextImages.filter((item) => item.length > 0)].slice(0, 5)
          }
        : prev
    );
  }, [editingPost]);

  const handleTranslate = useCallback(async (post: Post, targetLanguage: "ko" | "en") => {
    const current = translations[post.id];
    if (targetLanguage === "ko" && current?.koTitle && current?.koBody) {
      setTranslations((prev) => ({
        ...prev,
        [post.id]: { ...prev[post.id], activeLanguage: "ko", error: undefined }
      }));
      return;
    }
    if (targetLanguage === "en" && current?.enTitle && current?.enBody) {
      setTranslations((prev) => ({
        ...prev,
        [post.id]: { ...prev[post.id], activeLanguage: "en", error: undefined }
      }));
      return;
    }
    setTranslations((prev) => ({
      ...prev,
      [post.id]: {
        ...prev[post.id],
        activeLanguage: prev[post.id]?.activeLanguage ?? "original",
        loadingTarget: targetLanguage,
        error: undefined
      }
    }));
    try {
      const [titleResponse, bodyResponse] = await Promise.all([
        fetch(`${getApiBaseUrl()}/community/translate`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: post.title, targetLanguage })
        }),
        fetch(`${getApiBaseUrl()}/community/translate`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: post.body, targetLanguage })
        })
      ]);
      const titlePayload = (await titleResponse.json()) as { ok?: boolean; message?: string; translatedText?: string };
      const bodyPayload = (await bodyResponse.json()) as { ok?: boolean; message?: string; translatedText?: string };
      if (
        !titleResponse.ok ||
        !bodyResponse.ok ||
        titlePayload.ok !== true ||
        bodyPayload.ok !== true ||
        !titlePayload.translatedText ||
        !bodyPayload.translatedText
      ) {
        throw new Error(titlePayload.message ?? bodyPayload.message ?? t("번역에 실패했습니다.", "Translation failed."));
      }
      setTranslations((prev) => ({
        ...prev,
        [post.id]: {
          ...prev[post.id],
          activeLanguage: targetLanguage,
          loadingTarget: undefined,
          koTitle: targetLanguage === "ko" ? titlePayload.translatedText : prev[post.id]?.koTitle,
          koBody: targetLanguage === "ko" ? bodyPayload.translatedText : prev[post.id]?.koBody,
          enTitle: targetLanguage === "en" ? titlePayload.translatedText : prev[post.id]?.enTitle,
          enBody: targetLanguage === "en" ? bodyPayload.translatedText : prev[post.id]?.enBody
        }
      }));
    } catch (error) {
      setTranslations((prev) => ({
        ...prev,
        [post.id]: {
          ...prev[post.id],
          loadingTarget: undefined,
          error: error instanceof Error ? error.message : t("번역에 실패했습니다.", "Translation failed.")
        }
      }));
    }
  }, [translations]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <clipPath id={PROFILE_SQUIRCLE_CLIP_ID} clipPathUnits="objectBoundingBox">
            <path d={PROFILE_SQUIRCLE_PATH} transform="scale(0.01)" />
          </clipPath>
        </defs>
      </svg>
      <Header />
      <main className="pb-20">
        <section className="bg-background">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-4xl">
              <section>
                <div className="flex items-center justify-between gap-3">
                  <h1 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] text-[#0B1227] md:text-5xl`}>{t("커뮤니티", "Community")}</h1>
                  <Button
                    ref={topComposeButtonRef}
                    type="button"
                    onClick={() => setIsComposeOpen(true)}
                    className="h-10 rounded-xl bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] hover:bg-[#a8ee4d]"
                  >
                    {t("피드 올리기", "Create Post")}
                  </Button>
                </div>
                <p className="mt-2 text-sm font-normal text-slate-500 md:text-base">{t("지금 떠오른 이야기, 편하게 나눠보세요", "Share what’s on your mind right now.")}</p>
                <div className="relative mt-4 h-[180px] overflow-hidden rounded-2xl bg-white md:h-[220px]">
                  <Image
                    src="/img_community_hero_20260502_v2.webp"
                    alt={t("커뮤니티 피드 배너", "Community feed banner")}
                    width={1680}
                    height={945}
                    preload
                    fetchPriority="high"
                    quality={70}
                    sizes="(max-width: 768px) 100vw, 896px"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="mt-8">
                  <div className="mx-auto flex w-full items-center gap-2 rounded-2xl bg-white p-2">
                    <div className="flex-1">
                      <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplySearch();
                          }
                        }}
                        placeholder={t("어떤 글을 찾고 있나요?", "What are you looking for?")}
                        className="h-11 w-full rounded-xl bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <Button
                      variant="dark"
                      size="lg"
                      className="h-11 shrink-0 rounded-xl bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d]"
                      type="button"
                      onClick={handleApplySearch}
                    >
                      {t("검색", "Search")}
                    </Button>
                  </div>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-5 md:gap-5">
                  {categories.map((category) => {
                    const isActive = category.key === activeCategory;
                    return (
                      <button
                        key={category.key}
                        type="button"
                        onClick={() => setActiveCategory(category.key)}
                        className="text-left"
                      >
                        <p
                          className={`${paperlogy.className} text-xl md:text-2xl ${
                            isActive ? "font-extrabold text-[#111111]" : "font-extrabold text-slate-300"
                          }`}
                        >
                          {category.label}
                        </p>
                        <span
                          className={`mt-1 block h-[2px] w-full transition-colors ${
                            isActive ? "bg-[#111111]" : "bg-transparent"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-sm text-slate-600">{activeCategoryMeta.desc}</p>
              </section>

              <section className="mt-6">
                <div className="mt-8 flex justify-end">
                  <div className="inline-flex items-center text-sm">
                    <button
                      type="button"
                      onClick={() => setSortBy("latest")}
                      className={sortBy === "latest" ? "font-bold text-[#0B46E8]" : "font-medium text-slate-500"}
                    >
                      {t("최신순", "Latest")}
                    </button>
                    <span className="px-2 text-slate-400">|</span>
                    <button
                      type="button"
                      onClick={() => setSortBy("popular")}
                      className={sortBy === "popular" ? "font-bold text-[#0B46E8]" : "font-medium text-slate-500"}
                    >
                      {t("인기순", "Popular")}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                {posts.map((post, index) => (
                  (() => {
                    const translation = translations[post.id];
                    const isMyPost = Boolean(user?.id && post.authorId === user.id);
                    const displayAuthor = isMyPost
                      ? (user?.name?.trim() || user?.email?.split("@")[0] || post.author)
                      : post.author;
                    const activeLanguage = translation?.activeLanguage ?? "original";
                    const postTitle =
                      activeLanguage === "ko" && translation?.koTitle
                        ? translation.koTitle
                        : activeLanguage === "en" && translation?.enTitle
                          ? translation.enTitle
                          : post.title;
                    const postBody =
                      activeLanguage === "ko" && translation?.koBody
                        ? translation.koBody
                        : activeLanguage === "en" && translation?.enBody
                          ? translation.enBody
                          : post.body;
                    return (
                  <article
                    key={post.id}
                    className="bg-white px-3 py-5 md:px-4"
                  >
                    <div className="mb-3 flex items-start gap-3">
                      {isMyPost && profilePhoto ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-slate-50" style={profileSquircleStyle}>
                          <CommunitySquircleStroke />
                          <img
                            src={profilePhoto}
                            alt={t("기업 로고 미리보기", "Company logo preview")}
                            className="absolute inset-0 z-10 block h-full w-full scale-[1.08] object-cover bg-muted/30"
                          />
                        </div>
                      ) : (
                        <div className="relative grid h-10 w-10 shrink-0 place-items-center bg-slate-100 text-slate-400" style={profileSquircleStyle}>
                          <CommunitySquircleStroke />
                          <User className="h-5 w-5" weight="regular" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="truncate text-base font-extrabold leading-tight text-[#0B1227]">{displayAuthor}</p>
                        <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{formatRelativeTime(post.createdAt, isKo ? "ko" : "en")}</p>
                      </div>
                      <div className="relative ml-auto">
                        <button
                          type="button"
                          onClick={() => setActivePostMenuId((prev) => (prev === post.id ? null : post.id))}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500"
                          aria-label={t("더보기", "More options")}
                        >
                          <DotsThree className="h-4 w-4" weight="bold" />
                        </button>
                        {activePostMenuId === post.id ? (
                          <div className="absolute right-0 top-9 z-20 min-w-[108px] rounded-md border border-slate-200 bg-white py-1">
                            {isMyPost ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPost({
                                      id: post.id,
                                      category: post.category === "all" ? "free" : post.category,
                                      body: post.body,
                                      imageUrls: post.imageUrls ? [...post.imageUrls] : []
                                    });
                                    setActivePostMenuId(null);
                                  }}
                                  className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  {t("수정하기", "Edit")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeletePost(post)}
                                  className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  {t("삭제하기", "Delete")}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActivePostMenuId(null)}
                                className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                {t("신고하기", "Report")}
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {post.imageUrls && post.imageUrls.length > 0 ? (
                      <div
                        className={`mb-4 grid gap-1 ${
                          post.imageUrls.length === 1
                            ? "grid-cols-1"
                            : post.imageUrls.length === 2
                              ? "grid-cols-2"
                              : "grid-cols-2 md:grid-cols-3"
                        }`}
                      >
                        {post.imageUrls.slice(0, 5).map((src, index) => (
                          <img
                            key={`${post.id}-image-${index}`}
                            src={src}
                            alt={`${t("피드 이미지", "Feed image")} ${index + 1}`}
                            className={`w-full rounded-md object-cover ${
                              post.imageUrls!.length === 1
                                ? "h-64 md:h-72"
                                : post.imageUrls!.length === 2
                                  ? "h-48 md:h-56"
                                  : "h-40 md:h-48"
                            }`}
                          />
                        ))}
                      </div>
                    ) : null}
                    {(() => {
                      const isExpanded = Boolean(expandedBodyByPost[post.id]);
                      const canToggle = postBody.length > 140 || postBody.includes("\n");
                      return (
                        <>
                          <p className={`mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 ${isExpanded ? "" : "line-clamp-3"}`}>{postBody}</p>
                          {canToggle ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedBodyByPost((prev) => ({
                                  ...prev,
                                  [post.id]: !prev[post.id]
                                }))
                              }
                              className="mt-1 text-xs font-semibold text-slate-500 hover:text-[#0B46E8]"
                            >
                              {isExpanded ? t("숨기기", "Show less") : t("더보기", "Show more")}
                            </button>
                          ) : null}
                        </>
                      );
                    })()}
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setTranslations((prev) => ({
                            ...prev,
                            [post.id]: { ...prev[post.id], activeLanguage: "original", error: undefined }
                          }))
                        }
                        className={`text-xs font-semibold ${activeLanguage === "original" ? "text-[#0B46E8]" : "text-slate-500"}`}
                      >
                        {t("원문 보기", "Original")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleTranslate(post, "en")}
                        disabled={translation?.loadingTarget === "en"}
                        className={`text-xs font-semibold ${activeLanguage === "en" ? "text-[#0B46E8]" : "text-slate-500"} disabled:opacity-60`}
                      >
                        {translation?.loadingTarget === "en" ? t("영어 번역 중...", "Translating to English...") : t("영어로 번역하기", "Translate to English")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleTranslate(post, "ko")}
                        disabled={translation?.loadingTarget === "ko"}
                        className={`text-xs font-semibold ${activeLanguage === "ko" ? "text-[#0B46E8]" : "text-slate-500"} disabled:opacity-60`}
                      >
                        {translation?.loadingTarget === "ko" ? t("한국어 번역 중...", "Translating to Korean...") : t("한국어로 번역하기", "Translate to Korean")}
                      </button>
                      {translation?.error ? <p className="mt-1 text-xs text-red-500">{translation.error}</p> : null}
                    </div>
                    <div className="mt-4 flex items-center justify-between pt-3 text-sm text-slate-500">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => void handleToggleLike(post)}
                          disabled={Boolean(likeLoadingByPost[post.id])}
                          className={`inline-flex items-center gap-1.5 ${post.likedByMe ? "text-[#DC2626]" : "text-slate-500"} disabled:opacity-60`}
                        >
                          <Heart className={`h-4 w-4 ${post.likedByMe ? "fill-[#DC2626] text-[#DC2626]" : "text-slate-500"}`} />
                          <span>{post.likes}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleToggleComments(post.id)}
                          className={`inline-flex items-center gap-1.5 ${expandedComments[post.id] ? "text-[#0B46E8]" : "text-slate-500"}`}
                        >
                          <MessageCircle className="h-4 w-4 text-slate-500" />
                          <span>{post.comments}</span>
                        </button>
                      </div>
                      <button type="button" className="inline-flex items-center text-slate-600">
                        <Share className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>
                    {expandedComments[post.id] ? (
                      <div className="mt-4 border-l-2 border-slate-200 pl-4">
                        <div className="space-y-2">
                          {(commentsByPost[post.id] ?? []).map((comment) => (
                            <div key={comment.id} className="py-1">
                              <div className="flex items-start gap-2">
                                <div className="relative grid h-7 w-7 shrink-0 place-items-center bg-slate-100 text-[11px] font-bold text-slate-400" style={profileSquircleStyle}>
                                  <CommunitySquircleStroke />
                                  <User className="h-3.5 w-3.5 text-slate-400" weight="regular" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-semibold text-slate-700">{comment.authorName}</p>
                                    <p className="shrink-0 text-[11px] text-slate-500">{formatRelativeTime(comment.createdAt, isKo ? "ko" : "en")}</p>
                                  </div>
                                  {(() => {
                                    const translation = commentTranslations[comment.id];
                                    const activeLanguage = translation?.activeLanguage ?? "original";
                                    const commentBody =
                                      activeLanguage === "ko" && translation?.koBody
                                        ? translation.koBody
                                        : activeLanguage === "en" && translation?.enBody
                                          ? translation.enBody
                                          : comment.body;
                                    return (
                                      <>
                                        <p className="mt-2 text-sm text-slate-700">{commentBody}</p>
                                        <div className="mt-2 flex items-center gap-3">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setCommentTranslations((prev) => ({
                                                ...prev,
                                                [comment.id]: { ...prev[comment.id], activeLanguage: "original", error: undefined }
                                              }))
                                            }
                                            className={`text-xs font-semibold ${activeLanguage === "original" ? "text-[#0B46E8]" : "text-slate-500"}`}
                                          >
                                            {t("원문 보기", "Original")}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => void handleTranslateComment(comment, "en")}
                                            disabled={translation?.loadingTarget === "en"}
                                            className={`text-xs font-semibold ${activeLanguage === "en" ? "text-[#0B46E8]" : "text-slate-500"} disabled:opacity-60`}
                                          >
                                            {translation?.loadingTarget === "en" ? t("영어 번역 중...", "Translating to English...") : t("영어로 번역하기", "Translate to English")}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => void handleTranslateComment(comment, "ko")}
                                            disabled={translation?.loadingTarget === "ko"}
                                            className={`text-xs font-semibold ${activeLanguage === "ko" ? "text-[#0B46E8]" : "text-slate-500"} disabled:opacity-60`}
                                          >
                                            {translation?.loadingTarget === "ko" ? t("한국어 번역 중...", "Translating to Korean...") : t("한국어로 번역하기", "Translate to Korean")}
                                          </button>
                                        </div>
                                        {translation?.error ? <p className="mt-1 text-xs text-red-500">{translation.error}</p> : null}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          ))}
                          {(commentsByPost[post.id] ?? []).length === 0 && !commentLoadingByPost[post.id] ? (
                            <p className="text-xs text-slate-500">{t("아직 댓글이 없습니다.", "No comments yet.")}</p>
                          ) : null}
                        </div>
                        <div className="mt-3 flex items-end gap-2">
                          <textarea
                            value={commentDraftByPost[post.id] ?? ""}
                            onChange={(e) => setCommentDraftByPost((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder={t("댓글을 입력하세요", "Write a comment")}
                            rows={3}
                            className="min-h-[92px] flex-1 resize-y rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-500"
                          />
                          <Button
                            type="button"
                            onClick={() => void handleSubmitComment(post.id)}
                            disabled={commentLoadingByPost[post.id] || !(commentDraftByPost[post.id] ?? "").trim()}
                            className="h-10 rounded-md bg-[#b7ff5a] px-3 text-xs font-semibold text-[#111111] hover:bg-[#a8ee4d] disabled:pointer-events-none disabled:opacity-50"
                          >
                            {t("댓글 달기", "Comment")}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    {index !== posts.length - 1 ? <div className="mt-5 border-b border-slate-200" /> : null}
                  </article>
                    );
                  })()
                ))}
                {!isLoading && posts.length === 0 && !loadError ? (
                  <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-slate-500">
                    {t("표시할 피드가 없습니다.", "No feeds to display.")}
                  </div>
                ) : null}
                {isLoading ? (
                  <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-slate-500">
                    {t("피드를 불러오는 중...", "Loading feeds...")}
                  </div>
                ) : null}
                {loadError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{loadError}</div>
                ) : null}
                {nextCursor ? (
                  <div className="pt-2 text-center">
                    <Button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#0B46E8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0A3FCF] disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isLoadingMore ? t("로딩 중...", "Loading...") : t("더보기", "Load more")}
                    </Button>
                  </div>
                ) : null}
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
      {showFloatingCompose && !isComposeOpen && !editingPost ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30">
          <div className="container">
            <div className="mx-auto flex max-w-4xl justify-end pr-2 md:pr-3">
              <Button
                type="button"
                onClick={() => setIsComposeOpen(true)}
                className="pointer-events-auto h-11 rounded-xl bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)] hover:bg-[#a8ee4d]"
              >
                {t("피드 올리기", "Create Post")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <FeedModal
        open={isComposeOpen}
        title={t("피드 올리기", "Create Post")}
        profilePhoto={profilePhoto}
        showProfile={false}
        category={draftCategory}
        onCategoryChange={setDraftCategory}
        body={draftText}
        onBodyChange={setDraftText}
        bodyPlaceholder={t("어떤 이야기를 나누고 싶으신가요?", "What would you like to talk about?")}
        guideText={draftCategoryGuideText[draftCategory]}
        images={draftImages}
        onAddImages={(files) => void handleDraftImages(files)}
        onRemoveImage={(index) => setDraftImages((prev) => prev.filter((_, i) => i !== index))}
        onClose={() => setIsComposeOpen(false)}
        onSubmit={() => void handlePostSubmit()}
        isSubmitting={isPosting}
        submitLabel={t("피드 올리기", "Create Post")}
        submittingLabel={t("올리는 중...", "Posting...")}
        squircleStyle={profileSquircleStyle}
        draftCategoryOptions={draftCategories.map((item) => ({ key: item.key, label: item.label }))}
        selectedTopicLabel={t("선택 주제", "Selected topic")}
        addImagesLabel={t("이미지 추가", "Add images")}
        cancelLabel={t("취소", "Cancel")}
        attachedImageAlt={t("첨부 이미지", "Attached image")}
        removeImageAriaLabel={t("이미지 삭제", "Remove image")}
      />
      <FeedModal
        open={Boolean(editingPost)}
        title={t("피드 수정", "Edit Post")}
        profilePhoto={profilePhoto}
        category={editingPost?.category ?? "free"}
        onCategoryChange={(next) => setEditingPost((prev) => (prev ? { ...prev, category: next } : prev))}
        body={editingPost?.body ?? ""}
        onBodyChange={(next) => setEditingPost((prev) => (prev ? { ...prev, body: next } : prev))}
        bodyPlaceholder={t("어떤 이야기를 나누고 싶으신가요?", "What would you like to talk about?")}
        guideText={editingPost ? draftCategoryGuideText[editingPost.category] : undefined}
        images={editingPost?.imageUrls ?? []}
        onAddImages={(files) => void handleEditImages(files)}
        onRemoveImage={(index) =>
          setEditingPost((prev) => (prev ? { ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) } : prev))
        }
        onClose={() => setEditingPost(null)}
        onSubmit={() => void handleUpdatePost()}
        isSubmitting={isUpdatingPost}
        submitLabel={t("피드 수정하기", "Update Post")}
        submittingLabel={t("피드 수정 중...", "Updating...")}
        squircleStyle={profileSquircleStyle}
        draftCategoryOptions={draftCategories.map((item) => ({ key: item.key, label: item.label }))}
        selectedTopicLabel={t("선택 주제", "Selected topic")}
        addImagesLabel={t("이미지 추가", "Add images")}
        cancelLabel={t("취소", "Cancel")}
        attachedImageAlt={t("첨부 이미지", "Attached image")}
        removeImageAriaLabel={t("이미지 삭제", "Remove image")}
      />
      <Footer />
    </div>
  );
};
