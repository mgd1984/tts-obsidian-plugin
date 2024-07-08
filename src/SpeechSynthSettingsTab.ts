import SpeechSynth from "main";
import { App, PluginSettingTab, Setting, TFolder } from "obsidian";
import { SettingsManager } from "./SettingsManager";

export class SpeechSynthSettingsTab extends PluginSettingTab {
    private plugin: SpeechSynth;
    private settingsManager: SettingsManager;
    private createNewFileInput: Setting;
    private saveAudioFileInput: Setting;

    constructor(app: App, plugin: SpeechSynth) {
        super(app, plugin);
        this.plugin = plugin;
        this.settingsManager = plugin.settingsManager;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        this.createHeader();
        this.createApiKeySetting();
        this.createApiUrlSetting();
        this.createModelSetting();
        this.createVoiceSetting();
        this.createLanguageSetting();
        this.createSaveAudioFileToggleSetting();
        this.createSaveAudioFilePathSetting();
        this.createDebugModeToggleSetting();
    }

    private getUniqueFolders(): TFolder[] {
        const files = this.app.vault.getMarkdownFiles();
        const folderSet = new Set<TFolder>();

        for (const file of files) {
            const parentFolder = file.parent;
            if (parentFolder && parentFolder instanceof TFolder) {
                folderSet.add(parentFolder);
            }
        }

        return Array.from(folderSet);
    }

    private createHeader(): void {
        this.containerEl.createEl("h2", { text: "Speech Synthesizer Settings" });
    }

    private createTextSetting(
        name: string,
        desc: string,
        placeholder: string,
        value: string,
        onChange: (value: string) => Promise<void>
    ): void {
        new Setting(this.containerEl)
            .setName(name)
            .setDesc(desc)
            .addText((text) =>
                text
                    .setPlaceholder(placeholder)
                    .setValue(value)
                    .onChange(async (value) => await onChange(value))
            );
    }

    private createApiKeySetting(): void {
        this.createTextSetting(
            "API Key",
            "Enter your OpenAI API key",
            "sk-...xxxx",
            this.plugin.settings.apiKey,
            async (value) => {
                this.plugin.settings.apiKey = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    private createApiUrlSetting(): void {
        this.createTextSetting(
            "API URL",
            "Specify the endpoint that will be used to make requests to",
            "https://api.your-custom-url.com",
            this.plugin.settings.apiUrl,
            async (value) => {
                this.plugin.settings.apiUrl = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    private createModelSetting(): void {
        this.createTextSetting(
            "Model",
            "Select an OpenAI audio model to use (tts-1 or tts-1-hd)",
            "tts-1",
            this.plugin.settings.model,
            async (value) => {
                this.plugin.settings.model = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    private createVoiceSetting(): void {
        new Setting(this.containerEl)
            .setName("Voice")
            .setDesc("Select a voice")
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions({
                        alloy: "Alloy",
                        echo: "Echo",
                        fable: "Fable",
                        onyx: "Onyx",
                        nova: "Nova",
                        shimmer: "Shimmer",
                    })
                    .setValue(this.plugin.settings.voice)
                    .onChange(async (value) => {
                        this.plugin.settings.voice = value;
                        await this.settingsManager.saveSettings(this.plugin.settings);
                    })
            );
    }

    private createLanguageSetting(): void {
        this.createTextSetting(
            "Language",
            "Specify the language of the message being whispered",
            "en",
            this.plugin.settings.language,
            async (value) => {
                this.plugin.settings.language = value;
                await this.settingsManager.saveSettings(this.plugin.settings);
            }
        );
    }

    private createSaveAudioFileToggleSetting(): void {
        new Setting(this.containerEl)
            .setName("Save recording")
            .setDesc(
                "Turn on to save the audio file after receiving it from the tts API"
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.saveAudioFile)
                    .onChange(async (value) => {
                        this.plugin.settings.saveAudioFile = value;
                        if (!value) {
                            this.plugin.settings.saveAudioFilePath = "";
                        }
                        await this.settingsManager.saveSettings(
                            this.plugin.settings
                        );
                        this.saveAudioFileInput.setDisabled(!value);
                    })
            );
    }

    private createSaveAudioFilePathSetting(): void {
        this.saveAudioFileInput = new Setting(this.containerEl)
            .setName("Recordings folder")
            .setDesc(
                "Specify the path in the vault where to save the audio files"
            )
            .addText((text) =>
                text
                    .setPlaceholder("Example: folder/audio")
                    .setValue(this.plugin.settings.saveAudioFilePath)
                    .onChange(async (value) => {
                        this.plugin.settings.saveAudioFilePath = value;
                        await this.settingsManager.saveSettings(
                            this.plugin.settings
                        );
                    })
            )
            .setDisabled(!this.plugin.settings.saveAudioFile);
    }

    private createDebugModeToggleSetting(): void {
        new Setting(this.containerEl)
            .setName("Debug Mode")
            .setDesc(
                "Turn on to increase the plugin's verbosity for troubleshooting."
            )
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.debugMode)
                    .onChange(async (value) => {
                        this.plugin.settings.debugMode = value;
                        await this.settingsManager.saveSettings(
                            this.plugin.settings
                        );
                    });
            });
    }
}