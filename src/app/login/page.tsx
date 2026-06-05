"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { IdEntry } from "@/components/IdEntry";

export default function EnterPage() {
  const { t } = useLocale();
  const tt = t.entry;
  const router = useRouter();

  return (
    <div className="veil max-w-sm mx-auto space-y-6 py-6">
      <div className="space-y-1 text-center">
        <p className="phase-label">{tt.label}</p>
        <h1 className="text-2xl">{tt.title}</h1>
      </div>
      <IdEntry onDone={() => router.push("/today")} />
    </div>
  );
}
