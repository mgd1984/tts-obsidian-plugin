import { App, Plugin, Editor, Notice, TFile, TFolder, Modal, SuggestModal } from 'obsidian';
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

        this.addCommand({
            id: 'batch-process-folder',
            name: 'Batch Process Folder',
            callback: () => this.batchProcessFolder()
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

        // Apply pronunciation dictionary
        Object.entries(this.settings.pronunciationDictionary).forEach(([word, pronunciation]) => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            text = text.replace(regex, pronunciation);
        });

        try {
            const response = await fetch(this.settings.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.settings.model,
                    input: text,
                    voice: this.settings.voice,
                    speed: this.settings.speed,
                    pitch: this.settings.pitch,
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

        } catch (error) {
            console.error('Error in synthesizeSpeech:', error);
            throw error;
        }
    }

    private async saveAudioFile(audioBlob: Blob): Promise<void> {
        if (this.settings.debugMode) {
            console.log('Attempting to save audio file');
        }

        try {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const day = currentDate.getDate().toString().padStart(2, '0');
            const fileName = `speech_${year}${month}${day}.mp3`;
            const filePath = `${this.settings.saveAudioFilePath}/${fileName}`.replace(/\/+/g, '/');

            const arrayBuffer = await audioBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            await this.app.vault.createBinary(filePath, uint8Array);

            if (this.settings.debugMode) {
                console.log(`Audio file saved successfully: ${filePath}`);
            }
            new Notice(`Audio file saved: ${filePath}`);
        } catch (error) {
            console.error('Error saving audio file:', error);
            new Notice(`Failed to save audio file: ${error.message}`);
        }
    }

    private async playAudio(audioBlob: Blob): Promise<void> {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.volume = this.settings.volume;
        
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

    private async batchProcessFolder(): Promise<void> {
        if (!this.settings.batchProcessingEnabled) {
            new Notice('Batch processing is not enabled in settings');
            return;
        }

        const folder = await this.selectFolder();
        if (!folder) return;

        const files = this.app.vault.getMarkdownFiles().filter(file => 
            file.path.startsWith(folder.path)
        );

        let processedCount = 0;
        const totalFiles = files.length;

        for (const file of files) {
            try {
                const content = await this.app.vault.read(file);
                await this.synthesizeSpeech(content);
                processedCount++;
                new Notice(`Processed ${processedCount}/${totalFiles} files`);
            } catch (error) {
                console.error(`Error processing file ${file.path}:`, error);
                new Notice(`Error processing file ${file.path}: ${error.message}`);
            }
        }

        new Notice(`Batch processing complete. Processed ${processedCount}/${totalFiles} files`);
    }

		private async selectFolder(): Promise<TFolder | null> {
		// Get all markdown files
		const files = this.app.vault.getMarkdownFiles();
		// Use a Set to store unique folders
		const folderSet = new Set<TFolder>();

		// Iterate over files to add their parent folders to the set
		for (const file of files) {
			const parentFolder = file.parent;
			if (parentFolder && parentFolder instanceof TFolder) {
				folderSet.add(parentFolder);
			}
		}

		// Convert the Set to an array
		const folders = Array.from(folderSet);
		if (folders.length === 0) {
			new Notice('No folders found');
			return null;
		}

		// Proceed with the rest of the original method
		const folderNames = folders.map(folder => folder.path);
		const selectedFolder = await (this.app.workspace as any)
			.selectFolder('Select a folder to process', folderNames);
		if (selectedFolder) {
			return folders.find(folder => folder.path === selectedFolder) ?? null;
		} else {
			return null;
		}
	}
}