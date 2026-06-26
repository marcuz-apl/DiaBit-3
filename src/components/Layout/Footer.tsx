'use client';

import React, { useState } from 'react';
import { Phone, Globe, Mail, MapPin, X, Send } from 'lucide-react';

export default function Footer() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [emailForm, setEmailForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setShowContact(false);
      setEmailForm({ name: '', email: '', subject: '', message: '' });
    }, 2500);
  };

  return (
    <footer className="w-full border-t border-slate-200 bg-white py-3 px-6 text-xs text-slate-500 dark:border-slate-800 dark:bg-[#0b0f19] dark:text-slate-400">
      <div className="flex flex-col items-center justify-between space-y-2.5 sm:flex-row sm:space-y-0">
        
        {/* Left Section: Modals Toggles */}
        <div className="flex space-x-4">
          <button
            onClick={() => setShowDisclaimer(true)}
            className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium cursor-pointer"
          >
            Disclaimer
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button
            onClick={() => setShowContact(true)}
            className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium cursor-pointer"
          >
            Contact-Us
          </button>
        </div>

        {/* Center Section: Copyright */}
        <div className="text-center font-medium">
          @2026 Alfazen Inc. All rights reserved
        </div>

        {/* Right Section: Social Icon Array */}
        <div className="flex items-center space-x-3.5">
          <a
            href="tel:+14035550199"
            className="hover:text-slate-800 dark:hover:text-white transition-colors"
            title="Telephone: +1 (403) 555-0199"
          >
            <Phone className="h-4.5 w-4.5" />
          </a>
          <a
            href="https://alfazen.example.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-800 dark:hover:text-white transition-colors"
            title="Website"
          >
            <Globe className="h-4.5 w-4.5" />
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-800 dark:hover:text-white transition-colors flex items-center"
            title="Twitter / X"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-800 dark:hover:text-white transition-colors flex items-center"
            title="LinkedIn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>

      </div>

      {/* --- DISCLAIMER MODAL --- */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Engineering Disclaimer
              </h3>
              <button
                onClick={() => setShowDisclaimer(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3.5 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              <p>
                <strong>DiaBit</strong> is designed as a high-fidelity tool for planning and analyzing directional drilling trajectory curves using the 3D Minimum Curvature Method (MCM).
              </p>
              <p>
                While the mathematical calculations conform to Industry standard formulas (aligned with COMPASS and EDT calculation modules), all outputs should be independently reviewed by a certified well control engineer prior to physical spudding, casing running, or steering operations.
              </p>
              <p>
                Alfazen Inc. assumes no liability for downhole tool damage, bottomhole assembly (BHA) loss, sidetracks, or drilling deviations arising from direct reliance on calculations generated in this application interface.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDisclaimer(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONTACT US MODAL --- */}
      {showContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#111827] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Contact Alfazen Engineering Suite Support
              </h3>
              <button
                onClick={() => setShowContact(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              
              {/* Electronic Mail Submission Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Send Support Ticket
                </h4>
                
                {formSubmitted ? (
                  <div className="flex flex-col items-center justify-center h-48 rounded-lg bg-green-50/50 dark:bg-green-950/10 border border-green-200 dark:border-green-800 p-4 text-center">
                    <Send className="h-8 w-8 text-green-500 animate-bounce mb-3" />
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">Message Transmitted!</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Our engineering support team will reply within 4 hours.</span>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={emailForm.name}
                        onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                        placeholder="Drilling Engineer Name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={emailForm.email}
                        onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                        placeholder="engineer@operator.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Subject</label>
                      <input
                        type="text"
                        required
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                        placeholder="MCM Math Discrepancy, Licensing, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Message</label>
                      <textarea
                        required
                        rows={3}
                        value={emailForm.message}
                        onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                        placeholder="Describe the engineering issue..."
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 text-sm font-semibold transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Transmit Message</span>
                    </button>
                  </form>
                )}
              </div>
              
              {/* Contact Information & Embedded Map */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Headquarters
                </h4>
                <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-sm text-slate-600 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-300 space-y-1.5">
                  <p className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-sky-500" />
                    <span>800 5th Ave SW, Calgary, AB T2P 3T6, Canada</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-sky-500" />
                    <span>+1 (403) 555-0199</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-sky-500" />
                    <span>support@alfazen.example.com</span>
                  </p>
                </div>
                
                {/* Embedded Map */}
                <div className="relative h-44 w-full rounded-lg border border-slate-200 overflow-hidden dark:border-slate-800 bg-slate-100">
                  <iframe
                    title="Calgary Headquarters Map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d160578.11894488314!2d-114.22822452390886!3d51.0130090288285!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x537170030f248287%3A0x287667793a4c83c2!2sCalgary%2C%20AB!5e0!3m2!1sen!2sca!4v1700000000000"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                  ></iframe>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </footer>
  );
}
