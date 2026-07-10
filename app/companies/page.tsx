import { Suspense } from "react";
import { CompaniesContent } from "./companies-content";

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <CompaniesContent />
    </Suspense>
  );
}
