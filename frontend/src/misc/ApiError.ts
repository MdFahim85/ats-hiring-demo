export default class ApiError extends Error {
  statusCode = 500;
  constructor(data: { message: string }, status?: number) {
    super(data.message);
    if (status) this.statusCode = status;
  }
}
