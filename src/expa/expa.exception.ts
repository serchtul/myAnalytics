export class ExpaException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpaException';
  }

  static from(error: Error): ExpaException {
    const wrapper = new ExpaException(error.message);
    if (error.stack) {
      wrapper.stack = error.stack;
    }
    return wrapper;
  }
}
