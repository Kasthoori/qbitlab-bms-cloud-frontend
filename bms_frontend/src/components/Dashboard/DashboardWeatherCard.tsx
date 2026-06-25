import {
  Cloud,
  CloudMoon,
  CloudRain,
  CloudSun,
  Loader2,
  Moon,
  Sun,
  ThermometerSun,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getCurrentWeather, type DashboardWeatherDto } from "@/api/weather";
import { BmsCard } from "@/components/UI";

type DashboardWeatherCardProps = {
  latitude: number;
  longitude: number;
  locationLabel?: string;
};

function getWeatherIcon(weather: DashboardWeatherDto) {
  const code = weather.weatherCode ?? 0;
  const cloudCover = weather.cloudCover ?? 0;

  const isRain =
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99);

  if (isRain) {
    return <CloudRain className="h-5 w-5" />;
  }

  if (cloudCover >= 70) {
    return weather.isDay ? (
      <CloudSun className="h-5 w-5" />
    ) : (
      <CloudMoon className="h-5 w-5" />
    );
  }

  if (cloudCover >= 35) {
    return <Cloud className="h-5 w-5" />;
  }

  return weather.isDay ? (
    <Sun className="h-5 w-5" />
  ) : (
    <Moon className="h-5 w-5" />
  );
}

function getSunCondition(weather: DashboardWeatherDto) {
  const cloudCover = weather.cloudCover ?? 0;

  if (!weather.isDay) return "Night";
  if (cloudCover >= 70) return "Cloudy";
  if (cloudCover >= 35) return "Partly cloudy";
  return "Sunny";
}

function formatWeatherTime(value: string | null) {
  if (!value) return "Live";

  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Live";
  }
}

export function DashboardWeatherCard({
  latitude,
  longitude,
  locationLabel = "Outdoor condition",
}: DashboardWeatherCardProps) {
  const [weather, setWeather] = useState<DashboardWeatherDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sunCondition = useMemo(
    () => (weather ? getSunCondition(weather) : "Loading"),
    [weather]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      try {
        setLoading(true);
        setError(false);

        const result = await getCurrentWeather(latitude, longitude);

        if (!cancelled) {
          setWeather(result);
        }
      } catch (loadError) {
        console.error("Failed to load dashboard weather:", loadError);

        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadWeather();

    const intervalId = window.setInterval(() => {
      void loadWeather();
    }, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [latitude, longitude]);

  return (
    <BmsCard
      variant="section"
      className="overflow-hidden border-cyan-300/20 bg-slate-950/45 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">
            Weather
          </p>

          <h3 className="mt-1 text-sm font-semibold text-white">
            {locationLabel}
          </h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-400/10 text-cyan-100">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {!loading && weather ? getWeatherIcon(weather) : null}
          {!loading && !weather ? <Cloud className="h-5 w-5" /> : null}
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-rose-200">
          Weather unavailable right now.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-slate-400">
              <ThermometerSun className="h-4 w-4" />
              <span className="text-[11px]">Temp</span>
            </div>

            <p className="mt-2 text-lg font-bold text-white">
              {weather?.temperature !== null && weather?.temperature !== undefined
                ? `${weather.temperature.toFixed(1)}°C`
                : "—"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Zap className="h-4 w-4" />
              <span className="text-[11px]">Light</span>
            </div>

            <p className="mt-2 text-lg font-bold text-white">
              {weather?.daylightIntensity !== null &&
              weather?.daylightIntensity !== undefined
                ? `${Math.round(weather.daylightIntensity)}`
                : "—"}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-500">W/m²</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-slate-400">
              {weather ? getWeatherIcon(weather) : <Cloud className="h-4 w-4" />}
              <span className="text-[11px]">Sun</span>
            </div>

            <p className="mt-2 text-sm font-bold text-white">
              {weather ? sunCondition : "—"}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-500">
              {weather ? formatWeatherTime(weather.time) : "Live"}
            </p>
          </div>
        </div>
      )}
    </BmsCard>
  );
}