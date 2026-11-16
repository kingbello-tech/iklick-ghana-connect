import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Bot, MessageSquare, MessagesSquare, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function TypingIndicator({ sender }: { sender: "Customer" | "AI-assisted reply" }) {
  const customer = sender === "Customer";

  return (
    <div
      role="status"
      aria-label={`${sender} is typing`}
      className={`sms-message flex items-center gap-3 rounded-lg px-4 py-3 ${customer ? "self-end bg-primary/10 text-primary" : "self-start bg-muted text-muted-foreground"}`}
    >
      <span className="text-xs">{sender} is typing</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((dot) => <span key={dot} className="sms-typing-dot h-1.5 w-1.5 rounded-full bg-current" />)}
      </span>
    </div>
  );
}

export default function MessagingExperience() {
  const [mode, setMode] = useState("two-way");
  const [replay, setReplay] = useState(0);
  const [conversationStep, setConversationStep] = useState(0);
  const conversational = mode === "two-way";

  useEffect(() => {
    if (!conversational) {
      setConversationStep(0);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setConversationStep(4);
      return;
    }

    setConversationStep(0);
    const timers = [
      window.setTimeout(() => setConversationStep(1), 700),
      window.setTimeout(() => setConversationStep(2), 2100),
      window.setTimeout(() => setConversationStep(3), 2900),
      window.setTimeout(() => setConversationStep(4), 4200),
    ];

    return () => timers.forEach(window.clearTimeout);
  }, [conversational, replay]);

  const selectMode = (nextMode: string) => {
    setConversationStep(0);
    setMode(nextMode);
  };

  const replayConversation = () => {
    setConversationStep(0);
    setReplay((value) => value + 1);
  };

  return (
    <section aria-labelledby="messaging-heading" className="container mx-auto px-4 pb-20">
      <div className="sms-reveal mb-10 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary mb-3">Beyond the broadcast</p>
        <h2 id="messaging-heading" className="text-3xl md:text-4xl font-bold">One message. A whole conversation.</h2>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">Keep customers informed with traditional SMS, or invite them to reply with AI-powered two-way messaging. No smartphone app required.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-12">
        <article className="sms-reveal sms-service-card rounded-lg border border-border bg-card/50 backdrop-blur-sm p-6 md:p-8">
          <div className="sms-card-icon w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6"><MessageSquare className="w-6 h-6" /></div>
          <p className="text-sm text-muted-foreground mb-2">01 / Inform</p>
          <h3 className="text-2xl font-bold">Traditional one-way SMS</h3>
          <p className="text-muted-foreground mt-3">Reach customers at scale with campaigns, transaction alerts, appointment reminders and verification messages.</p>
          <ul className="mt-6 space-y-3 text-sm">
            {["Bulk & scheduled campaigns", "Transactional updates & OTPs", "Sender IDs & delivery reporting"].map(item => <li key={item} className="flex gap-3 items-center"><ArrowRight className="w-4 h-4 shrink-0 text-primary" />{item}</li>)}
          </ul>
          <Button asChild variant="outline" className="mt-8"><a href="#calculator">Explore message volumes <ArrowRight className="w-4 h-4" /></a></Button>
        </article>
        <article className="sms-reveal sms-service-card rounded-lg border border-primary/40 bg-primary/5 backdrop-blur-sm p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="sms-card-icon w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><MessagesSquare className="w-6 h-6" /></div>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-primary"><Sparkles className="w-4 h-4" />AI-powered</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">02 / Engage</p>
          <h3 className="text-2xl font-bold">AI two-way SMS</h3>
          <p className="text-muted-foreground mt-3">Turn customer replies into a conversation with AI-assisted messaging, tailored to your business needs and approved information.</p>
          <ul className="mt-6 space-y-3 text-sm">
            {["Customer questions & conversational replies", "Interactive follow-ups & customer engagement", "Business-specific conversation workflows"].map(item => <li key={item} className="flex gap-3 items-center"><ArrowRight className="w-4 h-4 shrink-0 text-primary" />{item}</li>)}
          </ul>
          <Button asChild className="mt-8"><a href="#inquiry">Discuss AI two-way SMS <ArrowRight className="w-4 h-4" /></a></Button>
        </article>
      </div>

      <div className="sms-reveal grid gap-10 lg:grid-cols-2 items-center">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold">From notifications to replies</h3>
          <p className="text-muted-foreground mt-4 max-w-lg">A promotion sparks interest. A two-way conversation answers shopping questions and helps customers move to checkout.</p>
          <Tabs value={mode} onValueChange={selectMode} className="mt-6">
            <TabsList className="h-auto flex-wrap justify-start">
              <TabsTrigger value="one-way" className="gap-2"><MessageSquare className="w-4 h-4" />One-way SMS</TabsTrigger>
              <TabsTrigger value="two-way" className="gap-2"><Bot className="w-4 h-4" />AI two-way SMS</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="mt-5 text-sm text-muted-foreground">Illustrative conversation. Two-way availability, AI workflows, consent, opt-out handling and pricing are confirmed during discovery.</p>
        </div>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
            <div className="flex items-center gap-3"><MessagesSquare className="w-5 h-5 text-primary" /><span className="font-semibold">iKlick · Messaging example</span></div>
            <Button size="icon" variant="ghost" aria-label="Replay conversation" title="Replay conversation" onClick={replayConversation}><RotateCcw className="w-4 h-4" /></Button>
          </div>
          <div role="log" aria-live="polite" aria-relevant="additions" aria-label={conversational ? "AI two-way SMS example" : "One-way SMS example"} className="sms-conversation p-5 md:p-6 flex flex-col gap-4 min-h-[340px]">
            <div key="business-message" className="sms-message max-w-[90%] self-start rounded-lg bg-muted p-4"><p className="text-xs text-muted-foreground mb-2">Business</p><p className="text-sm">Still thinking about those sneakers in your cart?{conversational ? " Reply with any questions before you order." : " Visit our store to complete your order."}</p></div>
            {conversational && conversationStep === 1 && <TypingIndicator key="customer-typing" sender="Customer" />}
            {conversational && conversationStep >= 2 && (
              <div key="customer-message" className="sms-message max-w-[85%] self-end rounded-lg bg-primary text-primary-foreground p-4"><p className="text-xs mb-2">Customer</p><p className="text-sm">Do you have size 42, and can you deliver to Tema?</p></div>
            )}
            {conversational && conversationStep === 3 && <TypingIndicator key="ai-typing" sender="AI-assisted reply" />}
            {conversational && conversationStep >= 4 && (
              <div key="ai-message" className="sms-message max-w-[90%] self-start rounded-lg bg-muted p-4"><p className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><Bot className="w-3 h-3" />AI-assisted reply</p><p className="text-sm">Yes! Size 42 is available, and we deliver to Tema. Ready to order? Your checkout link lets you confirm delivery and complete your purchase.</p></div>
            )}
            {!conversational && <div className="sms-message flex items-center gap-2 text-sm text-muted-foreground mt-auto"><ArrowDown className="w-4 h-4" />Customer receives your update.</div>}
          </div>
        </div>
      </div>
    </section>
  );
}