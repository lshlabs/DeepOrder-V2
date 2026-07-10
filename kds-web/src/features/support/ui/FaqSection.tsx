import { useMemo, useState } from "react";
import { MessageCircle, Search, Star, X } from "lucide-react";

import { EmptyState } from "@/components/blocks";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded-sm bg-warning/15 px-0.5 text-foreground">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function FaqSection({ onOpenChatbot }: FaqSectionProps) {
  const [activeCategory, setActiveCategory] = useState<FaqCategory | "인기">("인기");
  const [openItemId, setOpenItemId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.trim();
  const isSearching = normalizedQuery.length > 0;

  const displayedItems: FaqItem[] = useMemo(() => {
    if (isSearching) {
      const query = normalizedQuery.toLowerCase();
      return FAQ_ITEMS.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query),
      );
    }

    return activeCategory === "인기"
      ? FAQ_ITEMS.filter((item) => item.popular)
      : FAQ_ITEMS.filter((item) => item.category === activeCategory);
  }, [activeCategory, isSearching, normalizedQuery]);

  function selectCategory(category: FaqCategory | "인기") {
    setActiveCategory(category);
    setOpenItemId("");
  }

  function clearSearch() {
    setSearchQuery("");
    setOpenItemId("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b py-4">
        <div className="relative max-w-2xl">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="FAQ 검색"
            className="h-10 bg-card pl-9 pr-10"
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setOpenItemId("");
            }}
            placeholder="질문이나 키워드를 검색하세요..."
            type="search"
            value={searchQuery}
          />
          {isSearching ? (
            <Button
              aria-label="검색 지우기"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              onClick={clearSearch}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </div>

      {!isSearching ? (
        <div
          className="flex gap-1 overflow-x-auto border-b py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="FAQ 카테고리"
        >
          {["인기", ...FAQ_CATEGORIES].map((category) => {
            const selected = activeCategory === category;
            return (
              <Button
                key={category}
                aria-selected={selected}
                className="shrink-0 gap-1"
                onClick={() => selectCategory(category as FaqCategory | "인기")}
                role="tab"
                size="sm"
                type="button"
                variant={selected ? "secondary" : "ghost"}
              >
                {category === "인기" ? <Star className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                {category}
              </Button>
            );
          })}
        </div>
      ) : null}

      <div className="py-3" role={isSearching ? undefined : "tabpanel"}>
        {isSearching && displayedItems.length > 0 ? (
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            “{normalizedQuery}” 검색 결과 {displayedItems.length}건
          </p>
        ) : null}

        {displayedItems.length === 0 ? (
          <EmptyState
            icon={<Search className="h-7 w-7" aria-hidden="true" />}
            title="검색 결과가 없습니다"
            description="다른 키워드로 검색해 보거나 챗봇 상담을 이용해 주세요."
            action={
              <Button onClick={() => onOpenChatbot(`검색어: ${normalizedQuery}`)} type="button">
                <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                챗봇으로 문의하기
              </Button>
            }
          />
        ) : (
          <Accordion
            className="space-y-2"
            collapsible
            onValueChange={setOpenItemId}
            type="single"
            value={openItemId}
          >
            {displayedItems.map((item) => (
              <AccordionItem
                key={item.id}
                className={cn(
                  "rounded-lg border bg-card px-4",
                  openItemId === item.id && "border-primary/40",
                )}
                value={item.id}
              >
                <AccordionTrigger className="min-h-12 py-3 text-sm font-semibold hover:no-underline">
                  <span className="pr-3">
                    {isSearching ? highlight(item.question, normalizedQuery) : item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 border-t pt-3 leading-6 text-muted-foreground">
                  {item.answer.split("\n").map((line, index) => (
                    <p key={`${item.id}-${index}`}>
                      {isSearching ? highlight(line, normalizedQuery) : line}
                    </p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
