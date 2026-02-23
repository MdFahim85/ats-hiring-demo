import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";

import { ProtectedRoute } from "../../components/ProtectedRoute";
import { DashboardLayout } from "../../components/DashboardLayout";
import { modifiedFetch } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";
import Loading from "@/components/shared/Loading";

import type { GetRes } from "@backend/types/req-res";
import type { getCalendarEmbedUrl } from "../../../../backend/src/controllers/calendar";

function CalendarViewContent() {
  const navigate = useNavigate();

  const { data: calendarStatus } = useQuery({
    queryKey: [Server_ROUTEMAP.calendar.root + Server_ROUTEMAP.calendar.status],
    queryFn: () =>
      modifiedFetch<{ connected: boolean }>(
        Server_ROUTEMAP.calendar.root + Server_ROUTEMAP.calendar.status,
      ),
    retry: false,
  });

  const { data: authUrlData } = useQuery({
    queryKey: [
      Server_ROUTEMAP.calendar.root + Server_ROUTEMAP.calendar.authUrl,
    ],
    queryFn: () =>
      modifiedFetch<{ url: string }>(
        Server_ROUTEMAP.calendar.root + Server_ROUTEMAP.calendar.authUrl,
      ),
    enabled: calendarStatus?.connected === false,
    retry: false,
  });

  const {
    data: eventData,
    isLoading: isEventLoading,
    refetch,
  } = useQuery({
    queryKey: [
      Server_ROUTEMAP.calendar.root + Server_ROUTEMAP.calendar.embedURL,
    ],
    queryFn: () =>
      modifiedFetch<GetRes<typeof getCalendarEmbedUrl>>(
        Server_ROUTEMAP.calendar.root + Server_ROUTEMAP.calendar.embedURL,
      ),
    enabled: calendarStatus?.connected === true,
    retry: false,
  });

  // Not connected state
  if (calendarStatus?.connected === false) {
    return (
      <DashboardLayout>
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Interview Calendar</h1>
          <p className="text-gray-600">
            View and manage your interview schedule
          </p>
          <Button
            onClick={() => navigate(-1)}
            variant={"ghost"}
            className="group text-muted-foreground hover:text-foreground"
          >
            <span className="mr-2 transition-transform group-hover:-translate-x-1">
              ←
            </span>
            Back
          </Button>
        </div>

        <Card className="max-w-lg mx-auto mt-20">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Google Calendar Not Connected
            </h2>
            <p className="text-muted-foreground mb-6">
              Connect your Google Calendar to view and manage your interview
              schedule
            </p>
            {authUrlData?.url && (
              <Button
                onClick={() => (window.location.href = authUrlData.url)}
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Connect Google Calendar
              </Button>
            )}
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">Interview Calendar</h1>
            <p className="text-gray-600">
              View and manage your interview schedule
            </p>
            <Button
              variant={"ghost"}
              onClick={() => navigate(-1)}
              className="group text-muted-foreground hover:text-foreground mt-2"
            >
              <span className="mr-2 transition-transform group-hover:-translate-x-1">
                ←
              </span>
              Back
            </Button>
          </div>

          <div className="flex gap-2">
            {/* Refresh button */}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            {/* Open in Google Calendar */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open("https://calendar.google.com", "_blank")
              }
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Google Calendar
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Embed */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          {isEventLoading ? (
            <div className="h-175 flex items-center justify-center">
              <Loading />
            </div>
          ) : eventData?.events ? (
            <div className="p-4">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin]}
                initialView="dayGridMonth"
                events={
                  eventData?.events
                    ?.filter((event) => event.start && event.end)
                    .map((event) => ({
                      id: event.id ?? "",
                      title: event.summary ?? "Untitled Event",
                      start: event.start?.dateTime || event.start?.date || "",
                      end: event.end?.dateTime || event.end?.date || "",
                    })) || []
                }
              />
            </div>
          ) : (
            <div className="h-175 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">Failed to load calendar</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => refetch()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        Showing your Google Calendar. Interview events are automatically added
        when scheduled.
      </p>
    </DashboardLayout>
  );
}

export default function CalendarView() {
  return (
    <ProtectedRoute allowedRoles={["hr"]} allowLoggedInOnly>
      <CalendarViewContent />
    </ProtectedRoute>
  );
}
