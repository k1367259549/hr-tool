import { transitionEvaluationRunLifecycle } from "@/lib/evaluation/run-state-transition";
import {
  EvaluationRunLifecycleSnapshotSchema,
  type EvaluationRunFailureReason,
  type EvaluationRunLifecycleEvent,
  type EvaluationRunLifecycleSnapshot
} from "@/types/evaluation-run-lifecycle";

type LifecycleValidationResult =
  | {
      success: true;
      snapshot: EvaluationRunLifecycleSnapshot;
    }
  | {
      success: false;
      error: string;
    };

type TransitionValidationParams = {
  snapshot: EvaluationRunLifecycleSnapshot;
  event: EvaluationRunLifecycleEvent;
  now?: Date;
  error?: string;
  failureReason?: EvaluationRunFailureReason;
};

export function validateEvaluationRunLifecycleSnapshot(
  input: unknown
): LifecycleValidationResult {
  const result = EvaluationRunLifecycleSnapshotSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error:
        result.error.issues[0]?.message ??
        "EvaluationRun lifecycle snapshot is invalid."
    };
  }

  return {
    success: true,
    snapshot: result.data
  };
}

export function validateEvaluationRunLifecycleTransition(
  params: TransitionValidationParams
): LifecycleValidationResult {
  const transition = transitionEvaluationRunLifecycle(params.snapshot, params.event, {
    error: params.error,
    failureReason: params.failureReason,
    now: params.now
  });

  if (!transition.success) {
    return transition;
  }

  return validateEvaluationRunLifecycleSnapshot(transition.snapshot);
}
