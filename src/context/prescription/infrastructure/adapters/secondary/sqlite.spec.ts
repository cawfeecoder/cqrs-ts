import { ApplicationLogger } from "@common/utils/logger";
import { SqliteConnector } from "./sqlite";

describe("Prescription SQLiteConnector", () => {
	it("runs migrations without erroring", async () => {
		ApplicationLogger.getInstance()
			.enableJSON()
			.enableConsoleOutput("disabled");
		let repository = new SqliteConnector({
			filename: ":memory:",
			migrationPath: "./migrations/sqlite",
		});
		await expect(repository.migrate()).resolves.not.toThrow();
	});
});
