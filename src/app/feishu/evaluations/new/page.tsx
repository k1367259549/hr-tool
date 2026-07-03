import { Suspense } from "react";
import { NewEvaluationPage } from "@/features/evaluation-result/components/NewEvaluationPage";

export default function FeishuNewEvaluationPage(): JSX.Element {
  return (
    <Suspense>
      <NewEvaluationPage />
    </Suspense>
  );
}
