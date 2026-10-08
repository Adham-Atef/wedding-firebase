import { GuestWish } from '../types';

export const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyeRV_tgqc5G8mF-4CFeQQ3sgQV-OEc7tVQZVk_5IrCLCakuNP9pA5xnh-dcdvT7Yhd/exec';

export async function listWishesFromSpreadsheet(): Promise<GuestWish[]> {
  const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=listWishes`);
  if (!response.ok) {
    throw new Error(`Failed to load spreadsheet blessings (${response.status}).`);
  }

  const data: { wishes?: GuestWish[]; error?: string } = await response.json();
  if (data.error) {
    throw new Error(`Failed to load spreadsheet blessings: ${data.error}`);
  }
  if (!Array.isArray(data.wishes)) {
    throw new Error('The spreadsheet returned an invalid blessings list.');
  }
  return data.wishes;
}

export async function likeWishInSpreadsheet(wishId: string): Promise<void> {
  const match = /^sheet-wish-(\d+)$/.exec(wishId);
  if (!match) {
    throw new Error('Invalid spreadsheet blessing ID.');
  }

  const data = new URLSearchParams({
    action: 'likeWish',
    rowNumber: match[1],
  });
  await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    body: data,
    mode: 'no-cors',
  });
}
