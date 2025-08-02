import { App, Modal, Setting } from "obsidian";

export class BulkUpdateConfirmationModal extends Modal {
    private folderName: string;
    private fileCount: number;
    private sourceType: string;
    private onConfirm: () => void;
    private onCancel: () => void;

    constructor(
        app: App,
        folderName: string,
        fileCount: number,
        sourceType: string,
        onConfirm: () => void,
        onCancel: () => void,
    ) {
        super(app);
        this.folderName = folderName;
        this.fileCount = fileCount;
        this.sourceType = sourceType;
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // Modal title
        contentEl.createEl("h2", { text: "Confirm bulk title update" });

        // Warning message
        const warningEl = contentEl.createDiv("bulk-update-warning");
        warningEl.createEl("p", {
            text: "⚠️ You are about to perform a bulk title update operation.",
            cls: "bulk-update-warning-text",
        });

        // Details about the operation
        const detailsEl = contentEl.createDiv("bulk-update-details");
        detailsEl.createEl("p", {
            text: `Folder: "${this.folderName}"`,
        });
        detailsEl.createEl("p", {
            text: `Files to be processed: ${this.fileCount} markdown files`,
        });
        detailsEl.createEl("p", {
            text: `Source: ${this.sourceType}`,
        });
        detailsEl.createEl("p", {
            text: "This operation will recursively process all markdown files in the selected folder and its subfolders.",
        });

        // Important notice
        const noticeEl = contentEl.createDiv("bulk-update-notice");
        noticeEl.createEl("p", {
            text: "⚠️ IMPORTANT: There is no way to automatically revert these changes. Please ensure you have backed up your files before proceeding.",
            cls: "bulk-update-important",
        });

        // Buttons container
        const buttonContainer = contentEl.createDiv("bulk-update-buttons");
        buttonContainer.style.display = "flex";
        buttonContainer.style.justifyContent = "flex-end";
        buttonContainer.style.gap = "10px";
        buttonContainer.style.marginTop = "20px";

        // Cancel button
        const cancelButton = buttonContainer.createEl("button", {
            text: "Cancel",
            cls: "mod-cta",
        });
        cancelButton.addEventListener("click", () => {
            this.close();
            this.onCancel();
        });

        // Confirm button
        const confirmButton = buttonContainer.createEl("button", {
            text: "Proceed with bulk update",
            cls: "mod-cta mod-warning",
        });
        confirmButton.addEventListener("click", () => {
            this.close();
            this.onConfirm();
        });

        // Focus on cancel button by default for safety
        cancelButton.focus();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
