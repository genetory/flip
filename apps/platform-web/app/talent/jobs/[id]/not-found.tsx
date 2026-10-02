import Link from "next/link";

// 공고 전용 404 경계.
// /talent 구간에는 error.tsx(클라이언트 에러 경계)가 있는데, 그 경계가 notFound() 를 먼저
// 처리해 버려서 루트 not-found 까지 올라가지 못하고 상태 코드가 200(소프트 404)이 됐다.
// 세그먼트 안에 not-found 경계를 두면 404 가 제대로 전달된다.
export default function JobNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-[560px] flex-col justify-center px-5 py-16">
      <h1 className="text-[22px] font-black tracking-[-0.02em] text-[#191F28]">공고를 찾을 수 없어요</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[#4E5968]">
        이 공고는 내려갔거나 주소가 바뀐 것 같아요. 지금 모집 중인 공고를 바로 볼 수 있어요.
      </p>
      <Link
        href="/talent/jobs"
        className="mt-5 inline-flex h-11 w-fit items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white"
      >
        비슷한 공고 보기
      </Link>
    </main>
  );
}
