"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L, { type LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MapPickerProps, MapValue } from "./types";
import { InlineError } from "@/components/feedback/InlineError";

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

function fixLeafletIcon(): void {
  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });
}

function LocationMarker({
  position,
  setPosition,
  onLocationSelect,
  disabled,
}: {
  position: [number, number] | null;
  setPosition: (next: [number, number]) => void;
  onLocationSelect: (lat: number, lng: number) => void;
  disabled?: boolean;
}): React.ReactElement | null {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      if (disabled) return;
      const { lat, lng } = event.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

function ChangeView({ center }: { center: [number, number] | null }): null {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
}

const NOMINATIM_BASE =
  process.env.NEXT_PUBLIC_NOMINATIM_URL || "https://nominatim.openstreetmap.org";
const TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ||
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

async function reverseGeocode(lat: number, lng: number): Promise<MapValue> {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    );
    if (!response.ok) {
      throw new Error(`Geocoding failed (${response.status})`);
    }
    const data = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };

    const address = data.address ?? {};
    return {
      lat,
      lng,
      addressLine: data.display_name,
      city:
        address.city ||
        address.town ||
        address.village ||
        address.suburb ||
        address.municipality ||
        address.county ||
        address.district ||
        "",
      state: address.state || "",
      country: address.country || "",
      pincode: address.postcode || "",
    };
  } catch {
    return { lat, lng };
  }
}

async function searchLocation(query: string): Promise<[number, number] | null> {
  const response = await fetch(
    `${NOMINATIM_BASE}/search?format=jsonv2&q=${encodeURIComponent(query)}`,
  );
  if (!response.ok) {
    throw new Error(`Search failed (${response.status})`);
  }
  const data = (await response.json()) as Array<{ lat: string; lon: string }>;
  const first = data[0];
  if (!first) return null;
  const { lat, lon } = first;
  return [parseFloat(lat), parseFloat(lon)];
}

export default function MapPicker({
  value,
  onChange,
  disabled,
}: MapPickerProps): React.ReactElement {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fixLeafletIcon();
  }, []);

  useEffect(() => {
    if (value?.lat && value?.lng) {
      setPosition([value.lat, value.lng]);
    }
  }, [value]);

  const handleLocationSelect = useCallback(
    async (lat: number, lng: number) => {
      if (disabled) return;
      setLoading(true);
      setError(null);
      const next = await reverseGeocode(lat, lng);
      onChange(next);
      setLoading(false);
    },
    [onChange, disabled],
  );

  const handleSearch = async (
    event: React.SyntheticEvent | React.KeyboardEvent,
  ) => {
    event.preventDefault();
    if (!searchQuery || disabled) return;

    setLoading(true);
    setError(null);
    try {
      const location = await searchLocation(searchQuery);
      if (location) {
        setPosition(location);
        await handleLocationSelect(location[0], location[1]);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Search failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSearch(e);
            }
          }}
          placeholder="Search for a location..."
          disabled={disabled || loading}
        />
        <Button
          type="button"
          onClick={handleSearch}
          disabled={disabled || loading}
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      <div className="h-[300px] w-full rounded-md border overflow-hidden relative z-0">
        <MapContainer
          center={position ?? DEFAULT_CENTER}
          zoom={position ? 15 : 5}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={TILE_URL}
          />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onLocationSelect={handleLocationSelect}
            disabled={disabled}
          />
          {position && <ChangeView center={position} />}
        </MapContainer>
      </div>

      {loading && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Fetching address details...
        </p>
      )}
      {error ? <InlineError message={error} /> : null}
    </div>
  );
}
