"use client";
import { isValidEmail } from "@/utils/check-email";
import axios from "axios";
import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

export default function ContactForm() {
  const captchaRef = useRef(null);
  const captchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const [captchaToken, setCaptchaToken] = useState(null);
  const [draft, setDraft] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState({});
  const sending = useRef(false);
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (sending.current) return;
    const next = {};
    if (!draft.name.trim()) next.name = "Please enter your name.";
    if (!isValidEmail(draft.email.trim()))
      next.email = "Please enter a valid email address.";
    if (!draft.message.trim()) next.message = "Please enter a message.";
    if (captchaSiteKey && !captchaToken)
      next.captcha = "Please complete the CAPTCHA.";
    setErrors(next);
    if (Object.keys(next).length) {
      setStatus("error");
      setFeedback("Please check the highlighted fields.");
      form.elements.namedItem(Object.keys(next)[0])?.focus();
      return;
    }
    sending.current = true;
    setStatus("sending");
    setFeedback("Sending your message…");
    try {
      const response = await axios.post(
        "/api/contact",
        { ...draft, captchaToken },
        { timeout: 45000 },
      );
      if (response.data?.success === false)
        throw new Error(
          response.data.message || "Unable to send your message.",
        );
      setStatus("success");
      setFeedback("Message sent successfully!");
      setDraft({ name: "", email: "", message: "" });
    } catch (error) {
      setStatus("error");
      setFeedback(
        error?.response?.data?.message ||
          "Unable to send your message. Please try again.",
      );
      const fields =
        error?.response?.data?.fields || error?.response?.data?.errors;
      if (fields && !Array.isArray(fields) && typeof fields === "object") {
        setErrors(fields);
        form.elements.namedItem(Object.keys(fields)[0])?.focus();
      }
    } finally {
      sending.current = false;
      captchaRef.current?.reset();
      setCaptchaToken(null);
    }
  };
  return (
    <form
      className="pf-contact-form"
      onSubmit={submit}
      noValidate
      aria-busy={status === "sending"}
    >
      {["name", "email", "message"].map((field) => (
        <div key={field}>
          <label htmlFor={`pf-${field}`}>
            Your {field} <span aria-hidden="true">*</span>
          </label>
          {field === "message" ? (
            <textarea
              id={`pf-${field}`}
              name={field}
              required
              maxLength={500}
              rows={5}
              placeholder="Tell me about your project or opportunity."
              value={draft[field]}
              aria-invalid={!!errors[field]}
              aria-describedby={
                errors[field] ? `pf-${field}-error` : "pf-message-count"
              }
              onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
            />
          ) : (
            <input
              id={`pf-${field}`}
              name={field}
              type={field === "email" ? "email" : "text"}
              autoComplete={field}
              required
              maxLength={100}
              placeholder={field === "name" ? "Your name" : "you@example.com"}
              value={draft[field]}
              aria-invalid={!!errors[field]}
              aria-describedby={errors[field] ? `pf-${field}-error` : undefined}
              onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
            />
          )}
          {errors[field] && (
            <p className="pf-field-error" id={`pf-${field}-error`}>
              {String(errors[field])}
            </p>
          )}
        </div>
      ))}
      <p className="pf-count" id="pf-message-count">
        {draft.message.length} / 500
      </p>
      <p className="pf-meta">All fields are required.</p>
      {captchaSiteKey && (
        <ReCAPTCHA
          ref={captchaRef}
          sitekey={captchaSiteKey}
          onChange={setCaptchaToken}
          onExpired={() => setCaptchaToken(null)}
          onErrored={() => setCaptchaToken(null)}
        />
      )}
      {errors.captcha && <p className="pf-field-error">{errors.captcha}</p>}
      <p
        className={`pf-form-feedback ${status === "error" ? "pf-field-error" : ""}`}
        role="status"
        aria-live="polite"
      >
        {feedback}
      </p>
      <button
        type="submit"
        className="pf-primary"
        disabled={status === "sending"}
      >
        {status === "sending"
          ? "Sending…"
          : status === "error"
            ? "Try sending again ↗"
            : "Send message ↗"}
      </button>
    </form>
  );
}
