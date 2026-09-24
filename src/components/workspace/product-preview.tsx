"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Inbox,
  LayoutDashboard,
  Search,
  Settings,
  TicketCheck,
  Users,
} from "lucide-react";

type ProductPreviewProps = {
  version: number;
  onSelect: (selection: string) => void;
};

const TICKETS = [
  { id: "CS-1428", title: "Checkout failed after card verification", customer: "Maya Chen", priority: "Urgent", status: "Needs review", time: "4m" },
  { id: "CS-1427", title: "Unable to invite a new workspace member", customer: "Noah Williams", priority: "High", status: "AI drafted", time: "11m" },
  { id: "CS-1426", title: "Invoice tax does not match billing address", customer: "Ava Patel", priority: "Normal", status: "Open", time: "26m" },
];

export function ProductPreview({ version, onSelect }: ProductPreviewProps) {
  const [active, setActive] = useState("Overview");
  const nav = [
    ["Overview", LayoutDashboard],
    ["Inbox", Inbox],
    ["Customers", Users],
    ["Knowledge", BookOpen],
  ] as const;

  return (
    <div className="relay-app">
      <aside className="relay-sidebar">
        <div className="relay-logo"><span>R</span><strong>RelayDesk</strong></div>
        <nav>
          {nav.map(([label, Icon]) => <button type="button" key={label} className={active === label ? "is-active" : ""} onClick={() => setActive(label)}><Icon aria-hidden="true" /><span>{label}</span>{label === "Inbox" ? <small>12</small> : null}</button>)}
        </nav>
        <div className="relay-sidebar-bottom"><button type="button"><Settings aria-hidden="true" /><span>Settings</span></button><div className="relay-user"><span>DC</span><p><strong>Darsh</strong><small>Administrator</small></p></div></div>
      </aside>

      <section className="relay-content">
        <header className="relay-header"><div><h1>{active}</h1><p>{active === "Overview" ? "Monday, September 24" : "Support operations workspace"}</p></div><div><label><Search aria-hidden="true" /><input aria-label="Search RelayDesk" placeholder="Search" /></label><button type="button" aria-label="Account"><CircleUserRound aria-hidden="true" /></button></div></header>

        {active === "Overview" ? (
          <div className="relay-dashboard">
            <button type="button" className="relay-alert" onClick={() => onSelect("AI triage queue banner")}><Bot aria-hidden="true" /><span><strong>AI triage is active</strong><small>12 tickets classified · 3 need a human decision</small></span><span>Review queue <ChevronRight aria-hidden="true" /></span></button>
            <div className="relay-metrics">
              <button type="button" onClick={() => onSelect("Open tickets metric")}><span>Open tickets</span><strong>{version > 1 ? "126" : "128"}</strong><small className="down"><ArrowDownRight aria-hidden="true" />8.4% this week</small></button>
              <button type="button" onClick={() => onSelect("First response metric")}><span>First response</span><strong>3m 42s</strong><small className="down"><ArrowDownRight aria-hidden="true" />42s faster</small></button>
              <button type="button" onClick={() => onSelect("Resolution rate metric")}><span>Resolution rate</span><strong>91.8%</strong><small className="up"><ArrowUpRight aria-hidden="true" />4.2% this week</small></button>
              <button type="button" onClick={() => onSelect("Customer satisfaction metric")}><span>Customer satisfaction</span><strong>4.86</strong><small className="up"><ArrowUpRight aria-hidden="true" />0.12 this week</small></button>
            </div>
            <div className="relay-grid">
              <section className="relay-queue">
                <div className="relay-section-head"><div><h2>Priority queue</h2><span>Updated just now</span></div><button type="button">View all <ChevronRight aria-hidden="true" /></button></div>
                <div className="relay-table-head"><span>Ticket</span><span>Priority</span><span>Status</span><span>Updated</span></div>
                {TICKETS.map((ticket) => <button type="button" className="relay-ticket" key={ticket.id} onClick={() => onSelect(`Ticket ${ticket.id}`)}><span><i>{ticket.customer.split(" ").map((part) => part[0]).join("")}</i><p><strong>{ticket.title}</strong><small>{ticket.id} · {ticket.customer}</small></p></span><span className={`relay-priority ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span><span className="relay-status">{ticket.status}</span><time>{ticket.time}</time></button>)}
              </section>
              <aside className="relay-insight">
                <div className="relay-section-head"><div><h2>Agent insight</h2><span>Last 24 hours</span></div><Bot aria-hidden="true" /></div>
                <div className="insight-score"><span><strong>78%</strong><small>Auto-resolved</small></span><i style={{ "--score": "78%" } as React.CSSProperties} /></div>
                <dl><div><dt>Responses drafted</dt><dd>142</dd></div><div><dt>Human edits</dt><dd>18%</dd></div><div><dt>Escalations</dt><dd>7</dd></div></dl>
                <button type="button" onClick={() => onSelect("Agent performance details")}>Open agent performance <ChevronRight aria-hidden="true" /></button>
              </aside>
            </div>
          </div>
        ) : (
          <div className="relay-empty-state"><span>{active === "Inbox" ? <TicketCheck aria-hidden="true" /> : active === "Knowledge" ? <BookOpen aria-hidden="true" /> : <Users aria-hidden="true" />}</span><h2>{active}</h2><p>This functional preview route is ready for the next build step.</p><button type="button" onClick={() => setActive("Overview")}><CheckCircle2 aria-hidden="true" />Return to overview</button></div>
        )}
        <footer className="relay-footer"><span><Clock3 aria-hidden="true" />Synced 20 seconds ago</span><span>RelayDesk preview · v{version}</span></footer>
      </section>
    </div>
  );
}
