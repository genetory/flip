"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Heart, ImagePlus, MessageCircle, Search, Share } from "lucide-react";
import { DotsThree, User } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { getStoredProfilePhoto } from "../../lib/profile-media";
import { readAccessToken } from "../../lib/auth-client";

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

const categories: { key: CategoryKey; label: string; desc: string }[] = [
  {
    key: "all",
    label: "전체",
    desc: "모든 카테고리 피드를 한 번에 확인할 수 있어요."
  },
  {
    key: "free",
    label: "자유 소통",
    desc: "잡담, 친구 찾기, 일상 공유, 고민"
  },
  {
    key: "career",
    label: "커리어/취업",
    desc: "포지션, 이력서, 면접, 합격 후기, 회사 이야기"
  },
  {
    key: "help",
    label: "질문/도움요청",
    desc: "한국 생활, 비자, 서류, 학교, 행정 관련 질문"
  }
];
const draftCategories = categories.filter(
  (category): category is { key: Exclude<CategoryKey, "all">; label: string; desc: string } => category.key !== "all"
);

const COMMUNITY_PAGE_SIZE = 20;
const COMMUNITY_TRANSLATION_CACHE_KEY = "community_translation_cache_v1";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function formatRelativeTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}

export const CommunityPage = () => {
  const { user } = useAuthSession();
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
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<EditingPostState | null>(null);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const activeCategoryMeta = categories.find((category) => category.key === activeCategory) ?? categories[0];
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
        throw new Error(payload.message ?? "피드를 불러오지 못했습니다.");
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
        setLoadError(error instanceof Error ? error.message : "피드를 불러오지 못했습니다.");
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
      setLoadError(error instanceof Error ? error.message : "더보기 로딩에 실패했습니다.");
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
            reader.onerror = () => reject(new Error("이미지 로드 실패"));
            reader.readAsDataURL(file);
          })
      )
    );
    setDraftImages((prev) => [...prev, ...nextImages.filter((item) => item.length > 0)]);
  }, [draftImages.length]);

  const handleToggleLike = useCallback(async (post: Post) => {
    if (!user) {
      setLoadError("로그인 후 좋아요를 사용할 수 있습니다.");
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
        throw new Error(payload.message ?? "좋아요 처리에 실패했습니다.");
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
      setLoadError(error instanceof Error ? error.message : "좋아요 처리에 실패했습니다.");
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
        throw new Error(payload.message ?? "댓글을 불러오지 못했습니다.");
      }
      setCommentsByPost((prev) => ({ ...prev, [postId]: payload.items ?? [] }));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "댓글을 불러오지 못했습니다.");
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
      setLoadError("로그인 후 댓글을 작성할 수 있습니다.");
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
        throw new Error(payload.message ?? "댓글 작성에 실패했습니다.");
      }
      setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), payload.item as PostComment] }));
      setCommentDraftByPost((prev) => ({ ...prev, [postId]: "" }));
      if (typeof payload.commentCount === "number") {
        setPosts((prev) => prev.map((item) => (item.id === postId ? { ...item, comments: payload.commentCount as number } : item)));
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "댓글 작성에 실패했습니다.");
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
        throw new Error(payload.message ?? "번역에 실패했습니다.");
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
          error: error instanceof Error ? error.message : "번역에 실패했습니다."
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
        throw new Error("로그인 후 피드를 올릴 수 있습니다.");
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
        throw new Error(payload.message ?? "피드 등록에 실패했습니다.");
      }
      setPosts((prev) => [payload.item as Post, ...prev]);
      setDraftText("");
      setDraftImages([]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "피드 등록에 실패했습니다.");
    } finally {
      setIsPosting(false);
    }
  }, [draftCategory, draftImages, draftText, isPosting]);

  const handleDeletePost = useCallback(async (post: Post) => {
    const ok = window.confirm("이 글을 삭제할까요?");
    if (!ok) return;
    try {
      const token = readAccessToken();
      if (!token) throw new Error("로그인이 필요합니다.");
      const response = await fetch(`${getApiBaseUrl()}/community/posts/${encodeURIComponent(post.id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || payload.ok !== true) {
        throw new Error(payload.message ?? "삭제에 실패했습니다.");
      }
      setPosts((prev) => prev.filter((item) => item.id !== post.id));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "삭제에 실패했습니다.");
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
      if (!token) throw new Error("로그인이 필요합니다.");
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
        throw new Error(payload.message ?? "수정에 실패했습니다.");
      }
      setPosts((prev) => prev.map((item) => (item.id === payload.item!.id ? payload.item! : item)));
      setEditingPost(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "수정에 실패했습니다.");
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
            reader.onerror = () => reject(new Error("이미지 로드 실패"));
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
        throw new Error(titlePayload.message ?? bodyPayload.message ?? "번역에 실패했습니다.");
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
          error: error instanceof Error ? error.message : "번역에 실패했습니다."
        }
      }));
    }
  }, [translations]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="pb-20">
        <section className="bg-gradient-to-b from-muted/40 to-background">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-4xl">
              <section>
                <h1 className="font-display text-3xl font-bold tracking-tight text-black">커뮤니티</h1>
                <div className="mt-4 relative overflow-hidden rounded-2xl bg-muted">
                  <Image
                    src="/img_community_hero.webp"
                    alt="커뮤니티 피드 배너"
                    width={1680}
                    height={945}
                    priority
                    className="h-[180px] w-full object-cover md:h-[220px]"
                  />
                </div>
                <div className="mt-8 rounded-2xl border border-border bg-card px-3 py-2 md:px-4 md:py-2.5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplySearch();
                          }
                        }}
                        placeholder="피드 검색"
                        className="h-11 w-full rounded-md border-0 bg-transparent pl-11 text-base outline-none"
                      />
                    </div>
                    <Button variant="dark" size="lg" className="h-11" type="button" onClick={handleApplySearch}>
                      검색
                    </Button>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
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
                          className={`text-base ${
                            isActive ? "font-extrabold text-[#0B46E8]" : "font-bold text-[#0B1227]"
                          }`}
                        >
                          {category.label}
                        </p>
                        <span
                          className={`mt-1 block h-[2px] w-full transition-colors ${
                            isActive ? "bg-[#0B46E8]" : "bg-transparent"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-sm text-slate-600">{activeCategoryMeta.desc}</p>
              </section>

              <section className="mt-6">
                <article className="rounded-2xl border border-border bg-white p-4 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.25)]">
                  <div className="flex items-start gap-3">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="My profile" className="h-10 w-10 shrink-0 rounded-[38%] border border-slate-200 object-cover" />
                    ) : (
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[38%] border border-slate-200 bg-slate-100 text-slate-400">
                        <User className="h-5 w-5" weight="regular" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {draftCategories.map((category) => {
                            const isActive = draftCategory === category.key;
                            return (
                              <button
                                key={`draft-${category.key}`}
                                type="button"
                                onClick={() => setDraftCategory(category.key)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                  isActive
                                    ? "bg-[#DBEAFE] text-[#0B46E8]"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {category.label}
                              </button>
                            );
                          })}
                      </div>
                      <p className="mb-5 text-xs font-medium text-slate-500">
                        {categories.find((category) => category.key === draftCategory)?.label ?? "카테고리"}에 대한 피드를 작성 중입니다.
                      </p>
                      <textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        placeholder="어떤 이야기를 나누고 싶으신가요?"
                        className="min-h-[132px] w-full resize-y rounded-2xl bg-[#F3F4F6] px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-500"
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                          <ImagePlus className="h-4 w-4" />
                          이미지 추가 ({draftImages.length}/5)
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => void handleDraftImages(e.target.files)}
                          />
                        </label>
                        <Button
                          type="button"
                          onClick={() => void handlePostSubmit()}
                          disabled={draftText.trim().length === 0 || isPosting}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-[#0B46E8] text-white hover:bg-[#0A3FCF] px-4 py-2 h-10 text-sm"
                        >
                          {isPosting ? "올리는 중..." : "피드 올리기"}
                        </Button>
                      </div>
                      {draftImages.length > 0 ? (
                        <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-5">
                          {draftImages.map((src, index) => (
                            <div key={`${src.slice(0, 24)}-${index}`} className="relative">
                              <img src={src} alt={`첨부 이미지 ${index + 1}`} className="h-20 w-full rounded-md object-cover" />
                              <button
                                type="button"
                                onClick={() => setDraftImages((prev) => prev.filter((_, i) => i !== index))}
                                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                              >
                                삭제
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
                <div className="mt-8 flex justify-end">
                  <div className="inline-flex items-center text-sm">
                    <button
                      type="button"
                      onClick={() => setSortBy("latest")}
                      className={sortBy === "latest" ? "font-bold text-[#0B46E8]" : "font-medium text-slate-500"}
                    >
                      최신순
                    </button>
                    <span className="px-2 text-slate-400">|</span>
                    <button
                      type="button"
                      onClick={() => setSortBy("popular")}
                      className={sortBy === "popular" ? "font-bold text-[#0B46E8]" : "font-medium text-slate-500"}
                    >
                      인기순
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                {posts.map((post) => (
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
                    className="rounded-2xl border border-border bg-white p-5 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.25)]"
                  >
                    <div className="mb-3 flex items-start gap-3">
                      {isMyPost && profilePhoto ? (
                        <img src={profilePhoto} alt="My profile" className="h-10 w-10 shrink-0 rounded-[38%] border border-slate-200 object-cover" />
                      ) : (
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[38%] border border-slate-200 bg-slate-100 text-slate-400">
                          <User className="h-5 w-5" weight="regular" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="truncate text-base font-extrabold leading-tight text-[#0B1227]">{displayAuthor}</p>
                        <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{formatRelativeTime(post.createdAt)}</p>
                      </div>
                      <div className="relative ml-auto">
                        <button
                          type="button"
                          onClick={() => setActivePostMenuId((prev) => (prev === post.id ? null : post.id))}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500"
                          aria-label="더보기"
                        >
                          <DotsThree className="h-4 w-4" weight="bold" />
                        </button>
                        {activePostMenuId === post.id ? (
                          <div className="absolute right-0 top-9 z-20 min-w-[108px] rounded-md border border-slate-200 bg-white py-1 shadow-md">
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
                                  수정하기
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeletePost(post)}
                                  className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  삭제하기
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActivePostMenuId(null)}
                                className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                신고하기
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
                            alt={`피드 이미지 ${index + 1}`}
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
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{postBody}</p>
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
                        원문 보기
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleTranslate(post, "en")}
                        disabled={translation?.loadingTarget === "en"}
                        className={`text-xs font-semibold ${activeLanguage === "en" ? "text-[#0B46E8]" : "text-slate-500"} disabled:opacity-60`}
                      >
                        {translation?.loadingTarget === "en" ? "영어 번역 중..." : "영어로 번역하기"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleTranslate(post, "ko")}
                        disabled={translation?.loadingTarget === "ko"}
                        className={`text-xs font-semibold ${activeLanguage === "ko" ? "text-[#0B46E8]" : "text-slate-500"} disabled:opacity-60`}
                      >
                        {translation?.loadingTarget === "ko" ? "한국어 번역 중..." : "한국어로 번역하기"}
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
                                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-[38%] border border-slate-200 bg-[#DBEAFE] text-[11px] font-bold text-[#1D4ED8]">
                                  <User className="h-3.5 w-3.5 text-slate-400" weight="regular" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-semibold text-slate-700">{comment.authorName}</p>
                                    <p className="shrink-0 text-[11px] text-slate-500">{formatRelativeTime(comment.createdAt)}</p>
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
                                            원문 보기
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => void handleTranslateComment(comment, "en")}
                                            disabled={translation?.loadingTarget === "en"}
                                            className={`text-xs font-semibold ${activeLanguage === "en" ? "text-[#0B46E8]" : "text-slate-500"} disabled:opacity-60`}
                                          >
                                            {translation?.loadingTarget === "en" ? "영어 번역 중..." : "영어로 번역하기"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => void handleTranslateComment(comment, "ko")}
                                            disabled={translation?.loadingTarget === "ko"}
                                            className={`text-xs font-semibold ${activeLanguage === "ko" ? "text-[#0B46E8]" : "text-slate-500"} disabled:opacity-60`}
                                          >
                                            {translation?.loadingTarget === "ko" ? "한국어 번역 중..." : "한국어로 번역하기"}
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
                            <p className="text-xs text-slate-500">아직 댓글이 없습니다.</p>
                          ) : null}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            value={commentDraftByPost[post.id] ?? ""}
                            onChange={(e) => setCommentDraftByPost((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder="댓글을 입력하세요"
                            className="h-9 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none"
                          />
                          <Button
                            type="button"
                            onClick={() => void handleSubmitComment(post.id)}
                            disabled={commentLoadingByPost[post.id] || !(commentDraftByPost[post.id] ?? "").trim()}
                            className="h-9 rounded-md bg-[#0B46E8] px-3 text-xs font-semibold text-white hover:bg-[#0A3FCF] disabled:pointer-events-none disabled:opacity-50"
                          >
                            등록
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                    );
                  })()
                ))}
                {!isLoading && posts.length === 0 && !loadError ? (
                  <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-slate-500">
                    표시할 피드가 없습니다.
                  </div>
                ) : null}
                {isLoading ? (
                  <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-slate-500">
                    피드를 불러오는 중...
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
                      {isLoadingMore ? "로딩 중..." : "더보기"}
                    </Button>
                  </div>
                ) : null}
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
      {editingPost ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
            <p className="text-base font-bold text-[#0B1227]">피드 수정</p>
            <div className="mt-3 mb-3 flex flex-wrap items-center gap-2">
              {draftCategories.map((category) => {
                const isActive = editingPost.category === category.key;
                return (
                  <button
                    key={`edit-${category.key}`}
                    type="button"
                    onClick={() => setEditingPost((prev) => (prev ? { ...prev, category: category.key } : prev))}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive ? "bg-[#DBEAFE] text-[#0B46E8]" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
            <textarea
              value={editingPost.body}
              onChange={(e) => setEditingPost((prev) => (prev ? { ...prev, body: e.target.value } : prev))}
              className="min-h-[180px] w-full resize-y rounded-2xl bg-[#F3F4F6] px-4 py-3 text-sm text-slate-700 outline-none"
            />
            <div className="mt-3 flex items-center justify-between">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                <ImagePlus className="h-4 w-4" />
                이미지 추가 ({editingPost.imageUrls.length}/5)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void handleEditImages(e.target.files)}
                />
              </label>
            </div>
            {editingPost.imageUrls.length > 0 ? (
              <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-5">
                {editingPost.imageUrls.map((src, index) => (
                  <div key={`${src.slice(0, 24)}-edit-${index}`} className="relative">
                    <img src={src} alt={`수정 이미지 ${index + 1}`} className="h-20 w-full rounded-md object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setEditingPost((prev) =>
                          prev ? { ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) } : prev
                        )
                      }
                      className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingPost(null)} disabled={isUpdatingPost}>
                취소
              </Button>
              <Button
                type="button"
                onClick={() => void handleUpdatePost()}
                disabled={isUpdatingPost || !editingPost.body.trim()}
                className="bg-[#0B46E8] text-white hover:bg-[#0A3FCF]"
              >
                {isUpdatingPost ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
};
