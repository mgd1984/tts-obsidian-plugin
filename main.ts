import { App, Plugin, Editor, Notice } from 'obsidian';
import { SettingsManager, SpeechSynthSettings } from './src/SettingsManager';
import { SpeechSynthSettingsTab } from './src/SpeechSynthSettingsTab';

export default class SpeechSynth extends Plugin {
    settingsManager: SettingsManager;
    settings: SpeechSynthSettings;
	
    async onload() {
        console.log('Loading SpeechSynth plugin');

        this.settingsManager = new SettingsManager(this);
        this.settings = await this.settingsManager.loadSettings();

        this.addSettingTab(new SpeechSynthSettingsTab(this.app, this));

        this.addCommand({
            id: 'read-selection',
            name: 'Read Selected Text',
            editorCallback: (editor: Editor) => this.readSelection(editor)
        });
    }

    onunload() {
        console.log('Unloading SpeechSynth plugin');
    }

    async readSelection(editor: Editor) {
        const selectedText = editor.getSelection();
        if (!selectedText) {
            new Notice('No text selected');
            return;
        }

        try {
            await this.synthesizeSpeech(selectedText);
        } catch (error) {
            console.error('Error synthesizing speech:', error);
            new Notice(`Error synthesizing speech: ${error.message}`);
        }
    }

    private async synthesizeSpeech(text: string): Promise<void> {
        if (this.settings.debugMode) {
            console.log('Synthesizing speech:', text);
            console.log('Using settings:', JSON.stringify(this.settings, null, 2));
        }

        try {
            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.settings.model,
                    input: text,
                    voice: this.settings.voice,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(`API request failed: ${response.status} ${response.statusText}${errorData ? ` - ${JSON.stringify(errorData)}` : ''}`);
            }

            const audioBlob = await response.blob();

            if (this.settings.saveAudioFile) {
                await this.saveAudioFile(audioBlob);
            }

            await this.playAudio(audioBlob);

            if (this.settings.createNewFileAfterRecording) {
                await this.createNewFile(text);
            }
        } catch (error) {
            console.error('Error in synthesizeSpeech:', error);
            throw error;
        }
    }

    private async saveAudioFile(audioBlob: Blob): Promise<void> {
        // Implementation depends on how you want to save files in Obsidian
        console.log('Saving audio file...');
        // TODO: Implement file saving logic
    }

    private async playAudio(audioBlob: Blob): Promise<void> {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        return new Promise((resolve, reject) => {
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                resolve();
            };
            audio.onerror = (error) => {
                URL.revokeObjectURL(audioUrl);
                reject(error);
            };
            audio.play().catch(reject);
        });
    }

    private async createNewFile(text: string): Promise<void> {
        // Implementation depends on how you want to create new files in Obsidian
        console.log('Creating new file with synthesized text...');
        // TODO: Implement file creation logic
    }
}