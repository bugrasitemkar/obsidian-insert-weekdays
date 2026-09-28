import { App, Modal, Setting } from "obsidian";
import {
  StartDay,
  buildWeeks,
  findWeekForDate,
  formatRange,
  generateWeekMarkdown,
  WeekInfo,
} from "./week";

export class InsertWeekModal extends Modal {
  private startDay: StartDay;
  private weeks: WeekInfo[];
  private selectedWeek: number;
  private previewEl: HTMLElement | null = null;

  constructor(
    app: App,
    startDay: StartDay,
    private onSubmit: (markdown: string) => void,
  ) {
    super(app);
    this.startDay = startDay;
  }

  onOpen(): void {
    const now = new Date();
    this.weeks = buildWeeks(now.getFullYear(), this.startDay);
    this.selectedWeek = findWeekForDate(this.weeks, now, this.startDay).week;
    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("insert-week-modal");

    contentEl.createEl("h2", { text: "Insert week" });
    const inferred = findWeekForDate(this.weeks, new Date(), this.startDay).week;
    contentEl.createEl("p", {
      text: `Week of the year inferred from today: Week ${inferred}.`,
      cls: "insert-week-hint",
    });

    new Setting(contentEl)
      .setName("Week of the year")
      .setDesc("Choose which week to insert.")
      .addDropdown((dropdown) => {
        for (const w of this.weeks) {
          dropdown.addOption(
            String(w.week),
            `Week ${w.week} (${formatRange(w.start, w.end)})`,
          );
        }
        dropdown.setValue(String(this.selectedWeek));
        dropdown.onChange((value) => {
          this.selectedWeek = Number(value);
          this.updatePreview();
        });
      });

    new Setting(contentEl)
      .setName("Start day of the week")
      .setDesc("Monday by default, or switch to Sunday.")
      .addDropdown((dropdown) => {
        dropdown.addOption("1", "Monday");
        dropdown.addOption("0", "Sunday");
        dropdown.setValue(String(this.startDay));
        dropdown.onChange((value) => {
          this.startDay = Number(value) === 0 ? 0 : 1;
          const now = new Date();
          this.weeks = buildWeeks(now.getFullYear(), this.startDay);
          this.selectedWeek = findWeekForDate(this.weeks, now, this.startDay).week;
          this.render();
        });
      });

    const preview = contentEl.createEl("pre", { cls: "insert-week-preview" });
    preview.setText(this.currentMarkdown());
    this.previewEl = preview;

    const actions = contentEl.createDiv({ cls: "insert-week-actions" });

    const insertBtn = actions.createEl("button", { text: "Insert", cls: "mod-cta" });
    insertBtn.addEventListener("click", () => {
      this.onSubmit(this.currentMarkdown());
      this.close();
    });

    const cancelBtn = actions.createEl("button", { text: "Cancel" });
    cancelBtn.addEventListener("click", () => this.close());
  }

  private selectedWeekInfo(): WeekInfo {
    return (
      this.weeks.find((w) => w.week === this.selectedWeek) ?? this.weeks[0]
    );
  }

  private currentMarkdown(): string {
    return generateWeekMarkdown(this.selectedWeekInfo(), this.startDay);
  }

  private updatePreview(): void {
    if (this.previewEl) {
      this.previewEl.setText(this.currentMarkdown());
    }
  }
}
