import { useMemo, useState } from "react";
import { ChevronDown, MessageCircle, Search, Star, X } from "lucide-react";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  type FaqCategory,
  type FaqItem,
} from "../data/supportData";

type FaqSectionProps = {
  onOpenChatbot: (context?: string) => void;
};

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="support-faq-highlight rounded-[2px] bg-[var(--color-amber-subtle)] px-px text-foreground not-italic">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function renderAnswer(answer: string, query: string, isSearching: boolean) {
  return answer.split("\n").map((line, i) => (
    <p key={i}>
      {isSearching ? highlight(line, query) : line}
    </p>
  ));
}

export function FaqSection({ onOpenChatbot }: FaqSectionProps) {
  const [activeCategory, setActiveCategory] = useState<FaqCategory | "인기">("인기");
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isSearching = searchQuery.trim().length > 0;

  const displayedItems: FaqItem[] = useMemo(() => {
    if (isSearching) {
      const q = searchQuery.trim().toLowerCase();
      return FAQ_ITEMS.filter(
        (f) =>
          f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      );
    }
    return activeCategory === "인기"
      ? FAQ_ITEMS.filter((f) => f.popular)
      : FAQ_ITEMS.filter((f) => f.category === activeCategory);
  }, [searchQuery, activeCategory, isSearching]);

  function toggleItem(id: string) {
    setOpenItemId((prev) => (prev === id ? null : id));
  }

  function clearSearch() {
    setSearchQuery("");
    setOpenItemId(null);
  }

  return (
    <div className="support-faq flex flex-1 flex-col">
      {/* Search bar */}
      <div className="support-faq-search-wrap border-b border-border py-3.5">
        <div className="support-faq-search-field flex items-center gap-2 rounded-md border border-border bg-muted px-2.5 transition-[border-color,box-shadow] focus-within:border-[var(--color-accent)] focus-within:shadow-[0_0_0_3px_var(--color-accent-subtle)]">
          <Search size={15} className="support-faq-search-icon shrink-0 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="FAQ 검색"
            className="support-faq-search-input h-9 border-0 bg-transparent px-0 py-0 text-[13px] shadow-none focus-visible:ring-0"
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOpenItemId(null);
            }}
            placeholder="질문이나 키워드를 검색하세요..."
            type="search"
            value={searchQuery}
          />
          {isSearching ? (
            <button
              aria-label="검색 지우기"
              className="support-faq-search-clear flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-transparent p-0 text-muted-foreground hover:text-foreground"
              onClick={clearSearch}
              type="button"
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Category tabs — hidden while searching */}
      {!isSearching ? (
        <div className="support-faq-tabs flex items-center gap-1 overflow-x-auto border-b border-border py-2 [scrollbar-width:none]" role="tablist" aria-label="FAQ 카테고리">
          <button
            role="tab"
            aria-selected={activeCategory === "인기"}
            className={`support-faq-tab inline-flex h-7 items-center gap-1 rounded-sm border px-2.5 text-xs font-medium ${
              activeCategory === "인기"
                ? "active border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                : "border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => {
              setActiveCategory("인기");
              setOpenItemId(null);
            }}
            type="button"
          >
            <Star size={11} aria-hidden="true" />
            인기
          </button>
          {FAQ_CATEGORIES.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              className={`support-faq-tab inline-flex h-7 items-center gap-1 rounded-sm border px-2.5 text-xs font-medium ${
                activeCategory === cat
                  ? "active border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                  : "border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => {
                setActiveCategory(cat);
                setOpenItemId(null);
              }}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>
      ) : null}

      {/* FAQ list / search results */}
      <div className="support-faq-list flex flex-1 flex-col gap-1.5 py-3" role={isSearching ? undefined : "tabpanel"}>
        {isSearching ? (
          <p className="support-faq-results-label mb-1 text-[11px] font-medium text-muted-foreground">
            {displayedItems.length > 0
              ? `"${searchQuery}" 검색 결과 ${displayedItems.length}건`
              : null}
          </p>
        ) : null}

        {displayedItems.length === 0 ? (
          <div className="support-faq-empty flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Search size={28} aria-hidden="true" className="support-faq-empty-icon text-muted-foreground/40" />
            <p className="support-faq-empty-title mt-1 text-sm font-semibold text-foreground">검색 결과가 없습니다</p>
            <p className="support-faq-empty-desc text-[13px] text-muted-foreground">
              다른 키워드로 검색해 보거나 챗봇 상담을 이용해 주세요.
            </p>
            <Button
              className="support-faq-chatbot-btn mt-2 inline-flex h-9 items-center gap-2 rounded-md px-4 text-[13px]"
              onClick={() => onOpenChatbot(searchQuery ? `검색어: ${searchQuery}` : undefined)}
              size="sm"
              type="button"
            >
              <MessageCircle size={14} aria-hidden="true" />
              챗봇으로 문의하기
            </Button>
          </div>
        ) : (
          displayedItems.map((item) => (
            <div
              key={item.id}
              className={`support-faq-item overflow-hidden rounded-md border transition-colors ${openItemId === item.id ? "open border-[var(--color-accent-border)]" : "border-border"}`}
            >
              <button
                aria-expanded={openItemId === item.id}
                className="support-faq-question flex min-h-12 w-full items-center justify-between gap-2.5 bg-transparent px-3.5 py-[13px] text-left text-sm font-semibold leading-[1.45] text-foreground hover:bg-muted"
                onClick={() => toggleItem(item.id)}
                type="button"
              >
                <span className="min-w-0 whitespace-normal">
                  {isSearching
                    ? highlight(item.question, searchQuery)
                    : item.question}
                </span>
                <ChevronDown
                  size={15}
                  aria-hidden="true"
                  className={`support-faq-chevron shrink-0 text-muted-foreground transition-transform ${openItemId === item.id ? " rotated rotate-180" : ""}`}
                />
              </button>
              {openItemId === item.id ? (
                <div className="support-faq-answer flex flex-col gap-2 border-t border-border bg-muted px-3.5 py-3.5" role="region">
                  {renderAnswer(item.answer, searchQuery, isSearching)}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
