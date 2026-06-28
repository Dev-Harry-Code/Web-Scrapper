"use client";

import { ExternalLink } from "lucide-react";

import type {
  ResearchReport,
} from "@/app/page";

interface ReportViewProps {
  report: ResearchReport;
}

/* -------------------------------------------------------------------------- */
/*                               Markdown Parser                              */
/* -------------------------------------------------------------------------- */

function parseBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong
        key={index}
        className="font-semibold text-green-400"
      >
        {part}
      </strong>
    ) : (
      part
    )
  );
}

function renderContent(text: string) {
  const lines = text
    .split("\n")
    .filter((line) => line.trim() !== "");

  return lines.map((line, index) => {
    const value = line.trim();

    /* ---------- H1 ---------- */

    if (value.startsWith("# ")) {
      return (
        <h2
          key={index}
          className="mt-10 mb-4 text-3xl font-bold text-white"
        >
          {value.replace("# ", "")}
        </h2>
      );
    }

    /* ---------- H2 ---------- */

    if (value.startsWith("## ")) {
      return (
        <h3
          key={index}
          className="mt-8 mb-3 text-2xl font-semibold text-white"
        >
          {value.replace("## ", "")}
        </h3>
      );
    }

    /* ---------- Bullet ---------- */

    if (
      value.startsWith("- ") ||
      value.startsWith("* ")
    ) {
      return (
        <li
          key={index}
          className="ml-6 list-disc leading-8 text-neutral-300"
        >
          {parseBold(value.substring(2))}
        </li>
      );
    }

    /* ---------- Numbered ---------- */

    if (/^\d+\./.test(value)) {
      return (
        <li
          key={index}
          className="ml-6 list-decimal leading-8 text-neutral-300"
        >
          {parseBold(
            value.replace(/^\d+\.\s*/, "")
          )}
        </li>
      );
    }

    /* ---------- Table ---------- */

    if (value.includes("|")) {
      return (
        <pre
          key={index}
          className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-sm text-green-300"
        >
          {value}
        </pre>
      );
    }

    /* ---------- Paragraph ---------- */

    return (
      <p
        key={index}
        className="leading-8 text-neutral-300"
      >
        {parseBold(value)}
      </p>
    );
  });
}

/* -------------------------------------------------------------------------- */
/*                              Section Component                             */
/* -------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------- */
/*                             COMPONENT START                                */
/* -------------------------------------------------------------------------- */

export default function ReportView({
  report,
}: ReportViewProps) {
  return (
    <div className="space-y-12">

      {/* =========================
          PART 2 STARTS HERE
      ========================= */}
            {/* ================= EXECUTIVE SUMMARY ================= */}

      <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-8">

        <div className="mb-6 flex items-center gap-3">

          <div className="h-3 w-3 rounded-full bg-green-500" />

          <h2 className="text-2xl font-bold">
            Executive Summary
          </h2>

        </div>

        <div className="space-y-5 leading-8 text-neutral-300">

          {renderContent(report.summary)}

        </div>

      </section>

      {/* ================= RESEARCH SECTIONS ================= */}

      <section className="space-y-8">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-3xl font-bold">
              Research Findings
            </h2>

            <p className="mt-2 text-neutral-400">
              AI-generated analysis synthesized from the selected web sources.
            </p>

          </div>

        </div>

        {report.sections.map((section) => (

          <div
            key={section.id}
            className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900"
          >

            {/* ---------- Section Header ---------- */}

            <div className="border-b border-neutral-800 px-8 py-6">

              <h3 className="text-2xl font-semibold">
                {section.title}
              </h3>

            </div>

            {/* ---------- Section Content ---------- */}

            <div className="space-y-5 px-8 py-8">

              {renderContent(section.content)}

            </div>

            {/* ---------- Citations ---------- */}

            {section.citations.length > 0 && (

              <div className="border-t border-neutral-800 bg-neutral-950/40 px-8 py-6">

                <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
                  Sources
                </h4>

                <div className="space-y-3">

                  {section.citations.map((citation, index) => (

                    <a
                      key={index}
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 transition hover:border-green-500 hover:bg-green-500/5"
                    >

                      <div className="flex items-center gap-3">

                        <span className="rounded-md bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-400">
                          {citation.label}
                        </span>

                        <span className="truncate text-sm text-neutral-300">
                          {citation.url}
                        </span>

                      </div>

                      <ExternalLink
                        size={16}
                        className="text-green-400"
                      />

                    </a>

                  ))}

                </div>

              </div>

            )}

          </div>

        ))}

      </section>

      {/* =========================
          PART 3 STARTS HERE
      ========================= */}
            {/* ================= CONCLUSION ================= */}

      <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-8">

        <div className="mb-6 flex items-center gap-3">

          <div className="h-3 w-3 rounded-full bg-green-500" />

          <h2 className="text-2xl font-bold">
            Conclusion
          </h2>

        </div>

        <div className="space-y-5 leading-8 text-neutral-300">

          {renderContent(report.conclusion)}

        </div>

      </section>

      {/* ================= REFERENCES ================= */}

      <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-8">

        <div className="mb-8 flex items-center gap-3">

          <div className="h-3 w-3 rounded-full bg-green-500" />

          <h2 className="text-2xl font-bold">
            References
          </h2>

        </div>

        <div className="space-y-4">

          {report.references.map((reference) => (

            <a
              key={reference.id}
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-950 px-5 py-4 transition hover:border-green-500 hover:bg-green-500/5"
            >

              <div className="min-w-0 flex-1">

                <div className="flex items-center gap-3">

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-sm font-bold text-green-400">
                    [{reference.id}]
                  </span>

                  <span className="truncate font-medium text-white">
                    {reference.title}
                  </span>

                </div>

                <p className="mt-2 truncate pl-11 text-sm text-neutral-500">
                  {reference.url}
                </p>

              </div>

              <ExternalLink
                size={18}
                className="ml-4 text-neutral-500 transition group-hover:text-green-400"
              />

            </a>

          ))}

        </div>

      </section>

    </div>
  );
}