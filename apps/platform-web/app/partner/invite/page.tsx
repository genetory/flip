"use client";

// 이메일 팀원 초대 수락 페이지 — 초대 메일 링크(/partner/invite?token=…)가 도착하는 곳.
// 계정이 없으면 여기서 바로 만들고, 있으면 로그인 후 수락한다. 두 경우 모두 이메일
// 소유(초대 메일 수신)를 확인한 것으로 보고 회사에 합류시킨다.
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleNotch, Buildings, SealCheck, WarningCircle } from "@phosphor-icons/react";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { usePlatformT } from "../../../lib/i18n";
import {
  lookupPartnerTeamInvite,
  acceptPartnerTeamInvite,
  registerFromPartnerTeamInvite,
  type PartnerTeamInviteLookup
} from "../../../lib/member-profile-client";

const ROLE_LABEL: Record<PartnerTeamInviteLookup["partnerOrgRole"], string> = {
  OWNER: "소유자",
  ADMIN: "관리자",
  MEMBER: "팀원"
};

const REASON_COPY: Record<string, { title: string; desc: string }> = {
  invalid: { title: "유효하지 않은 초대예요", desc: "링크가 올바르지 않아요. 초대한 분께 다시 요청해주세요." },
  expired: { title: "초대가 만료됐어요", desc: "초대 링크는 7일간 유효해요. 새 초대를 요청해주세요." },
  accepted: { title: "이미 수락된 초대예요", desc: "이 초대는 이미 사용됐어요. 로그인해서 확인해보세요." },
  revoked: { title: "취소된 초대예요", desc: "초대가 취소됐어요. 초대한 분께 다시 요청해주세요." }
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#F5F8FF] px-5 py-10">
      <div className="w-full max-w-[420px] rounded-3xl border border-[#EEF1F5] bg-white p-7 shadow-[0_8px_40px_rgba(11,18,39,0.06)]">{children}</div>
    </main>
  );
}

function InviteInner() {
  const t = usePlatformT();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const { user, isReady, isAuthenticated } = useAuthSession();

  const [status, setStatus] = useState<"loading" | "ready" | "invalid">("loading");
  const [reason, setReason] = useState<string>("invalid");
  const [invite, setInvite] = useState<PartnerTeamInviteLookup | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setReason("invalid");
      return;
    }
    let alive = true;
    lookupPartnerTeamInvite(token)
      .then((r) => {
        if (!alive) return;
        if (r.ok) {
          setInvite(r.data);
          setStatus("ready");
        } else {
          setReason(r.reason);
          setStatus("invalid");
        }
      })
      .catch(() => {
        if (alive) {
          setStatus("invalid");
          setReason("invalid");
        }
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const selfHref = `/partner/invite?token=${encodeURIComponent(token)}`;

  function accept() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    acceptPartnerTeamInvite(token)
      .then(() => {
        window.location.href = "/partner/home";
      })
      .catch((e: unknown) => {
        setErr((e as { message?: string })?.message ?? t("합류에 실패했어요.", "Failed to join.", "加入失败。", "Tham gia thất bại.", "参加に失敗しました。", "Gagal bergabung."));
        setBusy(false);
      });
  }

  function registerAndJoin() {
    if (busy) return;
    if (password.length < 8) {
      setErr(t("비밀번호는 8자 이상이어야 해요.", "Password must be at least 8 characters.", "密码至少需 8 位。", "Mật khẩu phải có ít nhất 8 ký tự.", "パスワードは8文字以上必要です。", "Kata sandi minimal 8 karakter."));
      return;
    }
    setBusy(true);
    setErr(null);
    registerFromPartnerTeamInvite(token, name, password)
      .then((r) => {
        if (r.ok) {
          window.location.href = "/partner/home";
        } else {
          setErr(r.message);
          setBusy(false);
        }
      })
      .catch(() => {
        setErr(t("합류에 실패했어요.", "Failed to join.", "加入失败。", "Tham gia thất bại.", "参加に失敗しました。", "Gagal bergabung."));
        setBusy(false);
      });
  }

  if (status === "loading" || (status === "ready" && !isReady)) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-[#8B95A1]">
          <CircleNotch className="h-7 w-7 animate-spin" weight="bold" />
          <p className="text-[13.5px]">{t("초대를 확인하고 있어요…", "Checking your invitation…", "正在确认邀请…", "Đang kiểm tra lời mời…", "招待を確認しています…", "Memeriksa undangan…")}</p>
        </div>
      </Shell>
    );
  }

  if (status === "invalid" || !invite) {
    const copy = REASON_COPY[reason] ?? REASON_COPY.invalid;
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDECEE] text-[#F04452]"><WarningCircle className="h-6 w-6" weight="fill" /></span>
          <h1 className="text-[17px] font-black tracking-[-0.02em] text-[#0B1227]">{copy.title}</h1>
          <p className="break-keep text-[13.5px] leading-relaxed text-[#4E5968]">{copy.desc}</p>
          <Link href="/partner/login" className="mt-2 inline-flex items-center justify-center rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("파트너 로그인", "Partner sign in", "合作伙伴登录", "Đăng nhập đối tác", "パートナーログイン", "Masuk partner")}</Link>
        </div>
      </Shell>
    );
  }

  const roleLabel = ROLE_LABEL[invite.partnerOrgRole];
  const loggedInMatches = isAuthenticated && (user?.email ?? "").toLowerCase() === invite.email.toLowerCase();
  const loggedInDifferent = isAuthenticated && !loggedInMatches;

  return (
    <Shell>
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B46E8] text-white"><Buildings className="h-7 w-7" weight="fill" /></span>
        <p className="mt-1 text-[12.5px] font-bold text-[#0B46E8]">{invite.inviterName ? t(`${invite.inviterName}님의 초대`, `Invitation from ${invite.inviterName}`, `${invite.inviterName} 的邀请`, `Lời mời từ ${invite.inviterName}`, `${invite.inviterName}さんからの招待`, `Undangan dari ${invite.inviterName}`) : t("팀 초대", "Team invitation", "团队邀请", "Lời mời nhóm", "チーム招待", "Undangan tim")}</p>
        <h1 className="break-keep text-[19px] font-black leading-[1.3] tracking-[-0.02em] text-[#0B1227]">
          {t(`${invite.orgName} 팀에\n합류하도록 초대받았어요`, `You've been invited to join\nthe ${invite.orgName} team`, `您受邀加入\n${invite.orgName} 团队`, `Bạn được mời tham gia\nnhóm ${invite.orgName}`, `${invite.orgName} チームへの\n参加に招待されました`, `Anda diundang bergabung\ndengan tim ${invite.orgName}`).split("\n").map((line, i) => (
            <span key={i}>{i > 0 ? <br /> : null}{line}</span>
          ))}
        </h1>
        <p className="mt-1 text-[13px] text-[#8B95A1]">{invite.email} · {t(`권한 ${roleLabel}`, `Role: ${roleLabel}`, `权限 ${roleLabel}`, `Quyền ${roleLabel}`, `権限 ${roleLabel}`, `Peran ${roleLabel}`)}</p>
      </div>

      <div className="mt-6">
        {loggedInDifferent ? (
          // 다른 계정으로 로그인된 상태 — 초대받은 이메일 계정으로 로그인 유도.
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 rounded-xl bg-[#FFF3E6] p-3.5 text-[#8a5a12]">
              <WarningCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E8890C]" weight="fill" />
              <p className="break-keep text-[12.5px] leading-relaxed">
                {t("지금", "You're currently signed in as", "您当前登录的账户是", "Bạn đang đăng nhập bằng", "現在", "Anda saat ini masuk sebagai")} <b>{user?.email}</b> {t("계정으로 로그인되어 있어요. 초대받은", "To join, sign in with the invited account:", "。请使用受邀账户登录才能加入：", ". Hãy đăng nhập bằng tài khoản được mời để tham gia:", "でログイン中です。参加するには招待された", "Untuk bergabung, masuk dengan akun yang diundang:")} <b>{invite.email}</b> {t("계정으로 로그인해야 합류할 수 있어요.", "", "", "", "アカウントでログインしてください。", "")}
              </p>
            </div>
            <Link href={`/partner/login?next=${encodeURIComponent(selfHref)}`} className="inline-flex items-center justify-center rounded-xl bg-[#0B46E8] px-4 py-3 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("다른 계정으로 로그인", "Sign in with another account", "使用其他账户登录", "Đăng nhập bằng tài khoản khác", "別のアカウントでログイン", "Masuk dengan akun lain")}</Link>
          </div>
        ) : loggedInMatches ? (
          // 초대 이메일과 같은 계정으로 로그인됨 — 바로 합류.
          <div className="flex flex-col gap-3">
            <button type="button" onClick={accept} disabled={busy} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
              {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <SealCheck className="h-4 w-4" weight="fill" />}
              {busy ? t("합류하는 중…", "Joining…", "加入中…", "Đang tham gia…", "参加中…", "Bergabung…") : t("합류하기", "Join", "加入", "Tham gia", "参加する", "Gabung")}
            </button>
            {err ? <p className="text-center text-[12.5px] font-semibold text-[#F04452]">{err}</p> : null}
          </div>
        ) : invite.accountExists ? (
          // 계정은 있으나 로그인 안 됨 — 로그인 후 자동으로 이 페이지로 복귀해 수락.
          <div className="flex flex-col gap-3">
            <Link href={`/partner/login?next=${encodeURIComponent(selfHref)}`} className="inline-flex items-center justify-center rounded-xl bg-[#0B46E8] px-4 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("로그인하고 합류하기", "Sign in and join", "登录并加入", "Đăng nhập và tham gia", "ログインして参加", "Masuk dan gabung")}</Link>
            <p className="text-center text-[12px] text-[#8B95A1]">{t("이미 가입된 이메일이에요. 로그인하면 바로 합류돼요.", "This email is already registered. Sign in to join right away.", "该邮箱已注册，登录后即可加入。", "Email này đã đăng ký. Đăng nhập để tham gia ngay.", "登録済みのメールです。ログインすればすぐ参加できます。", "Email ini sudah terdaftar. Masuk untuk langsung bergabung.")}</p>
          </div>
        ) : (
          // 계정 없음 — 이 링크에서 바로 계정 생성 후 합류.
          <div className="flex flex-col gap-2.5">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">{t("이름", "Name", "姓名", "Tên", "名前", "Nama")}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("이름(선택)", "Name (optional)", "姓名（可选）", "Tên (tùy chọn)", "名前（任意）", "Nama (opsional)")} className="w-full rounded-xl bg-[#F5F6F8] px-3.5 py-3 text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:ring-2 focus:ring-[#0B46E8]/30" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">{t("비밀번호", "Password", "密码", "Mật khẩu", "パスワード", "Kata sandi")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") registerAndJoin(); }} placeholder={t("8자 이상", "8+ characters", "至少 8 位", "8+ ký tự", "8文字以上", "Min. 8 karakter")} className="w-full rounded-xl bg-[#F5F6F8] px-3.5 py-3 text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:ring-2 focus:ring-[#0B46E8]/30" />
            </div>
            <button type="button" onClick={registerAndJoin} disabled={busy || password.length < 8} className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
              {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}
              {busy ? t("합류하는 중…", "Joining…", "加入中…", "Đang tham gia…", "参加中…", "Bergabung…") : t("가입하고 합류하기", "Sign up and join", "注册并加入", "Đăng ký và tham gia", "登録して参加", "Daftar dan gabung")}
            </button>
            {err ? <p className="text-center text-[12.5px] font-semibold text-[#F04452]">{err}</p> : null}
            <p className="mt-1 break-keep text-center text-[11.5px] leading-relaxed text-[#B0B8C1]">{t("가입하면 이용약관과 개인정보처리방침에 동의하는 것으로 간주돼요.", "By signing up, you agree to the Terms of Service and Privacy Policy.", "注册即表示您同意服务条款和隐私政策。", "Khi đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.", "登録すると利用規約とプライバシーポリシーに同意したものとみなされます。", "Dengan mendaftar, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi.")}</p>
          </div>
        )}
      </div>
    </Shell>
  );
}

function InviteFallback() {
  const t = usePlatformT();
  return <Shell><div className="py-8 text-center text-[13.5px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div></Shell>;
}

export default function PartnerInvitePage() {
  return (
    <Suspense fallback={<InviteFallback />}>
      <InviteInner />
    </Suspense>
  );
}
