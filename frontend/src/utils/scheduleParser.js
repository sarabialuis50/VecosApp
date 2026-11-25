export function parseBusinessSchedule(horarios, isOpenOverride = true) {
    if (!isOpenOverride) {
        return { isClosed: true, nextOpenTime: null, overridesClosed: true, parsedSchedule: null, status: 'Cerrado' };
    }

    if (!horarios) return { isClosed: false, nextOpenTime: null, parsedSchedule: null, status: 'Abierto' };

    let schedule = horarios;
    if (typeof horarios === 'string') {
        if (horarios.trim().startsWith('{')) {
            try {
                schedule = JSON.parse(horarios);
            } catch (e) {
                return { isClosed: false, nextOpenTime: null, parsedSchedule: null, status: 'Abierto' };
            }
        } else {
            return { isClosed: false, nextOpenTime: null, parsedSchedule: null, status: 'Abierto' };
        }
    }

    const now = new Date();

    // Helper to get day range string
    const getDayScheduleStr = (date) => {
        const day = date.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
        if (day >= 1 && day <= 5) return schedule.semana || schedule.week || '';
        if (day === 6) return schedule.sabado || schedule.saturday || schedule.semana || '';
        if (day === 0) return schedule.domingos || schedule.sunday || schedule.fines || schedule.weekend || schedule.semana || '';
        return '';
    };

    const parseTimeStr = (timeStr, baseDate) => {
        if (!timeStr) return null;
        try {
            let t = timeStr.trim().toLowerCase().replace(/\./g, '');
            let isPM = t.includes('pm') || t.includes('p');
            let isAM = t.includes('am') || t.includes('a');
            t = t.replace(/[a-z]/g, '').trim();

            let [hoursStr, minutesStr] = t.split(':');
            let hours = parseInt(hoursStr, 10);
            let minutes = parseInt(minutesStr || '0', 10);

            if (isNaN(hours)) return null;
            if (isPM && hours < 12) hours += 12;
            if (isAM && hours === 12) hours = 0;

            const d = new Date(baseDate);
            d.setHours(hours, minutes, 0, 0);
            return d;
        } catch {
            return null;
        }
    };

    const getTimesForDay = (scheduleStr, baseDate) => {
        if (!scheduleStr || scheduleStr.toLowerCase().includes('cerrado')) return null;
        const parts = scheduleStr.split(/\s*-\s*|\s+a\s+|\s+to\s+/);
        if (parts.length < 2) return null;
        const open = parseTimeStr(parts[0], baseDate);
        const close = parseTimeStr(parts[1], baseDate);
        if (!open || !close) return null;

        let effectiveClose = new Date(close);
        if (close <= open) { // Across midnight logic
            effectiveClose.setDate(effectiveClose.getDate() + 1);
        }
        return { open, close: effectiveClose };
    };

    // 1. Check if open today (based on today's shift)
    const todayStr = getDayScheduleStr(now);
    const todayTimes = getTimesForDay(todayStr, now);
    let isOpen = todayTimes ? (now >= todayTimes.open && now <= todayTimes.close) : false;

    // 2. If not open by today's shift, check if still open from yesterday's shift
    if (!isOpen) {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayStr = getDayScheduleStr(yesterday);
        const yesterdayTimes = getTimesForDay(yesterdayStr, yesterday);
        if (yesterdayTimes && now >= yesterdayTimes.open && now <= yesterdayTimes.close) {
            isOpen = true;
        }
    }

    // 3. Special case for "24 horas"
    if (todayStr.toLowerCase().includes('24 horas') || todayStr.toLowerCase().includes('24h')) {
        isOpen = true;
    }

    // 4. Calculate nextOpenTime
    let nextOpenTime = null;
    if (!isOpen) {
        // Find next opening in current or future days
        for (let i = 0; i < 7; i++) {
            const checkDay = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
            const checkStr = getDayScheduleStr(checkDay);
            const checkTimes = getTimesForDay(checkStr, checkDay);
            if (checkTimes && checkTimes.open > now) {
                nextOpenTime = checkTimes.open;
                break;
            }
        }
    }

    return {
        isClosed: !isOpen,
        isOpen,
        status: isOpen ? 'Abierto' : 'Cerrado',
        nextOpenTime,
        todayScheduleStr: todayStr,
        parsedSchedule: schedule
    };
}
