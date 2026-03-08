import { getSystem } from "@/lib/manifest";

export default function AboutPage() {
  const system = getSystem();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">About ORGANVM</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          An eight-organ creative-institutional system
        </p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          What is this?
        </h2>
        <p>
          ORGANVM is a solo-operated creative infrastructure consisting of{" "}
          {system.total_repos} repositories organized across {system.total_organs}{" "}
          &ldquo;organs&rdquo; &mdash; each a distinct institutional function
          (theory, art, commerce, orchestration, discourse, community,
          distribution, governance).
        </p>
        <p>
          The system launched on {system.launch_date} and has completed{" "}
          {system.sprints_completed} development sprints. It uses an
          AI-conductor methodology where a single human directs AI-augmented
          production across all organs simultaneously.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          AI-Conductor Methodology
        </h2>
        <p>
          Traditional software projects measure effort in person-hours. ORGANVM
          measures effort in LLM tokens. A single operator directs AI systems
          to produce years-worth of conventional development density in
          days/weeks.
        </p>
        <p>
          The human provides architectural direction, quality review, and
          creative judgment. AI generates volume: code, documentation, tests,
          CI/CD, and infrastructure. Every repo has a CLAUDE.md file providing
          AI with full contextual awareness of the project&apos;s architecture,
          conventions, and constraints.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          The Eight Organs
        </h2>
        <dl className="space-y-3">
          <div>
            <dt className="font-medium text-[var(--color-text)]">
              I. Theoria (Theory)
            </dt>
            <dd>
              Foundational theory, recursive engines, symbolic computing.
              Epistemological frameworks that underpin all other organs.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-text)]">
              II. Poiesis (Art)
            </dt>
            <dd>
              Generative art, performance systems, creative coding. Artistic
              expression as computational practice.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-text)]">
              III. Ergon (Commerce)
            </dt>
            <dd>
              Commercial products, SaaS tools, developer utilities. Revenue
              engines for sustainable creative practice.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-text)]">
              IV. Taxis (Orchestration)
            </dt>
            <dd>
              Governance, AI agents, cross-organ coordination. The nervous
              system that keeps all organs synchronized.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-text)]">
              V. Logos (Discourse)
            </dt>
            <dd>
              Public essays, editorial, analytics. The voice of the system,
              observing and articulating its own process.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-text)]">
              VI. Koinonia (Community)
            </dt>
            <dd>
              Reading groups, salons, learning communities. Human connection
              around shared intellectual practice.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-text)]">
              VII. Kerygma (Distribution)
            </dt>
            <dd>
              POSSE distribution, social automation, announcements. Getting the
              work into the world via decentralized channels.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--color-text)]">
              META-ORGANVM (Governance)
            </dt>
            <dd>
              Cross-organ engine, schemas, dashboards, governance corpus. The
              meta-system that manages the system itself.
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Key Design Principles
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Unidirectional dependency flow:</strong> I (Theory) feeds
            II (Art) feeds III (Commerce). No back-edges. IV orchestrates all.
          </li>
          <li>
            <strong>Promotion state machine:</strong> Every repo progresses
            through LOCAL, CANDIDATE, PUBLIC_PROCESS, GRADUATED, or ARCHIVED.
            No state skipping.
          </li>
          <li>
            <strong>Process as product:</strong> The governance infrastructure
            itself is the primary creative output, not just the individual
            repos.
          </li>
          <li>
            <strong>Simultaneous launch:</strong> All organs launched together
            to demonstrate integrated systems thinking.
          </li>
        </ul>
      </section>

      <section className="text-sm text-[var(--color-text-muted)]">
        <h2 className="mb-2 text-lg font-semibold text-[var(--color-text)]">
          This Portal
        </h2>
        <p>
          The Stakeholder Intelligence Portal (codename: Hermeneus) provides
          real-time intelligence about the entire ORGANVM system. Browse
          repositories, explore organ architecture, and ask natural language
          questions via AI-powered chat. Data is regenerated from the live
          codebase at each deployment.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          The Facets
        </h2>
        <p>
          ORGANVM&apos;s web presence is not one site &mdash; it&apos;s a prism.
          Four facets, each at a different depth, each answering a different
          question. The journey between them is itself part of the work.
        </p>
        <dl className="space-y-4">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <dt className="font-medium text-[var(--color-text)]">
              Surface &mdash;{" "}
              <a
                href="https://4444j99.github.io/portfolio/?prism=hermeneus.about"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:underline"
              >
                Portfolio
              </a>
            </dt>
            <dd className="mt-1">
              &ldquo;Who is this?&rdquo; &mdash; The public face. Projects,
              credentials, services. Where first impressions form.
            </dd>
          </div>
          <div className="rounded-lg border border-blue-800/50 bg-blue-950/20 p-4">
            <dt className="font-medium text-blue-400">
              Intelligence &mdash; Hermeneus
            </dt>
            <dd className="mt-1">
              &ldquo;What built it?&rdquo; &mdash; You are here. The technical
              intelligence layer. Every repo, every organ, every dependency
              visible and queryable.
            </dd>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 opacity-60">
            <dt className="font-medium text-[var(--color-text)]">
              Memory &mdash; Knowledge Base
            </dt>
            <dd className="mt-1">
              &ldquo;What does he know?&rdquo; &mdash; The personal knowledge
              graph. Books, papers, notes, connections. Not yet public.
            </dd>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 opacity-60">
            <dt className="font-medium text-[var(--color-text)]">
              Laboratory &mdash; Nexus Babel Alexandria
            </dt>
            <dd className="mt-1">
              &ldquo;What are texts made of?&rdquo; &mdash; Linguistic
              atomization engine. Breaking texts into their smallest meaningful
              units. Not yet public.
            </dd>
          </div>
        </dl>
        <p className="text-xs opacity-60">
          Each step inward is an invitation, not a redirect. The space between
          facets is where the audience completes the work.
        </p>
      </section>
    </div>
  );
}
