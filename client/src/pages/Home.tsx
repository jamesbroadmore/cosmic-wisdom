import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowRight, ArrowUpRight, Check, LogOut, Menu, Sparkles, UserRound, X } from "lucide-react";
import React, { FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SaveForLaterButton } from "@/components/SaveForLaterButton";
import { getDailyQuote } from "@/lib/dailyQuote";

const HOME_TITLE = "Cosmic Wisdom: Private Astrology, Tarot and Numerology";
type SourceRecord = Record<string, unknown>;

function asRecord(value: unknown): SourceRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as SourceRecord) : null;
}

function placement(chartData: unknown, key: string) {
  const item = asRecord(asRecord(chartData)?.[key]);
  if (!item) return null;
  const formatted = typeof item.formatted === "string" ? item.formatted : typeof item.sign === "string" ? item.sign : "Not available";
  return { formatted, house: typeof item.house === "number" ? item.house : null };
}

function natalReading(readingData: unknown) {
  const record = asRecord(readingData);
  const sections = Array.isArray(record?.sections) ? record.sections.map(asRecord).filter((item): item is SourceRecord => Boolean(item)) : [];
  return {
    title: typeof record?.title === "string" ? record.title : "Your natal chart",
    introduction: typeof record?.introduction === "string" ? record.introduction : "Your calculated placements will appear here.",
    practicalFocus: typeof record?.practicalFocus === "string" ? record.practicalFocus : "Start by noticing what feels most useful.",
    sections,
  };
}

const pathCards = [
  { title: "Natal Chart", label: "Your sky map", copy: "Your calculated Sun, Moon, Rising, houses, and aspects.", href: "#natal", contentType: "natal" as const },
  { title: "Numerology", label: "Your number rhythm", copy: "A simple Life Path and personal year from your birthday.", href: "/numerology", contentType: "numerology" as const },
  { title: "Tarot", label: "A reflective draw", copy: "A clear three-card spread when you want a different question.", href: "/tarot", contentType: "tarot" as const },
  { title: "Palmistry", label: "A visual guide", copy: "A privacy-first guide to exploring your hand at your own pace.", href: "/palmistry", contentType: "palmistry" as const },
  { title: "Compatibility", label: "A private lens", copy: "A pressure-free prompt for communication, care, and connection.", href: "/compatibility", contentType: "compatibility" as const },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const profileQuery = trpc.cosmic.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const profile = profileQuery.data;
  const natalQuery = trpc.cosmic.getNatalChart.useQuery(undefined, { enabled: isAuthenticated && Boolean(profile) });
  const chart = natalQuery.data;
  const hasChart = Boolean(chart);
  const sun = placement(chart?.chartData, "sun");
  const moon = placement(chart?.chartData, "moon");
  const rising = placement(chart?.chartData, "rising");
  const reading = natalReading(chart?.readingData);
  const firstName = profile?.displayName.split(" ")[0] ?? "there";
  const dailyQuote = getDailyQuote();

  useEffect(() => {
    document.title = HOME_TITLE;
  }, []);

  const scrollToNatal = () => document.getElementById("natal")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const openProfile = () => {
    setMenuOpen(false);
    if (!isAuthenticated) { window.location.href = "/account"; return; }
    setProfileOpen(true);
  };
  const requestNatal = () => {
    if (!isAuthenticated) {
      toast("Sign in to create your private mystic home", { description: "Use email or a connected account to keep your birth details and readings private." });
      window.location.href = "/account";
      return;
    }
    if (!profile) {
      openProfile();
      return;
    }
    if (!profile.birthTime) {
      toast("Add your birth time first", { description: "A birth time is needed for your Rising sign and house chart." });
      openProfile();
      return;
    }
    setConsentOpen(true);
  };

  const saveProfile = trpc.cosmic.saveProfile.useMutation({
    onSuccess: saved => {
      utils.cosmic.getMyProfile.setData(undefined, saved);
      utils.cosmic.getNatalChart.invalidate();
      setProfileOpen(false);
      toast("Your profile is ready", { description: "You can now visit your Natal Chart, Numerology, Tarot, or Palmistry." });
    },
    onError: error => toast("We couldn’t save your profile", { description: error.message }),
  });
  const calculateNatal = trpc.cosmic.calculateNatalChart.useMutation({
    onSuccess: result => {
      utils.cosmic.getNatalChart.setData(undefined, result);
      setConsentOpen(false);
      toast("Your natal chart is ready", { description: "Your real placements and reading are now waiting in your mystic home." });
    },
    onError: error => toast("We couldn’t calculate your chart", { description: error.message }),
  });

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) { window.location.href = "/account"; return; }
    const data = new FormData(event.currentTarget);
    saveProfile.mutate({
      displayName: String(data.get("name") ?? ""),
      birthDate: String(data.get("date") ?? ""),
      birthTime: String(data.get("time") ?? "") || null,
      birthLocation: String(data.get("place") ?? ""),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    });
  };

  const cardAction = (card: typeof pathCards[number]) => {
    if (card.href === "#natal") return hasChart ? scrollToNatal() : requestNatal();
    window.location.href = card.href;
  };

  return (
    <main className="cosmic-home min-h-screen bg-[#F3F0E9] text-[#102936] selection:bg-[#EF5D3F] selection:text-white">
      <header className="home-header sticky top-0 z-40 border-b border-[#102936]/10 bg-[#F3F0E9]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-9">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5D3F]"><img src="/cosmic-orbit-mark.png" alt="Cosmic orbital C logo" className="h-9 w-9 scale-[1.35] object-cover" /><span className="font-sans text-[10px] font-extrabold tracking-[.3em]">COSMIC WISDOM</span></button>
          <nav className="hidden items-center gap-4 md:flex"><button onClick={hasChart ? scrollToNatal : requestNatal} className="font-mono text-[9px] tracking-[.14em] text-[#55707d] hover:text-[#EF5D3F]">NATAL CHART</button><Link href="/numerology" className="font-mono text-[9px] tracking-[.14em] text-[#55707d] hover:text-[#EF5D3F]">NUMEROLOGY</Link><Link href="/tarot" className="font-mono text-[9px] tracking-[.14em] text-[#55707d] hover:text-[#EF5D3F]">TAROT</Link><Link href="/palmistry" className="font-mono text-[9px] tracking-[.14em] text-[#55707d] hover:text-[#EF5D3F]">PALMISTRY</Link><Link href="/compatibility" className="font-mono text-[9px] tracking-[.14em] text-[#55707d] hover:text-[#EF5D3F]">COMPATIBILITY</Link>{isAuthenticated && <Link href="/saved" className="font-mono text-[9px] tracking-[.14em] text-[#55707d] hover:text-[#EF5D3F]">SAVED</Link>}<ThemeToggle /><Button onClick={openProfile} className="h-10 rounded-none bg-[#211B2A] px-4 font-mono text-[9px] tracking-[.13em] text-white hover:bg-[#EF5D3F]">{profile ? "MY PROFILE" : "CREATE PROFILE"}</Button>{isAuthenticated && <button aria-label="Sign out of Cosmic Wisdom" data-testid="sign-out" onClick={() => void logout()} className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[.13em] text-[#55707d] hover:text-[#EF5D3F]"><LogOut size={13} />SIGN OUT</button>}</nav>
          <button onClick={() => setMenuOpen(value => !value)} className="flex h-10 w-10 items-center justify-center border border-[#102936]/15 md:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
        {menuOpen && <nav className="border-t border-[#102936]/10 bg-[#F3F0E9] px-5 py-4 md:hidden"><div className="mx-auto grid max-w-7xl gap-2"><button onClick={hasChart ? scrollToNatal : requestNatal} className="flex justify-between border-b border-[#102936]/10 py-3 font-mono text-[10px] tracking-[.14em]">NATAL CHART <ArrowRight size={14} /></button><Link href="/numerology" className="flex justify-between border-b border-[#102936]/10 py-3 font-mono text-[10px] tracking-[.14em]">NUMEROLOGY <ArrowRight size={14} /></Link><Link href="/tarot" className="flex justify-between border-b border-[#102936]/10 py-3 font-mono text-[10px] tracking-[.14em]">TAROT <ArrowRight size={14} /></Link><Link href="/palmistry" className="flex justify-between border-b border-[#102936]/10 py-3 font-mono text-[10px] tracking-[.14em]">PALMISTRY <ArrowRight size={14} /></Link><Link href="/compatibility" className="flex justify-between border-b border-[#102936]/10 py-3 font-mono text-[10px] tracking-[.14em]">COMPATIBILITY <ArrowRight size={14} /></Link>{isAuthenticated && <Link href="/saved" className="flex justify-between py-3 font-mono text-[10px] tracking-[.14em]">SAVED FOR LATER <ArrowRight size={14} /></Link>}<ThemeToggle compact /><Button onClick={openProfile} className="mt-2 rounded-none bg-[#211B2A] font-mono text-[9px] tracking-[.14em] text-white">{profile ? "MY PROFILE" : "CREATE PROFILE"}</Button>{isAuthenticated && <button aria-label="Sign out of Cosmic Wisdom" data-testid="sign-out" onClick={() => void logout()} className="mt-1 inline-flex items-center justify-center gap-2 py-3 font-mono text-[9px] tracking-[.14em] text-[#55707d] hover:text-[#EF5D3F]"><LogOut size={13} />SIGN OUT</button>}</div></nav>}
      </header>

      <section className="home-section hero-section px-5 py-7 md:px-9 md:py-10"><div className="relative mx-auto grid max-w-7xl overflow-hidden bg-[#211B2A] px-7 py-10 text-[#F3F0E9] shadow-[0_24px_70px_rgba(33,27,42,.2)] md:grid-cols-[1.2fr_.8fr] md:gap-10 md:px-12 md:py-16"><img src="/cosmic-hero-field.png" alt="Celestial field with faint orbital lines" className="absolute inset-0 h-full w-full object-cover opacity-25" /><div className="absolute inset-y-0 left-0 w-1 bg-[#EF5D3F]" /><div className="relative"><p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#E1A0B1]">YOUR DIGITAL MYSTIC HOME</p><h1 className="mt-6 max-w-2xl font-serif text-[clamp(3.5rem,8vw,7.5rem)] leading-[.84] tracking-[-.065em]">One profile.<br /><em className="font-light text-[#D9D1EF]">Four ways in.</em></h1><p className="mt-7 max-w-xl font-sans text-[16px] leading-7 text-[#E3DAEA]">Create your private profile once, then visit your Natal Chart, Numerology, Tarot, or Palmistry whenever you want a little perspective.</p><Button onClick={profile ? (hasChart ? scrollToNatal : requestNatal) : openProfile} className="mt-8 h-12 rounded-none bg-[#EF5D3F] px-6 font-mono text-[10px] tracking-[.14em] text-white hover:bg-[#D75D7F]">{profile ? hasChart ? "OPEN MY NATAL CHART" : "CALCULATE MY NATAL CHART" : "CREATE MY PROFILE"}<ArrowRight className="ml-2" size={15} /></Button></div><aside className="relative mt-10 border border-white/15 bg-[#F3F0E9] p-6 text-[#102936] shadow-[-9px_11px_0_#EF5D3F] md:mt-0 md:self-end"><div className="flex items-start justify-between"><div><p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#EF5D3F]">YOUR HOME</p><h2 className="mt-3 font-serif text-3xl leading-none">{profile ? `Welcome back, ${firstName}.` : "Make this yours."}</h2></div><UserRound size={20} className="text-[#EF5D3F]" /></div><div className="mt-7 space-y-3">{["Private profile", "Natal Chart", "Numerology", "Tarot + Palmistry"].map((item, index) => <div key={item} className="flex items-center gap-3"><span className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[9px] ${index === 0 && profile ? "bg-[#EF5D3F] text-white" : "bg-[#211B2A] text-white"}`}>{index === 0 && profile ? <Check size={12} /> : index + 1}</span><span className="font-sans text-[13px]">{item}</span></div>)}</div><button onClick={openProfile} className="mt-7 font-mono text-[9px] font-semibold tracking-[.14em] text-[#EF5D3F] hover:text-[#B63C5E]">{profile ? "EDIT MY PROFILE" : "START WITH MY PROFILE"} <ArrowUpRight className="inline" size={13} /></button></aside></div></section>

      <section className="home-section field-note-section px-5 pt-6 md:px-9 md:pt-10"><div className="mx-auto grid max-w-7xl border border-[#102936]/15 bg-white/45 md:grid-cols-[.75fr_1.25fr]"><div className="border-b border-[#102936]/10 bg-[#EDE5F0] p-6 md:border-b-0 md:border-r md:p-8"><p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#B63C5E]">TODAY’S FIELD NOTE</p><p className="mt-4 font-serif text-3xl leading-[.94] tracking-[-.045em]">A fresh line<br />for today.</p><p className="mt-5 font-mono text-[8px] tracking-[.13em] text-[#6E6079]">CHANGES WITH YOUR LOCAL CALENDAR DATE</p></div><blockquote className="field-note flex flex-col justify-between p-6 md:p-8"><p className="max-w-3xl font-serif text-3xl leading-[1.04] tracking-[-.045em] md:text-4xl">“{dailyQuote.text}”</p><div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#102936]/10 pt-4"><cite className="not-italic font-mono text-[8px] tracking-[.14em] text-[#55707d]">COSMIC WISDOM / {dailyQuote.theme.toUpperCase()}</cite><SaveForLaterButton item={{ contentKey: `daily-quote:${dailyQuote.key}`, contentType: "daily_quote", title: "Today’s field note", summary: dailyQuote.text, href: "/" }} /></div></blockquote></div></section>

      <section className="home-section lens-section px-5 py-14 md:px-9 md:py-20"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#EF5D3F]">CHOOSE A LENS</p><h2 className="mt-4 font-serif text-5xl leading-[.9] tracking-[-.06em] md:text-6xl">What do you need today?</h2><p className="mt-5 font-sans text-[15px] leading-7 text-[#55707d]">No complex system to learn. Pick the kind of reflection that feels useful right now.</p></div><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{pathCards.map((card, index) => <article key={card.title} className={`lens-card group flex min-h-[270px] flex-col justify-between border p-6 transition-all duration-300 hover:-translate-y-1 ${index === 0 ? "border-[#211B2A] bg-[#211B2A] text-white shadow-[-7px_9px_0_#EF5D3F]" : "border-[#102936]/15 bg-white/50"}`}><div><p className={`font-mono text-[9px] tracking-[.14em] ${index === 0 ? "text-[#E1A0B1]" : "text-[#EF5D3F]"}`}>{card.label.toUpperCase()}</p><h3 className="mt-8 font-serif text-4xl leading-none tracking-[-.05em]">{card.title}</h3><p className={`mt-5 font-sans text-[13px] leading-6 ${index === 0 ? "text-[#D9D1EF]" : "text-[#55707d]"}`}>{card.copy}</p></div><div className="mt-8 flex items-center justify-between gap-3"><button onClick={() => cardAction(card)} className={`inline-flex items-center gap-2 font-mono text-[9px] font-semibold tracking-[.14em] ${index === 0 ? "text-white" : "text-[#102936] hover:text-[#EF5D3F]"}`}>{card.title === "Natal Chart" ? hasChart ? "OPEN MY CHART" : "CALCULATE MY CHART" : `OPEN ${card.title.toUpperCase()}`} <ArrowRight size={14} /></button><SaveForLaterButton inverse={index === 0} item={{ contentKey: `lens:${card.contentType}`, contentType: card.contentType, title: card.title, summary: card.copy, href: card.href }} /></div></article>)}</div></div></section>

      <section id="natal" className="home-section natal-section border-y border-[#102936]/10 bg-white/35 px-5 py-14 md:px-9 md:py-20"><div className="mx-auto max-w-7xl"><p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#EF5D3F]">NATAL CHART</p>{hasChart ? <><div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h2 className="font-serif text-5xl leading-[.9] tracking-[-.06em] md:text-6xl">Your big three.</h2><p className="mt-4 max-w-2xl font-sans text-[15px] leading-7 text-[#55707d]">A simple starting place for your calculated natal chart. Open the source details only when you want to go deeper.</p></div><button onClick={() => setConsentOpen(true)} className="font-mono text-[9px] font-semibold tracking-[.14em] text-[#EF5D3F] hover:text-[#B63C5E]">RECALCULATE MY CHART <ArrowUpRight className="inline" size={13} /></button></div><div className="mt-10 grid gap-3 md:grid-cols-3">{[{ title: "Sun", value: sun?.formatted ?? "Not available", note: "Your central direction" }, { title: "Moon", value: moon?.formatted ?? "Not available", note: "Your inner rhythm" }, { title: "Rising", value: rising?.formatted ?? "Not available", note: "How you meet the world" }].map((item, index) => <article key={item.title} className={`chart-card group p-7 transition-transform duration-300 hover:-translate-y-1 ${index === 1 ? "bg-[#211B2A] text-white shadow-[-7px_9px_0_#EF5D3F]" : "border border-[#102936]/15 bg-[#F3F0E9]"}`}><p className={`font-mono text-[9px] tracking-[.15em] ${index === 1 ? "text-[#E1A0B1]" : "text-[#EF5D3F]"}`}>{item.title.toUpperCase()}</p><p className="mt-8 font-serif text-4xl leading-[.92] tracking-[-.05em]">{item.value}</p><p className={`mt-5 font-sans text-[13px] ${index === 1 ? "text-[#D9D1EF]" : "text-[#55707d]"}`}>{item.note}</p></article>)}</div><article className="reading-card mt-8 border border-[#102936]/15 bg-[#F3F0E9] p-7 md:p-10"><p className="font-mono text-[9px] font-semibold tracking-[.14em] text-[#EF5D3F]">YOUR READING</p><h3 className="mt-4 font-serif text-4xl leading-[.95] tracking-[-.05em]">{reading.title}</h3><p className="mt-5 max-w-3xl font-sans text-[15px] leading-7 text-[#55707d]">{reading.introduction}</p><p className="mt-7 border-l-2 border-[#EF5D3F] pl-4 font-serif text-2xl leading-tight text-[#211B2A]">“{reading.practicalFocus}”</p>{reading.sections.length > 0 && <div className="mt-8 grid gap-5 md:grid-cols-3">{reading.sections.map(section => <div key={String(section.label)} className="border-t border-[#102936]/10 pt-4"><p className="font-mono text-[8px] tracking-[.13em] text-[#EF5D3F]">{String(section.label ?? "PLACEMENT")}</p><p className="mt-3 font-serif text-2xl leading-none">{String(section.placement ?? "")}</p><p className="mt-4 font-sans text-[13px] leading-6 text-[#55707d]">{String(section.interpretation ?? "")}</p></div>)}</div>}</article></> : <div className="mt-7 grid gap-8 border border-[#102936]/15 bg-[#F3F0E9] p-7 md:grid-cols-[1fr_auto] md:items-end md:p-10"><div><h2 className="font-serif text-5xl leading-[.9] tracking-[-.06em]">{profile ? "Your natal chart is ready to calculate." : "Your natal chart starts with your profile."}</h2><p className="mt-5 max-w-xl font-sans text-[15px] leading-7 text-[#55707d]">{profile ? "Your details are saved. When you are ready, calculate your real Sun, Moon, Rising, houses, and aspects." : "Save your name, birth date, birth time, and birth place. Then choose when to calculate your real chart."}</p></div><Button onClick={profile ? requestNatal : openProfile} className="h-12 rounded-none bg-[#EF5D3F] px-6 font-mono text-[9px] tracking-[.14em] text-white hover:bg-[#D75D7F]">{profile ? "CALCULATE MY CHART" : "CREATE MY PROFILE"}<Sparkles className="ml-2" size={14} /></Button></div>}</div></section>

      <footer className="bg-[#211B2A] px-5 py-9 text-[#F3F0E9] md:px-9"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 md:flex-row md:items-center"><div className="flex items-center gap-3"><img src="/cosmic-orbit-mark.png" alt="Cosmic orbital C logo" className="h-9 w-9 scale-[1.35] object-cover" /><span className="font-sans text-[10px] font-extrabold tracking-[.3em]">COSMIC WISDOM</span></div><p className="font-mono text-[8px] tracking-[.14em] text-[#BFC8E3]">YOUR DIGITAL MYSTIC HOME / PRIVATE BY DESIGN</p></div></footer>

      {consentOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#211B2A]/70 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="consent-title"><div className="w-full max-w-xl bg-[#F3F0E9] p-7 shadow-[0_24px_80px_rgba(0,0,0,.35)]"><p className="font-mono text-[9px] font-semibold tracking-[.14em] text-[#EF5D3F]">PRIVATE NATAL CALCULATION</p><h2 id="consent-title" className="mt-4 font-serif text-4xl leading-[.94] tracking-[-.055em]">Ready to calculate your real chart?</h2><p className="mt-4 font-sans text-[14px] leading-6 text-[#55707d]">Cosmic securely uses your saved birth date, time, and place solely to calculate natal placements, houses, and aspects. The resulting chart stays private in your account.</p><p className="mt-4 border-l-2 border-[#EF5D3F] pl-4 font-sans text-[12px] leading-5 text-[#55707d]">A natal chart is a reflective tool, not a prediction or a substitute for professional advice.</p><div className="mt-8 flex justify-end gap-3"><Button onClick={() => setConsentOpen(false)} variant="outline" className="rounded-none border-[#102936]/20 bg-transparent font-mono text-[9px] tracking-[.14em]">NOT NOW</Button><Button onClick={() => calculateNatal.mutate({ consentToCalculate: true })} disabled={calculateNatal.isPending} className="rounded-none bg-[#EF5D3F] font-mono text-[9px] tracking-[.14em] text-white hover:bg-[#D75D7F]">{calculateNatal.isPending ? "CALCULATING…" : "CALCULATE MY CHART"}</Button></div></div></div>}

      {profileOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#211B2A]/70 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="profile-title"><form onSubmit={handleProfileSubmit} className="relative w-full max-w-2xl bg-[#F3F0E9] p-7 shadow-[0_24px_80px_rgba(0,0,0,.35)] md:p-10"><button type="button" onClick={() => setProfileOpen(false)} className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center border border-[#102936]/15 hover:border-[#EF5D3F]" aria-label="Close profile"><X size={17} /></button><p className="font-mono text-[9px] font-semibold tracking-[.14em] text-[#EF5D3F]">YOUR PRIVATE PROFILE</p><h2 id="profile-title" className="mt-4 max-w-lg font-serif text-4xl leading-[.94] tracking-[-.055em]">Set up your digital mystic home.</h2><p className="mt-4 max-w-lg font-sans text-[13px] leading-6 text-[#55707d]">These four details power your Natal Chart and Numerology. You choose if and when your birth details are sent for a natal calculation.</p><div className="mt-8 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="font-mono text-[9px] tracking-[.13em] text-[#55707d]">YOUR NAME</span><input required name="name" defaultValue={profile?.displayName ?? ""} className="mt-2 h-11 w-full border-b border-[#102936]/20 bg-transparent font-sans outline-none focus:border-[#EF5D3F]" /></label><label><span className="font-mono text-[9px] tracking-[.13em] text-[#55707d]">BIRTH DATE</span><input required name="date" type="date" defaultValue={profile?.birthDate ?? ""} className="mt-2 h-11 w-full border-b border-[#102936]/20 bg-transparent font-sans outline-none focus:border-[#EF5D3F]" /></label><label><span className="font-mono text-[9px] tracking-[.13em] text-[#55707d]">BIRTH TIME</span><input required name="time" type="time" defaultValue={profile?.birthTime ?? ""} className="mt-2 h-11 w-full border-b border-[#102936]/20 bg-transparent font-sans outline-none focus:border-[#EF5D3F]" /></label><label className="sm:col-span-2"><span className="font-mono text-[9px] tracking-[.13em] text-[#55707d]">BIRTH PLACE</span><input required name="place" defaultValue={profile?.birthLocation ?? ""} placeholder="City, country" className="mt-2 h-11 w-full border-b border-[#102936]/20 bg-transparent font-sans outline-none focus:border-[#EF5D3F]" /></label></div><div className="mt-8 flex flex-col justify-between gap-4 border-t border-[#102936]/10 pt-5 sm:flex-row sm:items-center"><p className="max-w-sm font-sans text-[11px] leading-5 text-[#55707d]">Your profile is private. Cosmic never creates a public page from your birth details.</p><Button type="submit" disabled={saveProfile.isPending} className="h-11 rounded-none bg-[#211B2A] font-mono text-[9px] tracking-[.14em] text-white hover:bg-[#EF5D3F]">{saveProfile.isPending ? "SAVING…" : profile ? "UPDATE PROFILE" : "CREATE MY PROFILE"}<ArrowRight className="ml-2" size={14} /></Button></div></form></div>}
    </main>
  );
}
