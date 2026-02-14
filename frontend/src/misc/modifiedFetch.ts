import type { IncomingHttpHeaders } from "http";
import ApiError from "./ApiError";

export const API_URL =
  import.meta.env.VITE_BACKEND_ROOT || "http://localhost:3000";

export async function modifiedFetch<T>(
  input: string | URL | Request,
  init: RequestInit & {
    headers?: IncomingHttpHeaders & RequestInit["headers"];
    method?: "get" | "post" | "put" | "delete";
    customBaseUrl?: string;
  } = {},
) {
  init.headers = Object.assign<HeadersInit, IncomingHttpHeaders>(
    init.headers || {},
    {
      authorization: "Bearer ",
      accept: "application/json",
      "content-type": init.headers?.["content-type"] || "application/json",
    },
  );

  if (
    init.headers["content-type"] === "multipart/form-data" ||
    init.body instanceof FormData
  )
    delete init.headers["content-type"];

  const { customBaseUrl } = init;
  delete init.customBaseUrl;

  const res = await fetch((customBaseUrl || API_URL) + input, {
    ...init,
    credentials: "include",
  });
  const text = await res.text();

  const json: T = await JSON.parse(text, (_, value) => {
    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(value)
    )
      return new Date(value);

    return value;
  });

  if (!res.ok) throw new ApiError(json as { message: string }, res.status);

  return json;
}
