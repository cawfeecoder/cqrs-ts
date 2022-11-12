import { format } from "logform";
import { createLogger, transports, Logger } from "winston";

export class ApplicationLogger {
  private static instance: ApplicationLogger;
  private logger: Logger;

  private constructor() {
    this.logger = createLogger();
  }

  public enableJSON(): ApplicationLogger {
    this.logger = createLogger({
      format: format.combine(format.json()),
    });
    return this;
  }

  public enableConsoleOutput(): ApplicationLogger {
    this.logger.add(new transports.Console());
    return this;
  }

  public getLogger(): Logger {
    return this.logger;
  }

  public static getInstance(): ApplicationLogger {
    if (!ApplicationLogger.instance) {
      ApplicationLogger.instance = new ApplicationLogger();
    }
    return ApplicationLogger.instance;
  }
}
