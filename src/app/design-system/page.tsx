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
  ["Canvas", "#141617", "Page and graph backgrounds"],
  ["Surface", "#1B1D1F", "Navigation and workspace panels"],
  ["Raised", "#232628", "Menus and dialogs"],
  ["Border", "#303537", "Quiet separation"],
  ["Jade", "#ACD4BE", "Primary actions and selection"],
  ["Steel", "#9BBBCF", "Secondary data signals"],
  ["Amber", "#DBB575", "Warnings and attention"],
  ["Clay", "#E5A39E", "Destructive and error states"],
];

export default function DesignSystemPage() {
  return (
    <div className="design-reference">
      <header className="product-topbar">
        <BrandMark context="Design system / 02" />
        <Link className="text-button" href="/projects">
          <ArrowLeft />
          Workspace
        </Link>
      </header>
      <main className="hub-main">
        <div className="hub-heading">
          <div>
            <span className="eyebrow">Kova / Graphite</span>
            <h1>Quiet confidence. Clear intent.</h1>
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
              <span>Page / 28px / 550</span>
              <h1>A clear plan. A better build.</h1>
            </div>
            <div>
              <span>Section / 18px / 550</span>
              <h2>Every change, accounted for.</h2>
            </div>
            <div>
              <span>Body / 14px / 400</span>
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
                  Prompt drafts, requirements, data, agent graphs, and release
                  records persist on this device.
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
              <span>Compact / 681–1150px</span>
              <p>
                Narrow navigation. Supporting panels stack when content needs
                more space.
              </p>
            </div>
            <div>
              <span>Mobile / 680px and below</span>
              <p>
                Bottom navigation, separate conversation and preview tabs,
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
              The initial Ember / Action Blue design is superseded by this
              Graphite / Jade revision. Current tokens live in{" "}
              <code>src/app/globals.css</code>.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
