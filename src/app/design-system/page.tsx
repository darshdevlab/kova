import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const colors = [
  ["Canvas", "#FFFFFF", "Primary working surface"],
  ["Silver", "#F7F8FA", "Navigation and supporting surfaces"],
  ["Ink", "#202328", "Primary text"],
  ["Border", "#E5E7EB", "Quiet separation"],
  ["Jade", "#245D4B", "Primary actions and selection"],
  ["Steel", "#365F7D", "Secondary data signals"],
  ["Amber", "#876028", "Warnings and attention"],
  ["Clay", "#A0443E", "Destructive and error states"],
];

export default function DesignSystemPage() {
  return (
    <div className="design-reference">
      <header className="product-topbar">
        <BrandMark context="Design system / 03" />
        <Link className="text-button" href="/projects">
          <ArrowLeft />
          Workspace
        </Link>
      </header>
      <main className="hub-main">
        <div className="hub-heading">
          <div>
            <span className="eyebrow">Silver / Ink / Jade</span>
            <h1>Kova Design System</h1>
            <p>The shared visual and interaction standard for Kova.</p>
          </div>
          <span className="tag">September 2026</span>
        </div>
        <section className="design-section">
          <div className="design-section-label">
            <span className="number-label">01</span>
            <h2>Color with a purpose</h2>
            <p>
              Neutral surfaces carry the workspace. Color identifies an action
              or a state.
            </p>
          </div>
          <div className="swatch-grid">
            {colors.map(([name, value, role]) => (
              <article key={name}>
                <div style={{ background: value }} />
                <strong>{name}</strong>
                <code>{value}</code>
                <p>{role}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="design-section">
          <div className="design-section-label">
            <span className="number-label">02</span>
            <h2>Type that does its job</h2>
            <p>
              Geist for the interface. Geist Mono for identifiers and precise
              values.
            </p>
          </div>
          <div className="type-specimens">
            <div>
              <span>Page / 25-30px / 550</span>
              <h1>A clear plan. A better build.</h1>
            </div>
            <div>
              <span>Section / 18px / 550</span>
              <h2>Every change, accounted for.</h2>
            </div>
            <div>
              <span>Product / 13px / 400</span>
              <p>
                Requirements, decisions, and release evidence stay connected.
              </p>
            </div>
            <div>
              <span>Metadata / 11px / Mono</span>
              <code>feature/initial-build / v2</code>
            </div>
          </div>
        </section>
        <section className="design-section">
          <div className="design-section-label">
            <span className="number-label">03</span>
            <h2>Precise, familiar controls</h2>
            <p>
              5px control corners. 8px maximum card corners. No decorative pill
              containers.
            </p>
          </div>
          <div className="control-specimens">
            <div>
              <span className="eyebrow">Action hierarchy</span>
              <div>
                <span className="button primary">
                  Continue to build
                  <ArrowRight />
                </span>
                <span className="button quiet">
                  <Plus />
                  Add resource
                </span>
                <span className="icon-button">
                  <Search />
                </span>
              </div>
            </div>
            <div>
              <span className="eyebrow">States</span>
              <div>
                <span className="tag positive">
                  <Check />
                  Verified
                </span>
                <span className="tag warning-text">
                  <Circle />
                  Needs review
                </span>
                <span className="tag">Not connected</span>
              </div>
            </div>
            <div>
              <span className="eyebrow">Input</span>
              <label className="field">
                <span>Project name</span>
                <input defaultValue="RelayDesk" readOnly />
              </label>
            </div>
          </div>
        </section>
        <section className="design-section">
          <div className="design-section-label">
            <span className="number-label">04</span>
            <h2>A connected journey</h2>
            <p>
              Context travels forward. Users never need to restart a task to
              take the next step.
            </p>
          </div>
          <div>
            <div className="design-lifecycle">
              {["Define", "Build", "Verify", "Review", "Release"].map(
                (step, i) => (
                  <div key={step}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <strong>{step}</strong>
                    {i < 4 && <ArrowRight />}
                  </div>
                ),
              )}
            </div>
            <div className="principle-row">
              <ShieldCheck />
              <div>
                <strong>Evidence belongs to a version</strong>
                <p>
                  Relevant edits invalidate verification and approval. Local
                  actions never imply external success.
                </p>
              </div>
            </div>
            <div className="principle-row">
              <Check />
              <div>
                <strong>Save the work, not just the screen</strong>
                <p>
                  Project conversations, saved builds, Bot organisations and
                  approved memory persist in the workspace. Unsaved edits remain
                  clearly marked.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="design-section">
          <div className="design-section-label">
            <span className="number-label">05</span>
            <h2>Responsive by design</h2>
            <p>
              Fixed typography and flexible layouts, with a deliberate mobile
              composition.
            </p>
          </div>
          <div className="type-specimens">
            <div>
              <span>Wide / 1150px+</span>
              <p>
                Full navigation, conversation, and preview. Detail inspector
                beside the workflow.
              </p>
            </div>
            <div>
              <span>Compact / 801-1150px</span>
              <p>
                Narrow navigation. Supporting panels stack when content needs
                more space.
              </p>
            </div>
            <div>
              <span>Mobile / 800px and below</span>
              <p>
                Drawer navigation, stacked conversation and preview,
                stacked inspectors, and scrollable graph controls.
              </p>
            </div>
          </div>
        </section>
        <section className="design-section">
          <div className="design-section-label">
            <span className="number-label">06</span>
            <h2>Reference, not imitation</h2>
          </div>
          <div className="type-specimens">
            <p>
              The direction follows the requested geometric, connected-flow
              aesthetic. It does not reproduce a named Lyzr, Cube, or Flow
              product.
            </p>
            <p>
              <a className="text-button" href="https://reactflow.dev/learn">
                React Flow
                <ArrowRight />
              </a>{" "}
              provides graph interaction, keyboard controls, panning, and
              connection handling. Kova owns the visual treatment and journey.
            </p>
            <p>
              <a href="https://vercel.com/geist/typography">Geist</a> informs
              precise typography;{" "}
              <a href="https://linear.app/docs/projects">Linear</a> informs
              project-oriented navigation. Kova keeps its own composition,
              colour system and interaction flows.
            </p>
            <p>
              Silver is the default. Graphite and four developer themes remain
              available. Current tokens live in <code>src/lib/theme.ts</code>;
              workspace rules live in <code>src/styles/platform-v3.css</code>.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
