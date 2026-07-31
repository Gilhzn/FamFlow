"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";

/**
 * Substitute React nodes into a translated template containing {slot} tokens.
 * Word order stays under the translator's control while styled spans (money,
 * percentages) keep their markup: fill(t("k"), { amt: <Money>…</Money> }).
 * Unknown tokens are left as-is.
 */
export function fill(
  template: string,
  nodes: Record<string, ReactNode>
): ReactNode {
  return template.split(/(\{\w+\})/g).map((part, i) => {
    const m = /^\{(\w+)\}$/.exec(part);
    if (m && m[1] in nodes) return <Fragment key={i}>{nodes[m[1]]}</Fragment>;
    return part ? <Fragment key={i}>{part}</Fragment> : null;
  });
}

/** Money / numeric run kept LTR inside RTL (Hebrew) text. */
export function Money({
  children,
  className = "tabular",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span dir="ltr" className={className} style={style}>
      {children}
    </span>
  );
}
