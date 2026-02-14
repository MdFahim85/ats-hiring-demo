import type { RequestHandler } from "express";

export type GetReqParams<T extends RequestHandler> = Parameters<T>[0]["params"];
export type GetReqQueries<T extends RequestHandler> = Parameters<T>[0]["query"];
export type GetReqBody<T extends RequestHandler> = Parameters<T>[0]["body"];
export type GetRes<T extends RequestHandler> = Parameters<
  Parameters<T>[1]["json"]
>[0];
