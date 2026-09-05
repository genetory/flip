"use client";

// Career Launch 전용 GNB — partner/talent 헤더와 동일한 결(흰 배경·로고+배지 좌측,
// 중앙 주차/결과물 네비, 우측 알림·프로필). 모바일은 햄버거 메뉴.
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";
import { trackCareerFunnel } from "../../lib/analytics";
import { LaunchNotificationBell } from "./LaunchNotificationBell";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { getStoredProfilePhoto, PROFILE_PHOTO_CHANGED_EVENT } from "../../lib/profile-media";

export function CareerLaunchHeader() {
  const t = useLaunchT();
  const { user } = useAuthSession();
  const pathname = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = useState(false);

  // 경로 바뀌면 모바일 메뉴 닫기.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // 최상단(scrollY 0)에선 배경 없이 투명, 스크롤되면 프로스티드 배경이 나타나게.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll(); // 진입 시 초기값(새로고침·앵커 이동 대비)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const name = user?.name?.trim() || user?.email || t("학생", "Student", "学生", "Sinh viên", "学生", "Siswa");

  // 계정 프로필 사진 — talent/partner GNB와 동일 소스.
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setProfilePhoto(user ? (user.profileImageUrl ?? getStoredProfilePhoto(user.id)) : null);
    read();
    if (typeof window === "undefined") return;
    window.addEventListener(PROFILE_PHOTO_CHANGED_EVENT, read);
    return () => window.removeEventListener(PROFILE_PHOTO_CHANGED_EVENT, read);
  }, [user?.id, user?.profileImageUrl]);

  // UX Phase 2 정보구조 — 기존 URL을 유지하며 메뉴 라벨/매핑만 재편.
  // 홈 / 4주 프로그램 / 나의 결과물 / 면접 오답노트. (나의 성장 상세는 UX Phase 3)
  const nav = [
    { key: "home", href: "/career-launch/dashboard", label: t("홈", "Home", "首页", "Trang chủ", "ホーム", "Beranda") },
    { key: "program", href: "/career-launch/week/1", label: t("4주 프로그램", "4-week program", "4周项目", "Chương trình 4 tuần", "4週間プログラム", "Program 4 minggu") },
    { key: "artifacts", href: "/career-launch/deliverables", label: t("나의 결과물", "My deliverables", "我的成果", "Kết quả của tôi", "私の成果物", "Hasil saya") },
    { key: "corrections", href: "/career-launch/corrections", label: t("면접 오답노트", "Interview notes", "面试错题本", "Sổ sửa lỗi PV", "面接復習ノート", "Catatan wawancara") },
    { key: "growth", href: "/career-launch/growth", label: t("나의 성장", "My growth", "我的成长", "Phát triển", "私の成長", "Pertumbuhan") },
    // 커리어 프로필(패스포트·경험은행·점수) — 홈에서 상세를 뺀 대신 여기서 접근한다.
    { key: "profile", href: "/career-launch/profile", label: t("프로필", "Profile", "档案", "Hồ sơ", "プロフィール", "Profil") }
  ];
  // "4주 프로그램"은 주차 상세(week/N) 전체를 활성 범위로 본다.
  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    if (href === "/career-launch/week/1") return pathname.startsWith("/career-launch/week/");
    return pathname === href;
  };
  const onNav = (key: string) => trackCareerFunnel("career_navigation_clicked", { destination: key });

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 ${menuOpen || scrolled ? "border-b border-[#EEF1F5]/60 bg-white/55 backdrop-blur-md supports-[backdrop-filter]:bg-white/55" : "border-b border-transparent bg-transparent"}`}>
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <div className="flex items-center gap-1.5">
          {/* 모바일 햄버거 */}
          {user ? (
            <button
              type="button"
              aria-label={t("메뉴", "Menu", "菜单", "Menu", "メニュー", "Menu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-2xl text-[#4E5968] transition hover:bg-[#F6F8FB] md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </button>
          ) : null}
          <Link href="/career-launch/dashboard" aria-label="Career Launch" className="flex items-center gap-2">
            <Image src="/img_logo.webp" alt="" width={72} height={24} className="h-5 w-auto" priority />
            <span className="hidden rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8] sm:inline">Career Launch</span>
          </Link>
        </div>

        {/* 중앙 네비(데스크톱) — 주차 + 결과물 */}
        {user ? (
          <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onNav(item.key)}
                  className={`rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                    active ? "bg-[#EDF1FD] text-[#0B46E8]" : "text-[#4E5968] hover:bg-[#F6F8FB] hover:text-[#191F28]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        {user ? (
          <div className="flex items-center gap-1.5">
            <LaunchNotificationBell />
            <Link
              href="/career-launch/settings"
              aria-label={t("내 설정", "My settings", "我的设置", "Cài đặt của tôi", "設定", "Pengaturan")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition hover:bg-[#F6F8FB]"
            >
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#F2F4F6] text-[12px] font-bold text-[#4E5968]">
                {profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span aria-hidden>{name.charAt(0).toUpperCase()}</span>
                )}
              </span>
            </Link>
            <LanguageSwitcher />
          </div>
        ) : (
          <LanguageSwitcher />
        )}
      </div>

      {/* 모바일 메뉴(햄버거) */}
      {user && menuOpen ? (
        <nav aria-label={t("주요 메뉴", "Main menu", "主菜单", "Menu chính", "メインメニュー", "Menu utama")} className="border-t border-[#EEF1F5]/60 bg-white/85 backdrop-blur-md px-3 py-2 md:hidden">
          <ul className="flex flex-col">
            {nav.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      onNav(item.key);
                      setMenuOpen(false);
                    }}
                    className={`flex items-center rounded-xl px-3 py-3 text-[15px] font-semibold transition ${
                      active ? "bg-[#EDF1FD] text-[#0B46E8]" : "text-[#4E5968] hover:bg-[#F6F8FB]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
