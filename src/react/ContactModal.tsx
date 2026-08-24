import { useEffect, useState, type FormEvent } from 'react';
import type { SparePartCard, SplContactForm, SplContactPayload, SplLabels } from '../types';

export interface ContactModalProps {
  /** The "not found" part the request is about. */
  card: SparePartCard;
  hostProductName?: string;
  hostProductSku?: string;
  breadcrumb?: string[];
  /** Host route base — the modal POSTs to `${apiBase}/contact`. */
  apiBase: string;
  labels?: SplLabels;
  onClose: () => void;
}

const EMPTY: SplContactForm = {
  company: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  remarks: '',
  phone: '',
};

/**
 * "Information request" modal — the standalone port of the WP contact modal.
 * Collects the form, POSTs `{ part, hostProduct, breadcrumb, form }` to
 * `${apiBase}/contact` (the host sends the email server-side), and reports
 * success / error inline.
 */
export function ContactModal({
  card,
  hostProductName,
  hostProductSku,
  breadcrumb,
  apiBase,
  labels,
  onClose,
}: ContactModalProps) {
  const [form, setForm] = useState<SplContactForm>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key: keyof SplContactForm) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    const payload: SplContactPayload = {
      part: { name: card.name, sku: card.sku, pos: card.pos },
      hostProduct: { name: hostProductName, sku: hostProductSku },
      breadcrumb,
      form,
    };
    try {
      const res = await fetch(`${apiBase}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          if (body && typeof body.error === 'string') msg = body.error;
        } catch {
          /* keep status message */
        }
        throw new Error(msg);
      }
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send');
    }
  }

  return (
    <div className="spl-modal" role="presentation" onClick={onClose}>
      <div
        className="spl-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spl-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="spl-modal__header">
          <h3 id="spl-modal-title" className="spl-modal__title">
            {labels?.informationRequest ?? 'Information request'}
          </h3>
          <button
            type="button"
            className="spl-modal__close"
            aria-label={labels?.close ?? 'Close'}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="spl-modal__body">
          {status === 'sent' ? (
            <div className="spl-modal__success" role="status">
              <p>{labels?.contactSuccess ?? 'Thank you for contacting us, we will get back to you!'}</p>
              <div className="spl-modal__actions">
                <button type="button" className="spl-btn spl-btn--primary" onClick={onClose}>
                  {labels?.close ?? 'Close'}
                </button>
              </div>
            </div>
          ) : (
            <form className="spl-form" onSubmit={onSubmit}>
              <p className="spl-form__lead">
                {labels?.interestedIn ?? 'Interested in'}{' '}
                <strong>
                  {card.name} ({card.sku})
                </strong>
                ?
              </p>

              <label className="spl-field">
                <span className="spl-field__label">{labels?.companyName ?? 'Company name'} *</span>
                <input required value={form.company} onChange={set('company')} />
              </label>

              <div className="spl-field-row">
                <label className="spl-field">
                  <span className="spl-field__label">{labels?.firstName ?? 'First name'} *</span>
                  <input required value={form.firstName} onChange={set('firstName')} />
                </label>
                <label className="spl-field">
                  <span className="spl-field__label">{labels?.middleName ?? 'Insertion'}</span>
                  <input value={form.middleName} onChange={set('middleName')} />
                </label>
                <label className="spl-field">
                  <span className="spl-field__label">{labels?.lastName ?? 'Last name'} *</span>
                  <input required value={form.lastName} onChange={set('lastName')} />
                </label>
              </div>

              <label className="spl-field">
                <span className="spl-field__label">{labels?.emailAddress ?? 'E-mail address'} *</span>
                <input type="email" required value={form.email} onChange={set('email')} />
              </label>

              <label className="spl-field">
                <span className="spl-field__label">{labels?.remarks ?? 'Remarks'}</span>
                <textarea rows={4} value={form.remarks} onChange={set('remarks')} />
              </label>

              <label className="spl-field">
                <span className="spl-field__label">{labels?.phoneNumber ?? 'Phone number'} *</span>
                <input required value={form.phone} onChange={set('phone')} />
              </label>

              {status === 'error' ? (
                <p className="spl-form__error" role="alert">
                  {labels?.contactError ?? 'Sending failed.'} {errorMsg}
                </p>
              ) : null}

              <div className="spl-modal__actions">
                <button
                  type="button"
                  className="spl-btn spl-btn--ghost"
                  onClick={onClose}
                  disabled={status === 'sending'}
                >
                  {labels?.cancel ?? 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="spl-btn spl-btn--primary"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? '…' : labels?.sendRequest ?? 'Email us'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
