const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdWithCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const wholeNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const formatUsd = (value: number) => usdWhole.format(value);
export const formatUsdCents = (value: number) => usdWithCents.format(value);
export const formatUsdCompact = (value: number) => usdCompact.format(value);
export const formatWholeNumber = (value: number) => wholeNumber.format(value);

export const formatOneDecimal = (value: number) => value.toFixed(1);

/** Keeps small quantities readable ("7.8") without fake precision on large ones ("54"). */
export const formatMinutes = (minutes: number) => (minutes < 10 ? minutes.toFixed(1) : wholeNumber.format(minutes));

export const formatPercent = (value: number) => `${wholeNumber.format(Math.abs(value))}%`;

export function formatSignedPercent(value: number): string {
  const sign = value < 0 ? "-" : "+";
  return `${sign}${formatPercent(value)}`;
}

export function formatSignedYears(value: number): string {
  const sign = value < 0 ? "-" : "+";
  return `${sign}${Math.abs(value).toFixed(1)}`;
}

/** Two decimals below 1x so a tiny ratio reads "0.04x" rather than "0.0x". */
export const formatMultiplier = (value: number) => `${value.toFixed(value < 1 ? 2 : 1)}x`;
