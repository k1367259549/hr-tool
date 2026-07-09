import type { FeishuClient } from "@/lib/feishu/feishuClient";

export type FeishuBusyTime = {
  startTime: string;
  endTime: string;
};

export type FeishuCalendarEventInput = {
  calendarId: string;
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
};

type FreebusyResponse = {
  freebusy_list?: Array<{
    start_time?: string;
    end_time?: string;
  }>;
};

type CreateCalendarEventResponse = {
  event?: {
    event_id?: string;
  };
};

export async function listFeishuBusyTimes(
  client: Pick<FeishuClient, "request">,
  input: {
    userEmail: string;
    startTime: string;
    endTime: string;
  }
): Promise<FeishuBusyTime[]> {
  const data = await client.request<FreebusyResponse>("/open-apis/calendar/v4/freebusy/list", {
    body: JSON.stringify({
      time_max: input.endTime,
      time_min: input.startTime,
      user_id: input.userEmail
    }),
    method: "POST"
  });

  return (data.freebusy_list ?? []).map((item) => ({
    endTime: String(item.end_time ?? ""),
    startTime: String(item.start_time ?? "")
  }));
}

export async function createFeishuCalendarEvent(
  client: Pick<FeishuClient, "request">,
  input: FeishuCalendarEventInput
): Promise<{ calendarEventId: string }> {
  const data = await client.request<CreateCalendarEventResponse>(
    `/open-apis/calendar/v4/calendars/${encodeURIComponent(input.calendarId)}/events`,
    {
      body: JSON.stringify({
        description: input.description ?? "",
        end_time: {
          timestamp: toUnixSeconds(input.endTime).toString(),
          timezone: "Asia/Shanghai"
        },
        start_time: {
          timestamp: toUnixSeconds(input.startTime).toString(),
          timezone: "Asia/Shanghai"
        },
        summary: input.summary
      }),
      method: "POST"
    }
  );
  const calendarEventId = data.event?.event_id;

  if (!calendarEventId) {
    throw new Error("Feishu calendar event response missing event_id.");
  }

  return {
    calendarEventId
  };
}

function toUnixSeconds(value: string): number {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    throw new Error("Invalid interview time.");
  }

  return Math.floor(timestamp / 1000);
}
