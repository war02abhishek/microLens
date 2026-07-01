import { apiRequest } from "./client";

export type Theme = {
  id: string;
  name: string;
  colors: Record<string, string>;
};

export function listThemes() {
  return apiRequest<Theme[]>("/themes");
}
