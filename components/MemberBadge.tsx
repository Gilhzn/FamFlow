"use client";

import { Member } from "@/lib/types";

export default function MemberBadge({
  member,
  compact,
  showRole,
  size = 28,
}: {
  member: Member;
  compact?: boolean;
  showRole?: boolean;
  size?: number;
}) {
  const initials = member.name.slice(0, 1).toUpperCase();
  const avatar = (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{
        width: size,
        height: size,
        background: member.color,
        boxShadow: `0 0 0 2px var(--surface-1), 0 0 12px ${member.color}44`,
      }}
    >
      {initials}
    </span>
  );
  if (compact) return avatar;
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {avatar}
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium leading-tight">
          {member.name}
        </span>
        {showRole && (
          <span className="block text-[11px] capitalize text-ink-faint">
            {member.role === "admin" ? "Admin · Parent" : "Member"}
          </span>
        )}
      </span>
    </span>
  );
}
