export interface BaseProvider {
  providerKey: string;
  apiKey?: string;
  baseUrl?: string;
  extraParams?: string; // JSON string
}
