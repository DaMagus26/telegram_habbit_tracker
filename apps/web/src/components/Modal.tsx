import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, open, onClose, children }: ModalProps): JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h3>{title}</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>
        <div className="modal__content">{children}</div>
      </section>
    </div>
  );
}
