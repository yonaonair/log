import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

function pad(n: number) { return String(n).padStart(2, "0"); }

function toLocalDatetimeString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface Props {
  value: string; // ISO string
  onChange: (iso: string) => void;
}

export default function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const date = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());
  const [timeStr, setTimeStr] = useState(`${pad(date.getHours())}:${pad(date.getMinutes())}`);

  useEffect(() => {
    const d = value ? new Date(value) : new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setTimeStr(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectDay = (day: number) => {
    const [h, m] = timeStr.split(":").map(Number);
    const next = new Date(viewYear, viewMonth, day, h || 0, m || 0);
    onChange(next.toISOString());
    setOpen(false);
  };

  const applyTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const current = value ? new Date(value) : new Date();
    current.setHours(h || 0, m || 0, 0, 0);
    onChange(current.toISOString());
    setTimeStr(t);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const selectedDate = value ? new Date(value) : null;
  const isSelected = (d: number) =>
    selectedDate &&
    selectedDate.getFullYear() === viewYear &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getDate() === d;
  const isToday = (d: number) => {
    const t = new Date();
    return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === d;
  };

  const quickSet = (offsetDays: number, hours = 9, minutes = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hours, minutes, 0, 0);
    onChange(d.toISOString());
    setOpen(false);
  };

  const displayStr = value
    ? new Date(value).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "날짜 선택";

  return (
    <div className="datepicker-wrap" ref={ref}>
      <button className="datepicker-trigger" type="button" onClick={() => setOpen(s => !s)}>
        <Calendar size={14} />
        <span>{displayStr}</span>
      </button>

      {open && (
        <div className="datepicker-popup">
          {/* Quick actions */}
          <div className="dp-quick">
            <button onClick={() => quickSet(0, new Date().getHours(), new Date().getMinutes())}>지금</button>
            <button onClick={() => quickSet(0)}>오늘 오전 9시</button>
            <button onClick={() => quickSet(1)}>내일</button>
            <button onClick={() => quickSet(7)}>1주 후</button>
          </div>

          {/* Month nav */}
          <div className="dp-header">
            <button onClick={prevMonth} className="dp-nav"><ChevronLeft size={14} /></button>
            <span className="dp-month">{viewYear}년 {MONTHS[viewMonth]}</span>
            <button onClick={nextMonth} className="dp-nav"><ChevronRight size={14} /></button>
          </div>

          {/* Day labels */}
          <div className="dp-grid">
            {DAYS.map(d => <span key={d} className="dp-day-label">{d}</span>)}

            {/* Empty cells */}
            {Array.from({ length: firstDay }).map((_, i) => <span key={`e${i}`} />)}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              return (
                <button
                  key={d}
                  className={`dp-day ${isSelected(d) ? "dp-selected" : ""} ${isToday(d) && !isSelected(d) ? "dp-today" : ""}`}
                  onClick={() => selectDay(d)}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Time input */}
          <div className="dp-time">
            <span>시간</span>
            <input
              type="time"
              value={timeStr}
              onChange={e => { setTimeStr(e.target.value); applyTime(e.target.value); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
