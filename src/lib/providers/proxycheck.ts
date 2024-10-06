import 'server-only';

export interface ProxyCheckResponse {
  status: string;
  [ip: string]: ProxyCheckAsn | string;
}

export interface ProxyCheckAsn {
  asn: string;
  range: string;
  hostname: string;
  provider: string;
  organisation: string;
  continent: string;
  continentcode: string;
  country: string;
  isocode: string;
  region: string;
  regioncode: string;
  timezone: string;
  city: string;
  postcode: string;
  latitude: number;
  longitude: number;
  currency: Currency;
  proxy: string;
  type: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const proxyCheck = async (ipAddress: string | null) => {
  if (!ipAddress) {
    return null;
  }
  const response = await fetch(
    `http://proxycheck.io/v2/${ipAddress}?asn=1&key=${process.env.PROXYCHECK_API_KEY}`,
  );
  const data = (await response.json()) as ProxyCheckResponse;

  const formatted = data[ipAddress] as ProxyCheckAsn;

  return formatted;
};
