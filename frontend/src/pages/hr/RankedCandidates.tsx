import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, TrendingUp } from "lucide-react";

import Client_ROUTEMAP from "@/misc/Client_ROUTEMAP";
import { modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";

import type { rankCandidatesForJob } from "@backend/controllers/gemini";
import type { Job } from "@backend/models/Job";
import type { GetRes } from "@backend/types/req-res";

export function RankedCandidates({ jobId }: { jobId: Job["id"] }) {
  const [modalOpen, setModalOpen] = useState(false);

  const {
    data: rankings,
    mutate: rankCandidates,
    isPending,
  } = useMutation({
    mutationFn: async () => {
      return modifiedFetch<GetRes<typeof rankCandidatesForJob>>(
        Server_ROUTEMAP.ai.root + Server_ROUTEMAP.ai.rankCandidates,
        {
          method: "post",
          body: JSON.stringify({ jobId }),
        },
      );
    },

    onError: (error) => {
      toast.error(error.message);
      setModalOpen(false);
    },
  });

  const handleOpen = () => {
    rankCandidates();
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={handleOpen}
          disabled={isPending}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {isPending ? "Ranking applicants..." : "Rank Applicants with AI"}
        </Button>
      </DialogTrigger>

      <DialogContent className="min-w-6xl max-h-[85vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-1">
            <span className="text-xl font-semibold">AI Candidate Rankings</span>
            <span className="text-sm text-muted-foreground">
              AI-based analysis of applicant suitability
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Loading */}
        {isPending && (
          <div className="py-14 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Analyzing applications and calculating match scores…
            </p>
          </div>
        )}

        {/* Results */}
        {rankings && (
          <div className="space-y-5">
            {rankings.map((candidate, index) => (
              <Card
                key={candidate.candidateId}
                className="border shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <Link
                          to={`${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.candidateDetails
                            .replace(
                              Client_ROUTEMAP.hr._params.jobId,
                              jobId.toString(),
                            )
                            .replace(
                              Client_ROUTEMAP.hr._params.candidateId,
                              candidate.candidateId.toString(),
                            )}`}
                        >
                          <h3 className="text-lg font-semibold">
                            {candidate.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          AI Match Score
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600 font-bold text-xl">
                        <TrendingUp className="w-5 h-5" />
                        {candidate.matchScore}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${candidate.matchScore}%` }}
                    />
                  </div>

                  {/* Strengths & Concerns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-green-50/50 p-3">
                      <p className="text-sm font-medium text-green-700 mb-2">
                        Strengths
                      </p>
                      <ul className="space-y-1 text-sm">
                        {candidate.strengths.length ? (
                          candidate.strengths.map((s: string, i: number) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-green-600">✓</span>
                              <span>{s}</span>
                            </li>
                          ))
                        ) : (
                          <span>No strengths found</span>
                        )}
                      </ul>
                    </div>

                    <div className="rounded-lg border bg-orange-50/50 p-3">
                      <p className="text-sm font-medium text-orange-700 mb-2">
                        Concerns
                      </p>
                      <ul className="space-y-1 text-sm">
                        {candidate.concerns.map((c: string, i: number) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-orange-600">⚠</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <p className="text-sm">
                      <span className="font-medium">AI Recommendation:</span>{" "}
                      {candidate.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isPending && !rankings && (
          <div className="py-14 text-center text-muted-foreground text-sm">
            Click <span className="font-medium">“Rank Applicants with AI”</span>{" "}
            to generate intelligent candidate insights.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
