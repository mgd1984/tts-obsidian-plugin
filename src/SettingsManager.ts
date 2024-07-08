import { Plugin } from "obsidian";

export interface SpeechSynthSettings {
    apiKey: string;
    apiUrl: string;
    model: string;
    prompt: string;
    voice: string;
    language: string;
    saveAudioFile: boolean;
    saveAudioFilePath: string;
    debugMode: boolean;
    createNewFileAfterRecording: boolean;
    createNewFileAfterRecordingPath: string;
	speed: number;
    pitch: number;
    volume: number;
    pronunciationDictionary: { [key: string]: string };
    batchProcessingEnabled: boolean;
    experimentalFeaturesEnabled: boolean, // or true, depending on your desired default value
	AdvancedSettingVisibility: boolean;

}

export const DEFAULT_SETTINGS: SpeechSynthSettings = {
    apiKey: "",
    apiUrl: "https://api.openai.com/v1/audio/speech",
    model: "tts-1",
    prompt: "",
    voice: "alloy",
    language: "en",
    saveAudioFile: true,
    saveAudioFilePath: "",
    debugMode: false,
    createNewFileAfterRecording: true,
    createNewFileAfterRecordingPath: "",
	speed: 1.0,
    pitch: 1.0,
    volume: 1.0,
    pronunciationDictionary: {},
    batchProcessingEnabled: false,
    experimentalFeaturesEnabled: false, // or true, depending on your desired default value
	AdvancedSettingVisibility: false,

};

export class SettingsManager {
    private plugin: Plugin;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    async loadSettings(): Promise<SpeechSynthSettings> {
        return Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.plugin.loadData()
        );
    }

    async saveSettings(settings: SpeechSynthSettings): Promise<void> {
        await this.plugin.saveData(settings);
    }
}