import { App, Editor, Plugin, PluginSettingTab, Setting } from "obsidian";
import { InsertWeekModal } from "./insert-week-modal";
import { StartDay } from "./week";

interface InsertWeekSettings {
  startDay: StartDay;
}

const DEFAULT_SETTINGS: InsertWeekSettings = {
  startDay: 1,
};

export default class InsertWeekPlugin extends Plugin {
  settings: InsertWeekSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addCommand({
      id: "insert-week",
      name: "Insert week",
      editorCallback: (editor: Editor) => {
        new InsertWeekModal(this.app, this.settings.startDay, (markdown) => {
          editor.replaceSelection(markdown);
        }).open();
      },
    });

    this.addSettingTab(new InsertWeekSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

class InsertWeekSettingTab extends PluginSettingTab {
  plugin: InsertWeekPlugin;

  constructor(app: App, plugin: InsertWeekPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Insert Week settings" });

    new Setting(containerEl)
      .setName("Default start day of the week")
      .setDesc("Used every time the Insert week modal opens.")
      .addDropdown((dropdown) => {
        dropdown.addOption("1", "Monday");
        dropdown.addOption("0", "Sunday");
        dropdown.setValue(String(this.plugin.settings.startDay));
        dropdown.onChange(async (value) => {
          this.plugin.settings.startDay = Number(value) === 0 ? 0 : 1;
          await this.plugin.saveSettings();
        });
      });
  }
}
