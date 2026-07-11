import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, meta, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <div className="page-header__description">{description}</div>}
        {meta && <div className="page-header__meta">{meta}</div>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
