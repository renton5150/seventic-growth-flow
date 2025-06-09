
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { craService } from "@/services/cra/craService";
import { DailyActivityReport } from "@/types/cra.types";
import { isWeekend } from "date-fns";

interface CRACalendarProps {
  sdrId?: string;
  onDateSelect: (date: string) => void;
}

export const CRACalendar = ({ sdrId, onDateSelect }: CRACalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthReports, setMonthReports] = useState<DailyActivityReport[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    loadMonthReports();
  }, [currentDate, sdrId]);

  const loadMonthReports = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    try {
      const reports = await craService.getCRAsByPeriod(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0],
        sdrId
      );
      setMonthReports(reports);
    } catch (error) {
      console.error("Erreur lors du chargement des rapports:", error);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getReportForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return monthReports.find(report => report.report_date === dateStr);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Ajouter les jours vides du début
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ajouter tous les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    // Empêcher la sélection des weekends
    if (isWeekend(date)) {
      return;
    }
    
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    onDateSelect(dateStr);
  };

  const getDateStatus = (date: Date) => {
    const report = getReportForDate(date);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today && !isToday;
    const isWeekendDay = isWeekend(date);
    
    if (isWeekendDay) {
      return { status: 'weekend', color: 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed' };
    }
    
    if (!report && isPast) {
      return { status: 'missing', color: 'bg-red-100 border-red-300 text-red-700 cursor-pointer hover:bg-red-200' };
    }
    if (report?.is_completed) {
      return { status: 'completed', color: 'bg-green-100 border-green-300 text-green-700 cursor-pointer hover:bg-green-200' };
    }
    if (report && !report.is_completed) {
      return { status: 'partial', color: 'bg-orange-100 border-orange-300 text-orange-700 cursor-pointer hover:bg-orange-200' };
    }
    if (isToday) {
      return { status: 'today', color: 'bg-blue-100 border-blue-300 text-blue-700 cursor-pointer hover:bg-blue-200' };
    }
    return { status: 'future', color: 'bg-gray-50 border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-100' };
  };

  const days = getDaysInMonth();
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendrier CRA
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-32 text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-16" />;
            }
            
            const dateStatus = getDateStatus(date);
            const report = getReportForDate(date);
            const isSelected = selectedDate === date.toISOString().split('T')[0];
            const isWeekendDay = isWeekend(date);
            
            return (
              <div
                key={index}
                className={`
                  h-16 border-2 rounded-lg p-2 transition-all
                  ${dateStatus.color}
                  ${isSelected && !isWeekendDay ? 'ring-2 ring-primary' : ''}
                  ${!isWeekendDay ? 'hover:shadow-md' : ''}
                `}
                onClick={() => handleDateClick(date)}
              >
                <div className="text-sm font-semibold">
                  {date.getDate()}
                </div>
                {report && (
                  <div className="text-xs">
                    {report.total_percentage}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Légende */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm">Complété</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span className="text-sm">Partiel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-sm">Manquant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span className="text-sm">Aujourd'hui</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
            <span className="text-sm">Weekend</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
