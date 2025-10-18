// src/helpers/localizer.js
import { dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import ko from "date-fns/locale/ko"; // ✅ 한국어 locale import

const locales = {
  ko: ko,
};

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // ✅ 월요일 시작
  getDay,
  locales,
});
