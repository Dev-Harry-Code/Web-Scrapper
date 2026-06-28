"use client";

import { useState } from "react";

import {
  Search,
  Loader2,
  BrainCircuit,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import ReportView from "@/components/ReportView";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type SearchResult = {
  title: string;
  link: string;
  snippet: string;
};

export interface Citation {
  label: string;
  url: string;
}

export interface Section {
  id: string;
  title: string;
  content: string;
  citations: Citation[];
}

export interface Reference {
  id: number;
  title: string;
  url: string;
}

export interface ResearchReport {
  title: string;
  summary: string;
  sections: Section[];
  conclusion: string;
  references: Reference[];
}

/* -------------------------------------------------------------------------- */

export default function Home() {
  const [query, setQuery] = useState("");

  const [mode, setMode] = useState<"auto" | "manual">("auto");

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(
    new Set()
  );

  const [report, setReport] =
    useState<ResearchReport | null>(null);

  const [isSearching, setIsSearching] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  /* -------------------------------------------------------------------------- */
  /*                               SEARCH HANDLER                               */
  /* -------------------------------------------------------------------------- */

  async function handleSearch(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!query.trim()) return;

    setIsSearching(true);

    setReport(null);

    setSearchResults([]);

    setSelectedUrls(new Set());

    try {
      const response = await fetch("/api/search", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          query,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      const results: SearchResult[] =
        data.results || [];

      setSearchResults(results);

      /* -------------------------- AUTOMATIC MODE -------------------------- */

      if (
        mode === "auto" &&
        results.length > 0
      ) {
        const urls = results
          .slice(0, 5)
          .map((r) => r.link);

        setSelectedUrls(new Set(urls));

        await generateReport(
          urls,
          results
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              TOGGLE CHECKBOX                               */
  /* -------------------------------------------------------------------------- */

  function toggleSelection(url: string) {
    const next = new Set(selectedUrls);

    if (next.has(url)) {
      next.delete(url);
    } else {
      next.add(url);
    }

    setSelectedUrls(next);
  }

  /* -------------------------------------------------------------------------- */
  /*                              GENERATE REPORT                               */
  /* -------------------------------------------------------------------------- */

  async function generateReport(
    autoUrls?: string[],
    autoSearchResults?: SearchResult[]
  ) {
    const urls =
      autoUrls ??
      Array.from(selectedUrls);

    if (urls.length === 0) return;

    setIsGenerating(true);

    try {
      const response = await fetch(
        "/api/process",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            query,

            urls,

            auto:
              mode === "auto",

            searchResults:
              autoSearchResults ??
              searchResults,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Failed to generate report"
        );
      }

      setReport(data.report);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  /* -------------------------------------------------------------------------- */

  function resetSearch() {
    setQuery("");

    setReport(null);

    setSearchResults([]);

    setSelectedUrls(new Set());
  }

  /* ============================
     PART 2 STARTS BELOW
  ============================ */

  return (
        <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">

        {/* ================= HERO ================= */}

        <section className="mx-auto max-w-4xl">

          <div className="space-y-5 text-center">

            <span className="inline-flex items-center rounded-full border border-green-600/30 bg-green-500/10 px-4 py-1 text-sm text-green-400">
              Ultimate Research Engine
            </span>

            <div className="relative flex items-center justify-center">

              <div className="absolute h-20 w-52 rounded-full bg-green-400/15 blur-xl" />

              <h1 className="relative text-5xl font-extrabold italic tracking-tight">
                Scrappy
              </h1>

            </div>

            <p className="mx-auto max-w-2xl leading-7 text-neutral-400">
              Search the web, analyze trusted sources seemlessly, and generate
              comprehensive research reports in seconds.
            </p>

          </div>

          {/* ================= MODE ================= */}

          <div className="mt-10 mb-6 flex justify-center">

            <RadioGroup
              value={mode}
              onValueChange={(value) =>
                setMode(value as "auto" | "manual")
              }
              className="flex gap-8 rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="auto"
                  id="auto"
                />

                <Label
                  htmlFor="auto"
                  className="cursor-pointer"
                >
                  Automatic
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="manual"
                  id="manual"
                />

                <Label
                  htmlFor="manual"
                  className="cursor-pointer"
                >
                  Manual
                </Label>
              </div>
            </RadioGroup>

          </div>

          {/* ================= SEARCH ================= */}

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-12 max-w-4xl"
          >

            <div className="flex items-center rounded-2xl border border-neutral-800 bg-neutral-900 px-3 py-3 transition-colors focus-within:border-green-500">

              <Search className="ml-2 mr-4 h-5 w-5 text-neutral-500" />

              <Input
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                placeholder="Search anything..."
                className="mr-5 h-12 flex-1 border-0 bg-transparent px-5 text-lg shadow-none placeholder:text-neutral-500 focus-visible:ring-0"
              />

              <Button
                type="submit"
                disabled={
                  isSearching || !query.trim()
                }
                className="h-12 rounded-xl px-6 font-medium"
              >
                {isSearching ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>

            </div>

          </form>

        </section>

        {/* ================= MANUAL SEARCH RESULTS ================= */}

        {mode === "manual" &&
          searchResults.length > 0 &&
          !report &&
          !isGenerating && (

            <section className="mt-14">

              <div className="mb-8 flex items-center justify-between">

                <div>

                  <h2 className="text-2xl font-semibold">
                    Search Results
                  </h2>

                  <p className="mt-1 text-sm text-neutral-400">
                    Choose the webpages you want Scrappy to analyze.
                  </p>

                </div>

                <Button
                  onClick={() => generateReport()}
                  disabled={
                    selectedUrls.size === 0
                  }
                  className="gap-2"
                >
                  <BrainCircuit className="h-4 w-4" />

                  Generate Report

                  {selectedUrls.size > 0 && (
                    <span className="rounded bg-white/10 px-2 py-0.5 text-xs">
                      {selectedUrls.size}
                    </span>
                  )}

                </Button>

              </div>

              <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">

                {searchResults.map(
                  (result, index) => {

                    const checked =
                      selectedUrls.has(
                        result.link
                      );

                    return (

                      <label
                        key={index}
                        htmlFor={`source-${index}`}
                        className={`flex cursor-pointer items-start gap-5 border-b border-neutral-800 p-6 transition last:border-none ${
                          checked
                            ? "bg-green-500/5"
                            : "hover:bg-neutral-800/60"
                        }`}
                      >

                        <Checkbox
                          id={`source-${index}`}
                          checked={checked}
                          onCheckedChange={() =>
                            toggleSelection(
                              result.link
                            )
                          }
                          className="mt-1"
                        />

                        <div className="min-w-0 flex-1">

                          <h3 className="text-lg font-semibold leading-6">
                            {result.title}
                          </h3>

                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-400">
                            {result.snippet}
                          </p>

                          <a
                            href={result.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) =>
                              e.stopPropagation()
                            }
                            className="mt-4 block truncate text-sm text-green-400 hover:text-green-300"
                          >
                            {result.link}
                          </a>

                        </div>

                      </label>

                    );
                  }
                )}

              </div>

            </section>

          )}

        {/* ================= PART 3 STARTS HERE ================= */}
                {/* ================= GENERATING ================= */}

        {isGenerating && (
          <section className="mt-20">

            <div className="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border border-neutral-800 bg-neutral-900 px-10 py-16 text-center">

              <Loader2 className="mb-6 h-10 w-10 animate-spin text-green-500" />

              <h2 className="text-2xl font-semibold">
                {mode === "auto"
                  ? "Researching the Web"
                  : "Generating Report"}
              </h2>

              <p className="mt-4 max-w-lg leading-7 text-neutral-400">
                {mode === "auto"
                  ? "Searching, ranking trustworthy sources, scraping webpages, and generating a structured research report..."
                  : "Reading your selected webpages and organizing everything into a comprehensive structured research report."}
              </p>

            </div>

          </section>
        )}

        {/* ================= REPORT ================= */}

        {report && !isGenerating && (

          <section className="mt-16">

            <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div className="flex gap-3">

                <Button
                  variant="outline"
                  onClick={() => setReport(null)}
                >
                  Back
                </Button>

                <Button
                  variant="destructive"
                  onClick={resetSearch}
                >
                  New Search
                </Button>

              </div>

            </div>

            <ReportView report={report} />

          </section>

        )}

      </div>

    </main>

  );

}