import {
  App,
  Editor,
  Plugin,
  PluginSettingTab,
  SettingDefinitionItem,
} from "obsidian";
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
      id: "weekly-template",
      name: "Weekly template",
      editorCallback: (editor: Editor) => {
        new InsertWeekModal(this.app, this.settings.startDay, (markdown) => {
          editor.replaceSelection(markdown);
        }).open();
      },
    });

    this.addSettingTab(new InsertWeekSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    const data = (await this.loadData()) as Partial<InsertWeekSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
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

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        name: "Default start day of the week",
        desc: "Used every time the Insert week modal opens.",
        control: {
          key: "startDay",
          type: "dropdown",
          options: { "1": "Monday", "0": "Sunday" },
          defaultValue: "1",
        },
      },
    ];
  }

  getControlValue(key: string): unknown {
    if (key === "startDay") {
      return String(this.plugin.settings.startDay);
    }
    return super.getControlValue(key);
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    if (key === "startDay") {
      this.plugin.settings.startDay = value === "0" ? 0 : 1;
      await this.plugin.saveSettings();
      return;
    }
    await super.setControlValue(key, value);
  }
}
