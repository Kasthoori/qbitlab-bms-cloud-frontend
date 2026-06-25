export type DashboardWeatherDto = {
  temperature: number | null;
  daylightIntensity: number | null;
  cloudCover: number | null;
  weatherCode: number | null;
  isDay: boolean;
  time: string | null;
};

type OpenMeteoCurrentResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    is_day?: number;
    weather_code?: number;
    cloud_cover?: number;
    shortwave_radiation?: number;
  };
};

export async function getCurrentWeather(
  latitude: number,
  longitude: number
): Promise<DashboardWeatherDto> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      "temperature_2m,is_day,weather_code,cloud_cover,shortwave_radiation",
    timezone: "auto",
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to load current weather");
  }

  const json = (await response.json()) as OpenMeteoCurrentResponse;
  const current = json.current;

  return {
    temperature: current?.temperature_2m ?? null,
    daylightIntensity: current?.shortwave_radiation ?? null,
    cloudCover: current?.cloud_cover ?? null,
    weatherCode: current?.weather_code ?? null,
    isDay: current?.is_day === 1,
    time: current?.time ?? null,
  };
}