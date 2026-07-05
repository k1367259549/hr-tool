import {
  createEvaluationRunPersistenceRecord,
  validateEvaluationRunAuditEvent,
  validateEvaluationRunCreateInput,
  validateEvaluationRunLifecycleForPersistence,
  validateEvaluationRunOutputForPersistence,
  type EvaluationRunAuditEvent,
  type EvaluationRunCreateInput,
  type EvaluationRunPersistenceRecord,
  type EvaluationRunRepository
} from "@/lib/evaluation/run-persistence-contract";
import type { ResumeEvaluationResult } from "@/types/evaluation-output";
import type { EvaluationRunLifecycleSnapshot } from "@/types/evaluation-run-lifecycle";

type MemoryEvaluationRunRepositoryOptions = {
  now?: () => Date;
};

export class MemoryEvaluationRunRepository implements EvaluationRunRepository {
  private readonly auditEvents = new Map<string, EvaluationRunAuditEvent[]>();
  private readonly now: () => Date;
  private readonly runs = new Map<string, EvaluationRunPersistenceRecord>();

  constructor(options: MemoryEvaluationRunRepositoryOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  async createRun(
    input: EvaluationRunCreateInput
  ): Promise<EvaluationRunPersistenceRecord> {
    const validated = validateEvaluationRunCreateInput(input);

    if (!validated.success) {
      throw new Error(validated.error);
    }

    if (this.runs.has(validated.input.id)) {
      throw new Error("EvaluationRun already exists.");
    }

    const record = createEvaluationRunPersistenceRecord({
      ...validated.input,
      updatedAt: validated.input.createdAt
    });

    this.runs.set(record.id, clone(record));
    this.auditEvents.set(record.id, []);

    return clone(record);
  }

  async updateRunLifecycle(
    runId: string,
    snapshot: EvaluationRunLifecycleSnapshot
  ): Promise<EvaluationRunPersistenceRecord> {
    const existing = this.runs.get(runId);

    if (!existing) {
      throw new Error("EvaluationRun not found.");
    }

    const validated = validateEvaluationRunLifecycleForPersistence(snapshot);

    if (!validated.success) {
      throw new Error(validated.error);
    }

    if (validated.snapshot.runId !== runId) {
      throw new Error("Lifecycle snapshot runId must match EvaluationRun runId.");
    }

    const record = createEvaluationRunPersistenceRecord({
      ...existing,
      lifecycleSnapshot: validated.snapshot,
      output: existing.output,
      updatedAt: this.now().toISOString()
    });

    this.runs.set(runId, clone(record));

    return clone(record);
  }

  async saveRunOutput(
    runId: string,
    output: ResumeEvaluationResult
  ): Promise<EvaluationRunPersistenceRecord> {
    const existing = this.runs.get(runId);

    if (!existing) {
      throw new Error("EvaluationRun not found.");
    }

    const validated = validateEvaluationRunOutputForPersistence(output);

    if (!validated.success) {
      throw new Error(validated.error);
    }

    const record = {
      ...existing,
      output: validated.output,
      updatedAt: this.now().toISOString()
    };

    this.runs.set(runId, clone(record));

    return clone(record);
  }

  async appendAuditEvent(
    runId: string,
    event: EvaluationRunAuditEvent
  ): Promise<EvaluationRunAuditEvent> {
    if (!this.runs.has(runId)) {
      throw new Error("EvaluationRun not found.");
    }

    const validated = validateEvaluationRunAuditEvent(event);

    if (!validated.success) {
      throw new Error(validated.error);
    }

    if (validated.event.runId !== runId) {
      throw new Error("Audit event runId must match EvaluationRun runId.");
    }

    const events = this.auditEvents.get(runId) ?? [];

    events.push(clone(validated.event));
    this.auditEvents.set(runId, events);

    return clone(validated.event);
  }

  async findRunById(runId: string): Promise<EvaluationRunPersistenceRecord | null> {
    const record = this.runs.get(runId);

    return record ? clone(record) : null;
  }

  async findAuditEventsByRunId(runId: string): Promise<EvaluationRunAuditEvent[]> {
    return clone(this.auditEvents.get(runId) ?? []);
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
