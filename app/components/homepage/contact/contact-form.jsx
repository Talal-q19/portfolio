"use client";
// @flow strict
import { isValidEmail } from "@/utils/check-email";
import axios from "axios";
import { useState } from "react";
import { TbMailForward } from "react-icons/tb";
import { toast } from "react-toastify";

function ContactForm() {
  const [error, setError] = useState({ email: false, required: false });
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState({
    name: "",
    email: "",
    message: "",
  });

  const checkRequired = () => {
    if (userInput.email && userInput.message && userInput.name) {
      setError({ ...error, required: false });
    }
  };

  const handleSendMail = async (e) => {
    e.preventDefault();

    if (!userInput.email || !userInput.message || !userInput.name) {
      setError({ ...error, required: true });
      return;
    } else if (error.email) {
      return;
    } else {
      setError({ ...error, required: false });
    };

    try {
      setIsLoading(true);
      await axios.post("/api/contact", userInput);

      toast.success("Message sent successfully!");
      setUserInput({
        name: "",
        email: "",
        message: "",
      });
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      setIsLoading(false);
    };
  };

  return (
    <div>
      <p className="mb-5 font-mono text-sm font-bold uppercase tracking-[0.18em] text-[#34D399]">Contact me</p>
      <div className="max-w-3xl rounded-lg border border-[#262626] bg-[#07101d]/45 p-3 text-white lg:p-5">
        <p className="text-sm text-[#d3d8e8]">{"If you have any questions or concerns, please don't hesitate to contact me. I am open to any work opportunities that align with my skills and interests."}</p>
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-base">Your Name: </label>
            <input
              className="min-h-11 w-full rounded-md border border-[#262626] bg-[#101010] px-3 py-2 outline-none ring-0 transition-all duration-300 focus:border-[#E2E8F0] focus:ring-2 focus:ring-[#E2E8F0]/15"
              type="text"
              maxLength="100"
              required={true}
              onChange={(e) => setUserInput({ ...userInput, name: e.target.value })}
              onBlur={checkRequired}
              value={userInput.name}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-base">Your Email: </label>
            <input
              className="min-h-11 w-full rounded-md border border-[#262626] bg-[#101010] px-3 py-2 outline-none ring-0 transition-all duration-300 focus:border-[#E2E8F0] focus:ring-2 focus:ring-[#E2E8F0]/15"
              type="email"
              maxLength="100"
              required={true}
              value={userInput.email}
              onChange={(e) => setUserInput({ ...userInput, email: e.target.value })}
              onBlur={() => {
                checkRequired();
                setError({ ...error, email: !isValidEmail(userInput.email) });
              }}
            />
            {error.email && <p className="text-sm text-red-400">Please provide a valid email!</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-base">Your Message: </label>
            <textarea
              className="w-full rounded-md border border-[#262626] bg-[#101010] px-3 py-2 outline-none ring-0 transition-all duration-300 focus:border-[#E2E8F0] focus:ring-2 focus:ring-[#E2E8F0]/15"
              maxLength="500"
              name="message"
              required={true}
              onChange={(e) => setUserInput({ ...userInput, message: e.target.value })}
              onBlur={checkRequired}
              rows="4"
              value={userInput.message}
            />
          </div>
          <div className="flex flex-col items-center gap-3">
            {error.required && <p className="text-sm text-red-400">
              All fields are required!
            </p>}
            <button
              className="flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-white via-[#E2E8F0] to-[#CBD5E1] px-5 py-2.5 text-center font-mono text-xs font-bold uppercase tracking-[0.13em] text-[#07101d] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50 md:px-10 md:py-3"
              role="button"
              onClick={handleSendMail}
              disabled={isLoading}
            >
              {
                isLoading ?
                <span>Sending Message...</span>:
                <span className="flex items-center gap-1">
                  Send Message
                  <TbMailForward size={20} />
                </span>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
