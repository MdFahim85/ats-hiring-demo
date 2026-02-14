export default class ResponseError extends Error {
  statusCode = 500;
  constructor(message?: string, status?: number) {
    super(message);
    if (status) this.statusCode = status;
  }
}
