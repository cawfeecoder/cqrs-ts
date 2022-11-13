import { Err, Ok, Result } from "@sniptt/monads/build";
import { ConfigProvider } from ".";
import config from "config";

export class FileConfigProvider implements ConfigProvider {
	private static instance: FileConfigProvider;
	private config;

	private constructor() {
		this.config = config;
	}

	async get<Q>(key: string[]): Promise<Result<Q, Error>> {
		if (!this.config.has(key.join("."))) {
			return Err(
				new Error(
					`The provided key ${key.join(
						".",
					)} does not exist within the configuration`,
				),
			);
		}
		let val: Q = this.config.get(key.join("."));
		return Ok(val);
	}

	public static getInstance(): FileConfigProvider {
		if (!FileConfigProvider.instance) {
			FileConfigProvider.instance = new FileConfigProvider();
		}
		return FileConfigProvider.instance;
	}
}
