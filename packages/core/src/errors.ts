export class EventPilotConfigError extends Error {
  constructor(
    message: string,
    public readonly filePath?: string,
  ) {
    super(message);
    this.name = "EventPilotConfigError";
  }
}
