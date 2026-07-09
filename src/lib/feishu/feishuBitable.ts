import type { FeishuClient } from "@/lib/feishu/feishuClient";

export type FeishuCandidateInterviewStatusUpdate = {
  appToken: string;
  tableId: string;
  recordId: string;
  status: string;
  round: string;
  scheduledStartTime: string;
  interviewerEmail: string;
  calendarEventId: string;
  syncStatus: string;
  syncedAt: string;
};

export async function updateFeishuCandidateInterviewStatus(
  client: Pick<FeishuClient, "request">,
  input: FeishuCandidateInterviewStatusUpdate
): Promise<void> {
  await client.request(
    `/open-apis/bitable/v1/apps/${encodeURIComponent(input.appToken)}/tables/${encodeURIComponent(
      input.tableId
    )}/records/${encodeURIComponent(input.recordId)}`,
    {
      body: JSON.stringify({
        fields: {
          当前状态: input.status,
          面试轮次: input.round,
          预约时间: input.scheduledStartTime,
          面试官: input.interviewerEmail,
          飞书日程ID: input.calendarEventId,
          同步状态: input.syncStatus,
          最后同步时间: input.syncedAt
        }
      }),
      method: "PUT"
    }
  );
}

