"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { Copy, RefreshCw, Mail, ArrowLeft, Loader2, Sparkles, Inbox, ChevronDown, Book, Trash2, Pencil, Globe, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

// Replace with your actual Worker URL if different
const API_BASE = "https://temp-email-worker.manulsinul99.workers.dev";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface EmailMessage {
  id: number;
  sender: string;
  subject: string;
  body_text: string;
  received_at: string;
}

export default function Home() {
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMsgId, setSelectedMsgId] = useState<number | null>(null);
  const [customName, setCustomName] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");

  const [audioPermission, setAudioPermission] = useState<'pending' | 'allowed' | 'denied'>('pending');

  useEffect(() => {
    const saved = localStorage.getItem("temp_email_address");
    if (saved) setEmail(saved);
  }, []);

  const { data: domainData } = useSWR<{ domains: string[]; warning?: string }>(
    `${API_BASE}/api/domains`,
    fetcher
  );

  const domains = domainData?.domains || [];

  // Set default domain when data loads
  useEffect(() => {
    if (domains.length > 0 && !selectedDomain) {
      setSelectedDomain(domains[0]);
    }
  }, [domains, selectedDomain]);

  const { data, mutate, isLoading: isInboxLoading } = useSWR<{ emails: EmailMessage[] }>(
    email ? `${API_BASE}/api/inbox/${email}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  const inbox = data?.emails || [];

  const { data: statsData } = useSWR<{ total_emails: number }>(
    `${API_BASE}/api/stats`,
    fetcher
  );

  // Sound Notification Logic
  const prevInboxLength = useRef(0);
  const isFirstLoad = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio object once
    const audio = new Audio("/uh-kaget.mp3");
    audio.volume = 1.0; // Max volume for the intended effect
    audioRef.current = audio;

    // Helper to silently unlock audio on first interaction
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
        }).catch(() => {
          // Ignore errors during unlock attempt
        });
      }
      // Remove listeners once triggers
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    // Check localStorage for saved permission
    const savedPermission = localStorage.getItem('audio_permission');
    if (savedPermission === 'allowed') {
      setAudioPermission('allowed');
      // Even if allowed, we need a fresh gesture to actually unlock the browser audio
      // We attach listeners to catch the very first interaction on the page
      document.addEventListener('click', unlockAudio);
      document.addEventListener('keydown', unlockAudio);
      document.addEventListener('touchstart', unlockAudio);
    } else if (savedPermission === 'denied') {
      setAudioPermission('denied');
    }

    // Cleanup listeners on unmount
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const enableAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        // Playing successful means permission granted
        setAudioPermission('allowed');
        localStorage.setItem('audio_permission', 'allowed');
        // Optional: pause immediately if we just want to unlock, 
        // but for this specific "Uh Kaget" sound, playing it once is good feedback.
      }).catch(err => {
        console.error("Audio failed:", err);
        // potentially try again or keep as pending
      });
    }
  };

  const disableAudio = () => {
    setAudioPermission('denied');
    localStorage.setItem('audio_permission', 'denied');
  };

  useEffect(() => {
    const currentLength = inbox.length;

    // Skip the first execution to prevent playing sound on page load
    if (isFirstLoad.current) {
      prevInboxLength.current = currentLength;
      isFirstLoad.current = false;
      return;
    }

    // Play sound if length increases AND permission is allowed
    if (currentLength > prevInboxLength.current) {
      if (audioPermission === 'allowed') {
        console.log("Attempting to play sound...");
        // We try to play. If it fails (e.g. user hasn't interacted yet), we catch it to avoid Red Error in console.
        const playPromise = audioRef.current?.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            console.log("Audio play blocked (waiting for user interaction):", e);
          });
        }
      }
      toast.info(t.inbox.newMsg);
    }

    // Always update ref
    prevInboxLength.current = currentLength;
  }, [inbox.length, t, audioPermission]);


  const generateEmail = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix: customName || undefined,
          domain: selectedDomain || undefined
        }),
      });
      const result = await res.json();
      setEmail(result.address);
      localStorage.setItem("temp_email_address", result.address);
      setSelectedMsgId(null);
      setCustomName("");
      mutate();
      toast.success(t.toast.created, { description: `${t.toast.createdDesc} ${result.address}` });
    } catch (err) {
      console.error("Failed to generate", err);
      toast.error(t.toast.genFailed, { description: t.toast.genFailedDesc });
    } finally {
      setLoading(false);
    }
  };

  const deleteEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEmail(null);
    localStorage.removeItem("temp_email_address");
    mutate(); // Clear inbox data
    toast.info(t.toast.identityRemoved, { description: t.toast.identityRemovedDesc });
  };

  const editEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (email) {
      const prefix = email.split('@')[0];
      setCustomName(prefix);
      const input = document.getElementById("custom-name-input");
      input?.focus();
      toast.info(t.toast.editIdentity, { description: t.toast.editDesc });
    }
  };

  const { data: messageData, isLoading: isMessageLoading } = useSWR(
    selectedMsgId ? `${API_BASE}/api/message/${selectedMsgId}` : null,
    fetcher
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased h-auto md:h-screen overflow-auto md:overflow-hidden relative">

      {/* Audio Permission Modal */}
      <AnimatePresence>
        {audioPermission === 'pending' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Volume2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold mb-2">Izinkan Notifikasi Suara?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Kami menggunakan suara "Jokowi Uh Kaget" untuk memberi tahu Anda saat ada email baru masuk.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={disableAudio}
                  className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Jangan
                </button>
                <button
                  onClick={enableAudio}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Izinkan & Tes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar / Main Control */}
      <div className="w-full md:w-[400px] border-r border-border bg-card/50 flex flex-col items-center p-6 backdrop-blur-xl relative z-10 transition-colors">

        {/* Brand */}
        <div className="w-full mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/40 blur-lg rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-10 h-10 bg-transparent rounded-xl flex items-center justify-center relative z-10">
                <Image
                  src="/bear-icon.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#1a1a1a] rounded-full" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">
                {t.brand.title}
              </h1>
              <span className="text-[10px] font-medium tracking-widest text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded-sm">
                {t.brand.subtitle}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="appearance-none bg-secondary text-foreground text-xs font-medium py-1.5 pl-2 pr-6 rounded-md cursor-pointer focus:outline-none hover:bg-secondary/80 transition-colors"
                title="Select Language"
              >
                <option value="id">ID</option>
                <option value="en">EN</option>
                <option value="jv">JV</option>
              </select>
              <Globe className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Action Card */}
        <div className="w-full bg-card border border-border/60 rounded-2xl p-5 mb-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider relative z-10">
            {t.card.title}
          </div>

          {email ? (
            <div className="group relative">
              <div
                onClick={() => {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(email);
                    toast.success(t.card.copied, { description: email });
                  } else {
                    // Fallback for non-secure contexts (http://192.168.x.x)
                    const textArea = document.createElement("textarea");
                    textArea.value = email;
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try {
                      document.execCommand('copy');
                      toast.success(t.card.copied, { description: email });
                    } catch (err) {
                      console.error('Fallback: Oops, unable to copy', err);
                      toast.error(t.card.copyFail);
                    }
                    document.body.removeChild(textArea);
                  }
                }}
                className="w-full bg-secondary hover:bg-secondary/80 transition-all cursor-pointer border border-border border-dashed rounded-xl p-4 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <code className="text-primary font-mono text-sm truncate">{email}</code>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={editEmail}
                    className="p-2 hover:bg-background rounded-lg text-muted-foreground hover:text-orange-500 transition-colors"
                    title={t.card.edit}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={deleteEmail}
                    className="p-2 hover:bg-background rounded-lg text-muted-foreground hover:text-red-500 transition-colors"
                    title={t.card.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
              <div className="absolute top-full mt-2 left-0 text-xs text-green-500 opacity-0 group-active:opacity-100 transition-opacity">
                {t.card.copied}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic py-2">{t.card.empty}</div>
          )}

          <div className="mt-6">
            <div className="text-xs font-medium text-muted-foreground mb-2">{t.card.createTitle}</div>
            <form onSubmit={generateEmail} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  id="custom-name-input"
                  type="text"
                  placeholder={t.card.placeholderName}
                  className="flex-1 bg-input/50 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors w-full placeholder:text-muted-foreground/50 text-foreground"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    className="w-full appearance-none bg-input/50 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    disabled={domains.length === 0}
                  >
                    {domains.length === 0 ? (
                      <option>{t.card.loadingDomains}</option>
                    ) : (
                      domains.map((d) => (
                        <option key={d} value={d}>@{d}</option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>

                <button
                  type="submit"
                  disabled={loading || domains.length === 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.card.generateBtn}
                </button>
              </div>

              {domainData?.warning && (
                <div className="text-[10px] text-yellow-500 mt-1">
                  {domainData.warning}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Stats / Info */}
        <div className="w-full grid grid-cols-2 gap-3 mb-auto">
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
            <span className="text-2xl font-bold text-foreground">{inbox.length}</span>
            <span className="text-xs text-muted-foreground">{t.stats.messages}</span>
          </div>
          <div className="bg-card border border-green-500/20 rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-green-500/5 dark:bg-green-500/10 animate-pulse" />
            <span className="text-2xl font-bold text-green-500">{t.stats.active}</span>
            <span className="text-xs text-muted-foreground z-10">{t.stats.status}</span>
          </div>
        </div>

        {/* Global Stats */}
        <div className="w-full mb-auto mt-3">
          <div className="bg-card border border-indigo-500/20 rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10" />
            <span className="text-2xl font-bold text-indigo-500">
              {statsData?.total_emails ? statsData.total_emails.toLocaleString() : "..."}
            </span>
            <span className="text-xs text-muted-foreground z-10">{t.stats.total}</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border w-full">
          <Link
            href="/docs"
            className="flex items-center justify-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-primary transition-colors hover:bg-muted/50 rounded-lg"
          >
            <Book className="w-4 h-4" />
            <span>{t.footer.docs}</span>
          </Link>
        </div>
      </div>

      {/* Inbox Area */}
      <div className="flex-1 flex flex-col relative bg-muted/30 overflow-hidden min-h-[500px] md:min-h-0">

        {/* Mobile Header */}
        <div className="md:hidden h-16 border-b border-border flex items-center px-4 justify-between bg-background">
          <span className="font-bold text-foreground">{t.inbox.title}</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="appearance-none bg-secondary text-foreground text-xs font-medium py-1.5 pl-2 pr-6 rounded-md cursor-pointer focus:outline-none"
              >
                <option value="id">ID</option>
                <option value="en">EN</option>
                <option value="jv">JV</option>
              </select>
              <Globe className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            <ThemeToggle />
            {email && (
              <button
                onClick={() => {
                  mutate();
                  toast.info(t.inbox.refreshToast);
                }}
                className="p-2 bg-secondary rounded-full text-foreground"
              >
                <RefreshCw className={cn("w-4 h-4", isInboxLoading && "animate-spin")} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* List */}
          <div className={cn(
            "w-full md:w-[350px] border-r border-border flex flex-col transition-all duration-300 absolute md:relative inset-0 z-20 bg-background md:bg-transparent h-full",
            selectedMsgId ? "-translate-x-full md:translate-x-0 hidden md:flex" : "translate-x-0 flex"
          )}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{t.inbox.title}</h2>
              <button
                onClick={() => {
                  mutate();
                  toast.info(t.inbox.refreshToast);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-secondary rounded-full"
                title={t.inbox.refreshToast}
              >
                <RefreshCw className={cn("w-4 h-4", isInboxLoading && "animate-spin text-primary")} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {inbox.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 p-8 text-center"
                  >
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                      <Inbox className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm">{t.inbox.waiting}</p>
                    {email && <p className="text-xs">{t.inbox.sendTo} <br /> <code className="text-primary">{email}</code></p>}
                  </motion.div>
                ) : (
                  inbox.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      onClick={() => setSelectedMsgId(msg.id)}
                      className={cn(
                        "p-4 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors group",
                        selectedMsgId === msg.id ? "bg-secondary" : "bg-transparent"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {msg.sender.split('<')[0] || msg.sender}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {new Date(msg.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground font-medium mb-1 line-clamp-1">{msg.subject}</div>
                      <div className="text-xs text-muted-foreground/70 line-clamp-2">{msg.body_text}</div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="p-3 border-t border-border bg-background/50 backdrop-blur-sm">
              <div className="text-[10px] text-center text-muted-foreground/60">
                {t.footer.credit}
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className={cn(
            "flex-1 flex flex-col bg-background absolute md:relative inset-0 z-30 transition-transform duration-300 md:translate-x-0 overflow-hidden h-full",
            selectedMsgId ? "translate-x-0 flex" : "translate-x-full hidden md:flex"
          )}>
            {selectedMsgId && (
              <>
                {/* Header */}
                <div className="min-h-16 md:h-auto border-b border-border p-4 flex items-center gap-4 bg-background z-10">
                  <button
                    onClick={() => setSelectedMsgId(null)}
                    className="md:hidden p-2 hover:bg-secondary rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <div className="flex-1 overflow-hidden">
                    <h1 className="text-lg font-bold text-foreground truncate">
                      {messageData ? messageData.subject : "Loading..."}
                    </h1>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-background">
                  {messageData ? (
                    <div className="max-w-3xl mx-auto">
                      <div className="flex items-center gap-3 mb-8 pb-8 border-b border-border">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary uppercase">
                          {messageData.sender[0]}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{messageData.sender}</div>
                          <div className="text-sm text-muted-foreground">{new Date(messageData.received_at).toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground mt-1">To: {email}</div>
                        </div>
                      </div>

                      <div className="prose prose-zinc dark:prose-invert max-w-none">
                        {/* We prefer HTML but fallback to text */}
                        {messageData.body_html ? (
                          <div dangerouslySetInnerHTML={{ __html: messageData.body_html }} />
                        ) : (
                          <pre className="whitespace-pre-wrap font-sans text-foreground">{messageData.body_text}</pre>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </>
            )}

            {!selectedMsgId && (
              <div className="hidden md:flex flex-col items-center justify-center h-full text-muted-foreground gap-4 bg-muted/10">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center">
                  <Mail className="w-10 h-10 opacity-30" />
                </div>
                <p>{t.inbox.selectMsg}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
