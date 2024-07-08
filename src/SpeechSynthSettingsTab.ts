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
		this.createAdvancedSettingsSection();

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

	private createSpeedSetting(): void {
        new Setting(this.containerEl)
            .setName("Speech Speed")
            .setDesc("Adjust the speed of speech (0.5 to 2.0)")
            .addSlider(slider => slider
                .setLimits(0.5, 2.0, 0.1)
                .setValue(this.plugin.settings.speed)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.speed = value;
                    await this.settingsManager.saveSettings(this.plugin.settings);
                })
            );
    }

    private createPitchSetting(): void {
        new Setting(this.containerEl)
            .setName("Speech Pitch")
            .setDesc("Adjust the pitch of speech (0.5 to 2.0)")
            .addSlider(slider => slider
                .setLimits(0.5, 2.0, 0.1)
                .setValue(this.plugin.settings.pitch)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.pitch = value;
                    await this.settingsManager.saveSettings(this.plugin.settings);
                })
            );
    }

    private createVolumeSetting(): void {
        new Setting(this.containerEl)
            .setName("Speech Volume")
            .setDesc("Adjust the volume of speech (0.0 to 1.0)")
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(this.plugin.settings.volume)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.volume = value;
                    await this.settingsManager.saveSettings(this.plugin.settings);
                })
            );
    }

    private createPronunciationDictionarySetting(): void {
        new Setting(this.containerEl)
            .setName("Pronunciation Dictionary")
            .setDesc("Add custom pronunciations (format: word=pronunciation, one per line)")
            .addTextArea(text => text
                .setPlaceholder("example=egzampul\nObsidian=ob-sid-ee-an")
                .setValue(Object.entries(this.plugin.settings.pronunciationDictionary).map(([key, value]) => `${key}=${value}`).join('\n'))
                .onChange(async (value) => {
                    const dictionary: { [key: string]: string } = {};
                    value.split('\n').forEach(line => {
                        const [word, pronunciation] = line.split('=');
                        if (word && pronunciation) {
                            dictionary[word.trim()] = pronunciation.trim();
                        }
                    });
                    this.plugin.settings.pronunciationDictionary = dictionary;
                    await this.settingsManager.saveSettings(this.plugin.settings);
                })
            );
    }

    private createBatchProcessingToggle(): void {
        new Setting(this.containerEl)
            .setName("Enable Batch Processing")
            .setDesc("Allow converting multiple notes or entire folders to audio files")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.batchProcessingEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.batchProcessingEnabled = value;
                    await this.settingsManager.saveSettings(this.plugin.settings);
                })
            );
    }

	private createAdvancedSettingsSection(): void {
		// Create a header for the Advanced Settings
		this.containerEl.createEl('h3', { text: 'Advanced Settings' });
	
		// Example of adding an advanced setting
		this.createAdvancedToggleSetting();
		this.createDebugModeToggleSetting();
		this.createSpeedSetting();
        this.createPitchSetting();
        this.createVolumeSetting();
        this.createPronunciationDictionarySetting();
        this.createBatchProcessingToggle();
	}
	
	private createAdvancedToggleSetting(): void {
		new Setting(this.containerEl)
			.setName("Enable Experimental Features")
			.setDesc("Turn this on to enable experimental features")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.experimentalFeaturesEnabled)
				.onChange(async (value) => {
					this.plugin.settings.experimentalFeaturesEnabled = value;
					await this.settingsManager.saveSettings(this.plugin.settings);
				})
			);
	}
	

}
