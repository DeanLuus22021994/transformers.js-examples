import { v4 as uuidv4 } from 'uuid';

/**
 * SwarmConfig class that defines the configuration for Docker Swarm
 * Follows SRP by focusing only on Swarm configuration
 */
export class SwarmConfig {
	public name: string;
	public taskHistoryRetentionLimit: number;
	public autoLockManagers: boolean;
	public id: string;

	constructor(
		name: string = 'transformers-swarm',
		taskHistoryRetentionLimit: number = 5,
		autoLockManagers: boolean = true
	) {
		this.name = name;
		this.taskHistoryRetentionLimit = taskHistoryRetentionLimit;
		this.autoLockManagers = autoLockManagers;
		this.id = uuidv4();
	}

	/**
	 * Check if the configuration needs to be updated
	 */
	public needsUpdate(currentConfig: any): boolean {
		if (!currentConfig) {
			return true;
		}

		return (
			currentConfig.Spec.Name !== this.name ||
			currentConfig.Spec.TaskHistoryRetentionLimit !== this.taskHistoryRetentionLimit ||
			currentConfig.Spec.EncryptionConfig?.AutoLockManagers !== this.autoLockManagers
		);
	}

	/**
	 * Create a SwarmConfig instance from JSON
	 */
	public static fromJson(json: any): SwarmConfig {
		return new SwarmConfig(
			json.name || 'transformers-swarm',
			json.taskHistoryRetentionLimit || 5,
			json.autoLockManagers !== undefined ? json.autoLockManagers : true
		);
	}

	/**
	 * Convert the configuration to JSON
	 */
	public toJson(): any {
		return {
			name: this.name,
			taskHistoryRetentionLimit: this.taskHistoryRetentionLimit,
			autoLockManagers: this.autoLockManagers,
			id: this.id
		};
	}
}
