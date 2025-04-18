
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface CalendarCardProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  datesWithEvents: Date[];
}

export const CalendarCard = ({
  selectedDate,
  onSelectDate,
  datesWithEvents
}: CalendarCardProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <CalendarComponent
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          className="rounded-md border pointer-events-auto"
          modifiers={{
            hasEvents: (date) =>
              datesWithEvents.some(
                (eventDate) => eventDate.toDateString() === date.toDateString()
              ),
          }}
          modifiersStyles={{
            hasEvents: { fontWeight: "bold" }
          }}
        />
      </CardContent>
    </Card>
  );
};
