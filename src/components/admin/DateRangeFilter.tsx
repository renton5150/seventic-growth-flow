import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  onDateRangeChange: (range: DateRange | null) => void;
  currentRange: DateRange | null;
}

export const DateRangeFilter = ({ onDateRangeChange, currentRange }: DateRangeFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const presetRanges = [
    {
      label: "Aujourd'hui",
      range: {
        from: startOfDay(new Date()),
        to: endOfDay(new Date())
      }
    },
    {
      label: "Cette semaine",
      range: {
        from: startOfWeek(new Date(), { locale: fr }),
        to: endOfWeek(new Date(), { locale: fr })
      }
    },
    {
      label: "La semaine dernière",
      range: {
        from: startOfWeek(subWeeks(new Date(), 1), { locale: fr }),
        to: endOfWeek(subWeeks(new Date(), 1), { locale: fr })
      }
    },
    {
      label: "Ce mois",
      range: {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      }
    },
    {
      label: "Ce trimestre",
      range: {
        from: startOfQuarter(new Date()),
        to: endOfQuarter(new Date())
      }
    },
    {
      label: "Cette année",
      range: {
        from: startOfYear(new Date()),
        to: endOfYear(new Date())
      }
    },
    {
      label: "30 derniers jours",
      range: {
        from: startOfDay(subDays(new Date(), 30)),
        to: endOfDay(new Date())
      }
    }
  ];

  const handlePresetClick = (range: DateRange) => {
    onDateRangeChange(range);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    onDateRangeChange(null);
    setIsOpen(false);
  };

  const formatDateRange = (range: DateRange | null) => {
    if (!range) return "Toutes les dates";
    return `${format(range.from, "dd MMM", { locale: fr })} - ${format(range.to, "dd MMM", { locale: fr })}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange(currentRange)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Filtrer par période</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col gap-1">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start h-8"
                  onClick={() => handlePresetClick(preset.range)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="border-t pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-8 w-full"
                onClick={handleClearFilter}
              >
                Supprimer le filtre
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
