import { z } from 'zod';

import { supabase } from '~/shared/lib/supabase';

import type { GrassTypeList } from '../types';

// ZippopotamResponse — Zod schema for the Zippopotam.us geocoding API.
// Validates the external response before trusting any field values.
// Required by MASVS-CODE-4: all external input must pass Zod validation
// before it touches app state or the service layer.
const ZippopotamResponse = z.object({
  places: z
    .array(
      z.object({
        latitude: z.string(),
        longitude: z.string(),
      }),
    )
    .min(1),
});

// geocodeZip — converts a US ZIP code to lat/lng coordinates via Zippopotam.us.
// Free service, no API key required. Called once during onboarding — the result
// is stored in user_profiles.lat / lng and read by the recommendation engine
// on every daily run. The geocoding API is never called again after signup.
const geocodeZip = async (zipCode: string): Promise<{ lat: number; lng: number }> => {
  const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
  if (!response.ok) throw new Error(`ZIP geocoding failed: ${response.status}`);

  const raw: unknown = await response.json();
  const parsed = ZippopotamResponse.safeParse(raw);
  if (!parsed.success) throw new Error('Invalid ZIP code or location not found');

  const place = parsed.data.places[0];
  return {
    lat: parseFloat(place.latitude),
    lng: parseFloat(place.longitude),
  };
};

export interface CreateUserProfileInput {
  userId: string;
  zipCode: string;
  lawnSize: number;
  grassType: GrassTypeList;
  effortLevel: 1 | 2 | 3;
}

// createUserProfile — writes the completed onboarding data to user_profiles.
// This INSERT is the single event that flips hasCompletedOnboarding to true,
// which the AuthProvider reads on next auth state check to route the user to
// the home tabs instead of onboarding.
//
//   1. Geocode ZIP → lat/lng via Zippopotam.us (needed by the Edge Function)
//   2. INSERT the row — RLS policy ensures the user can only write their own row
//
// Throws on any error. Callers must show a generic message to the user —
// never forward the raw error to the UI (MASVS-CODE-4, MASWE-0087).
export const createUserProfile = async ({
  userId,
  zipCode,
  lawnSize,
  grassType,
  effortLevel,
}: CreateUserProfileInput): Promise<void> => {
  const { lat, lng } = await geocodeZip(zipCode);

  const { error } = await supabase.from('user_profiles').insert({
    user_id: userId,
    zip_code: zipCode,
    lawn_size: lawnSize,
    grass_type: grassType,
    lat,
    lng,
    effort_level: effortLevel,
  });

  if (error) throw error;
};
