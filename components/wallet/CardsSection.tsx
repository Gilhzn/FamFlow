"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, Plus } from "lucide-react";
import { useFam, useCurrentMember } from "@/lib/store";
import CardVisual from "./CardVisual";
import AddCardModal from "./AddCardModal";

export default function CardsSection() {
  const me = useCurrentMember();
  const cards = useFam((s) => s.cards);
  const members = useFam((s) => s.members);
  const removeCard = useFam((s) => s.removeCard);
  const [adding, setAdding] = useState(false);

  const isAdmin = me?.role === "admin";

  const visible = useMemo(() => {
    if (!me) return [];
    const list = isAdmin ? cards : cards.filter((c) => c.memberId === me.id);
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [cards, me, isAdmin]);

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";

  if (!me) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard size={15} className="text-accent" />
            Saved cards
          </h2>
          <p className="mt-0.5 text-xs text-ink-faint">
            {isAdmin ? "All family cards, tokenized in the vault" : "Your tokenized cards"}
          </p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-ghost !px-3 !py-2 text-xs">
          <Plus size={14} />
          Add card
        </button>
      </div>

      {visible.length === 0 ? (
        <button
          onClick={() => setAdding(true)}
          className="card card-hover flex aspect-[1.6] w-full max-w-sm flex-col items-center justify-center gap-2 border border-dashed border-line text-ink-faint"
        >
          <Plus size={22} />
          <span className="text-sm font-medium">Add your first card</span>
          <span className="text-xs">Tokenized — safe for the whole family</span>
        </button>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {visible.map((card) => {
              const mine = card.memberId === me.id;
              return (
                <CardVisual
                  key={card.id}
                  card={card}
                  holderName={nameOf(card.memberId)}
                  ownerLabel={
                    isAdmin && !mine ? `${nameOf(card.memberId)}'s card` : undefined
                  }
                  onRemove={
                    mine || isAdmin ? () => removeCard(card.id) : undefined
                  }
                />
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <AddCardModal open={adding} onClose={() => setAdding(false)} />
    </section>
  );
}
