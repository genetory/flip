"use client";

import { User } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { Reveal } from "./Reveal";

const mockReviews = [
  { quote: "처음에는 어디서부터 준비해야 할지 몰랐는데, 단계별 가이드가 있어 이력서·자기소개·포트폴리오를 순서대로 정리할 수 있었습니다. 무엇을 먼저 보완해야 하는지 명확해져서 준비 시간이 크게 줄었어요.", by: "김OO · 경영학과", avatar: "/img_profile_0.webp" },
  { quote: "프로필을 60%에서 90%까지 채우는 동안 추천 포지션 수가 실제로 늘어나는 게 보였고, 추천 직무도 제 전공과 관심 분야에 더 맞아졌습니다. 단순 노출이 아니라 정합도가 좋아졌다는 점이 특히 만족스러웠어요.", by: "Tran N. · Marketing", avatar: "/img_profile_1.webp" },
  { quote: "면접 전에 강점/보완점을 한 번에 정리해 주는 피드백이 정말 유용했습니다. 답변 구조를 미리 연습할 수 있어 인터뷰에서 전달력이 좋아졌고, 이전보다 훨씬 자신 있게 커뮤니케이션할 수 있었어요.", by: "이OO · 컴퓨터공학" },
  { quote: "해외 학생 입장에서는 비자, 언어, 근무 가능 일정 등 확인해야 할 정보가 많았는데, 필요한 항목이 한 화면에 정리되어 있어 준비가 훨씬 수월했습니다. 복잡한 부분을 놓치지 않고 체크할 수 있었어요.", by: "A. Rahman · Design", avatar: "/img_profile_0.webp" },
  { quote: "무작정 많이 지원하는 대신, 적합도가 높은 포지션 위주로 집중 지원할 수 있어서 효율이 좋았습니다. 결과적으로 불필요한 지원을 줄이고 인터뷰 전환 가능성이 높은 기회에 시간을 쓸 수 있었어요.", by: "박OO · 데이터사이언스" },
  { quote: "운영팀 응답 속도가 빨라서 진행이 끊기지 않았습니다. 서류 제출부터 면접 조율까지 병목 없이 이어져서 전체 채용 프로세스가 안정적으로 진행됐고, 다음 단계로 넘어가는 체감 속도도 빨랐어요.", by: "S. Kim · Business", avatar: "/img_profile_1.webp" },
  { quote: "기업이 검토하기 좋은 형식으로 프로필이 정리되는 점이 인상적이었습니다. 같은 내용을 제출해도 가독성이 높아져 강점이 더 분명하게 보였고, 피드백을 받아 수정하는 과정도 훨씬 효율적이었습니다.", by: "M. Lee · UX" },
  { quote: "실무 체험 이후 바로 채용 제안으로 이어진 경험이 가장 큰 성과였습니다. 단기 경험이 끝이 아니라 장기 커리어로 연결될 수 있다는 확신을 얻었고, 첫 글로벌 커리어 시작에 큰 전환점이 되었어요.", by: "J. Choi · Product", avatar: "/img_profile_0.webp" },
  { quote: "지원 프로세스가 직관적이라 처음 도전하는 사람도 쉽게 따라갈 수 있습니다. 필요한 단계가 명확하게 보이고 중간에 헷갈릴 지점이 적어, 준비에 대한 심리적 부담이 크게 낮아졌어요.", by: "N. Park · CS" },
  { quote: "비자/언어/직무 적합도를 함께 보는 구조 덕분에 기업과의 초기 대화가 빠르게 진행됐습니다. 기본 조건 확인에 시간을 쓰기보다 실제 역량과 기여 가능성 중심으로 인터뷰를 진행할 수 있었어요.", by: "K. Nguyen · Ops", avatar: "/img_profile_1.webp" },
  { quote: "포트폴리오에서 어떤 부분이 약한지 구체적으로 짚어줘서 수정 방향을 빨리 잡을 수 있었습니다. 막연히 예쁘게 만드는 것보다 평가 포인트 중심으로 보완할 수 있어 결과물이 훨씬 좋아졌어요.", by: "한OO · 디자인" },
  { quote: "관심 포지션 알림이 제때 와서 좋은 공고를 놓치지 않았습니다. 마감 임박 공고도 빠르게 확인해 지원할 수 있었고, 지원 타이밍 관리가 쉬워져 전체 전략을 세우는 데 도움이 많이 됐어요.", by: "R. Singh · Marketing", avatar: "/img_profile_0.webp" },
  { quote: "프로필 완성도가 수치로 보이니 무엇을 우선 보완해야 할지 명확했습니다. 단순 체크리스트가 아니라 실제 매칭 가능성과 연결되어 보여서, 입력 항목 하나하나를 더 전략적으로 관리하게 됐어요.", by: "정OO · 산업공학" },
  { quote: "기업별 포지션 특성과 요구 역량이 잘 정리되어 있어 비교가 쉬웠습니다. 비슷해 보이는 공고도 차이를 빠르게 파악할 수 있어, 제 강점에 맞는 포지션을 선별해 지원하기 좋았어요.", by: "D. Kim · Strategy", avatar: "/img_profile_1.webp" },
  { quote: "합류 이후 필요한 협업 방식과 커뮤니케이션 팁까지 안내받아 초기 적응이 빨랐습니다. 실무 시작 전에 기대치와 역할을 정리해둔 덕분에 팀과의 온보딩도 훨씬 부드럽게 진행됐어요.", by: "Y. Lim · HR" },
  { quote: "지원 전에 매칭 가능성을 먼저 확인할 수 있어 준비 방향을 전략적으로 설계할 수 있었습니다. 어떤 역량을 추가하면 전환율이 높아지는지 보이니, 시간과 노력을 훨씬 효율적으로 배분하게 됐어요.", by: "P. Yoon · Analytics", avatar: "/img_profile_0.webp" },
  { quote: "학생 관점 안내가 친절해서 체크리스트를 따라가기만 해도 준비가 체계적으로 진행됐습니다. 혼자 준비할 때 놓치기 쉬운 항목을 미리 점검할 수 있어 결과적으로 완성도가 높아졌어요.", by: "C. Lee · Media" },
  { quote: "기업 관점 정보까지 함께 보여줘서 어떤 포인트를 강조해야 할지 빠르게 감이 왔습니다. 제출 자료를 상대 관점에서 다듬을 수 있어 인터뷰 대화의 질도 확실히 좋아졌다고 느꼈어요.", by: "M. Kaur · Biz Dev", avatar: "/img_profile_1.webp" },
  { quote: "후기와 사례를 보고 시작했는데 실제 경험도 기대 이상이었습니다. 단순히 공고를 연결해주는 수준을 넘어, 준비와 실행 과정 전반에서 도움을 받아 자신감을 가지고 도전할 수 있었어요.", by: "오OO · 국제학" },
  { quote: "글로벌 커리어를 처음 시작하는 사람에게 진입장벽을 낮춰주는 플랫폼이라고 생각합니다. 필요한 정보를 한 번에 파악하고 단계적으로 준비할 수 있어, 첫 도전의 불안이 크게 줄었습니다.", by: "L. Garcia · IT", avatar: "/img_profile_0.webp" }
];

const stickyColors = ["bg-white", "bg-white", "bg-white", "bg-white"] as const;

const ReviewAvatar = ({ src, alt }: { src?: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);
  const showFallback = !src || hasError;

  if (showFallback) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500">
        <User className="h-3.5 w-3.5" weight="bold" />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-6 w-6 rounded-full object-cover"
      onError={() => setHasError(true)}
    />
  );
};

export const TestimonialsSection = () => {
  const columns = [0, 1, 2, 3].map((col) => mockReviews.filter((_, index) => index % 4 === col));

  return (
    <section id="testimonials" className="bg-[#f6f9ff] py-20">
      <div className="container max-w-[1200px]">
        <Reveal className="mb-20">
          <p className="mb-2 text-sm font-semibold text-[#1D4ED8]">TESTIMONIALS</p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#0B1227] md:text-4xl">선배들의 리얼 후기</h2>
        </Reveal>

        <Reveal y="sm">
          <div className="ml-auto grid max-w-[860px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3 lg:rotate-[5deg]">
            {columns.map((colItems, colIndex) => {
              const directionClass = colIndex === 0 || colIndex === 2 ? "[animation-direction:reverse]" : "";
              return (
                <div key={`col-${colIndex}`} className="group relative h-[440px] overflow-hidden">
                  <div className={`flex animate-[testiMarquee_44s_linear_infinite] flex-col gap-3 group-hover:[animation-play-state:paused] ${directionClass}`}>
                    {[...colItems, ...colItems].map((item, itemIndex) => {
                      return (
                        <article
                          key={`${item.by}-${colIndex}-${itemIndex}`}
                          className={`${stickyColors[colIndex]} h-auto px-4 py-3.5 shadow-[0_20px_34px_-24px_rgba(15,23,42,0.45)]`}
                        >
                          <span className="mb-2 block h-2 w-10 rounded bg-white/80" />
                          <p className="text-[14px] font-normal leading-relaxed text-[#0B1227]">"{item.quote}"</p>
                          <div className="mt-2 flex items-center gap-2">
                            <ReviewAvatar src={item.avatar} alt={item.by} />
                            <p className="text-[10px] font-semibold text-slate-700">{item.by}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
      <style jsx global>{`
        @keyframes testiMarquee {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </section>
  );
};
