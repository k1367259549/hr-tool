import { describe, expect, it } from "vitest";
import {
  createFeishuCalendarEvent,
  listFeishuBusyTimes
} from "@/lib/feishu/feishuCalendar";

describe("feishuCalendar", () => {
  it("queries interviewer freebusy with explicit time range", async () => {
    const requestCalls: Array<[string, RequestInit | undefined]> = [];
    const request = createRequestRecorder(requestCalls, {
      freebusy_list: [
        {
          end_time: "2026-07-10T11:00:00+08:00",
          start_time: "2026-07-10T10:00:00+08:00"
        }
      ]
    });

    const result = await listFeishuBusyTimes(
      {
        request
      },
      {
        endTime: "2026-07-10T11:00:00+08:00",
        startTime: "2026-07-10T10:00:00+08:00",
        userEmail: "interviewer@example.com"
      }
    );

    expect(result).toHaveLength(1);
    expect(requestCalls[0]?.[0]).toBe("/open-apis/calendar/v4/freebusy/list");
    expect(requestCalls[0]?.[1]).toMatchObject({
      body: JSON.stringify({
        time_max: "2026-07-10T11:00:00+08:00",
        time_min: "2026-07-10T10:00:00+08:00",
        user_id: "interviewer@example.com"
      }),
      method: "POST"
    });
  });

  it("creates event without attendees to avoid automatic candidate messaging", async () => {
    const requestCalls: Array<[string, RequestInit | undefined]> = [];
    const request = createRequestRecorder(requestCalls, {
      event: {
        event_id: "event-1"
      }
    });

    await expect(
      createFeishuCalendarEvent(
        {
          request
        },
        {
          calendarId: "primary",
          description: "Manual HR confirmed interview.",
          endTime: "2026-07-10T11:00:00+08:00",
          startTime: "2026-07-10T10:00:00+08:00",
          summary: "面试：Candidate One"
        }
      )
    ).resolves.toEqual({
      calendarEventId: "event-1"
    });

    const body = JSON.parse(String(requestCalls[0]?.[1]?.body));

    expect(body).not.toHaveProperty("attendees");
  });
});

function createRequestRecorder(
  calls: Array<[string, RequestInit | undefined]>,
  response: unknown
): <TResponse>(path: string, init?: RequestInit) => Promise<TResponse> {
  return async <TResponse>(path: string, init?: RequestInit) => {
    calls.push([path, init]);

    return response as TResponse;
  };
}
