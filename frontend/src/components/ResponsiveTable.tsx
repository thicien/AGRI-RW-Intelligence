import { Children, isValidElement } from "react";
import type { ReactNode, TableHTMLAttributes } from "react";

function columnCount(children: ReactNode): number {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ children?: ReactNode; colSpan?: number }>(child))
      continue;
    if (child.type === "tr") {
      return Children.toArray(child.props.children).reduce<number>(
        (total, cell) =>
          total +
          (isValidElement<{ colSpan?: number }>(cell)
            ? cell.props.colSpan || 1
            : 0),
        0,
      );
    }
    const nested = columnCount(child.props.children);
    if (nested) return nested;
  }
  return 0;
}

/** Preserve table semantics and readable columns inside a local scroll region. */
export default function ResponsiveTable({
  children,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  const columns = columnCount(children);
  return (
    <div
      className="responsive-table"
      role="region"
      aria-label={
        props["aria-label"] ||
        "Data table: scroll horizontally to view all columns"
      }
      tabIndex={0}
    >
      <table
        {...props}
        style={{
          minWidth: columns >= 3 ? `${columns * 7}rem` : undefined,
          ...props.style,
        }}
      >
        {children}
      </table>
    </div>
  );
}
