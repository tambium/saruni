export class AuthenticationError extends Error {
  constructor() {
    super('Not authenticated');
  }
}
