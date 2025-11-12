import type { Instance } from "flatpickr/dist/types/instance";

interface YearSelectPluginConfig {
  startYear?: number;
  endYear?: number;
  theme?: string;
}

type CustomPlugin = (fp: Instance) => {
  onReady?: () => void;
  onOpen?: () => void;
  onValueUpdate?: () => void;
  onDestroy?: () => void;
};

const toYear = (date?: Date | null): number | undefined => {
  if (!date) return undefined;
  return date.getFullYear();
};

const yearSelectPlugin = (config: YearSelectPluginConfig = {}): CustomPlugin => {
  const settings = {
    startYear: config.startYear,
    endYear: config.endYear,
    theme: config.theme,
  };

  return (fp: Instance) => {
    let container: HTMLDivElement | null = null;
    let selectEl: HTMLSelectElement | null = null;

    const resolveStartYear = () => {
      if (settings.startYear !== undefined) return settings.startYear;
      const minDate = (fp.config as any)._minDate as Date | undefined;
      if (minDate) return minDate.getFullYear();
      return new Date().getFullYear() - 10;
    };

    const resolveEndYear = () => {
      if (settings.endYear !== undefined) return settings.endYear;
      const maxDate = (fp.config as any)._maxDate as Date | undefined;
      if (maxDate) return maxDate.getFullYear();
      return new Date().getFullYear();
    };

    const buildOptions = () => {
      if (!selectEl) return;
      const start = resolveStartYear();
      const end = resolveEndYear();
      const previousValue = selectEl.value;
      selectEl.innerHTML = "";

      const ascending = start <= end;
      const range = ascending ? [start, end] : [end, start];
      for (let year = range[0]; year <= range[1]; year += 1) {
        const option = document.createElement("option");
        option.value = String(year);
        option.textContent = String(year);
        selectEl.appendChild(option);
      }

      if (!ascending) {
        const options = Array.from(selectEl.options);
        options.sort((a, b) => Number(b.value) - Number(a.value));
        selectEl.innerHTML = "";
        options.forEach((opt) => selectEl?.appendChild(opt));
      }

      if (previousValue) {
        const exists = Array.from(selectEl.options).some(
          (opt) => opt.value === previousValue
        );
        if (exists) {
          selectEl.value = previousValue;
        }
      }
    };

    const updateSelectedYear = () => {
      if (!selectEl) return;
      const selected =
        fp.selectedDates[0] ??
        (fp.latestSelectedDateObj
          ? new Date(fp.latestSelectedDateObj)
          : fp.now);
      const year = toYear(selected);
      if (year !== undefined) {
        selectEl.value = String(year);
      }
    };

    const onYearChange = (event: Event) => {
      const target = event.target as HTMLSelectElement;
      const year = parseInt(target.value, 10);
      if (Number.isNaN(year)) return;

      const baseDate =
        fp.selectedDates[0] ??
        (fp.latestSelectedDateObj
          ? new Date(fp.latestSelectedDateObj)
          : fp.now);

      const newDate = new Date(baseDate);
      newDate.setFullYear(year);
      newDate.setMonth(0, 1);
      newDate.setHours(0, 0, 0, 0);

      fp.setDate(newDate, true);
      fp.close();
    };

    return {
      onReady() {
        if (!fp.calendarContainer) return;
        fp.calendarContainer.classList.add("flatpickr-year-select-mode");

        if (!container) {
          container = document.createElement("div");
          container.className = "flatpickr-year-select-container";
          if (settings.theme) {
            container.dataset.theme = settings.theme;
          }

          selectEl = document.createElement("select");
          selectEl.className = "flatpickr-year-select";
          container.appendChild(selectEl);
          selectEl.addEventListener("change", onYearChange);
        }

        buildOptions();
        updateSelectedYear();

        // insert container if not already in DOM
        if (
          fp.calendarContainer &&
          container &&
          !fp.calendarContainer.contains(container)
        ) {
          fp.calendarContainer.appendChild(container);
        }
      },
      onOpen() {
        buildOptions();
        updateSelectedYear();
      },
      onValueUpdate() {
        updateSelectedYear();
      },
      onDestroy() {
        if (selectEl) {
          selectEl.removeEventListener("change", onYearChange);
        }
        container = null;
        selectEl = null;
      },
    };
  };
};

export default yearSelectPlugin;

