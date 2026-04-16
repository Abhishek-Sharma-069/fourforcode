import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { PrescriptionService } from '../../core/services/prescription.service';
import { PrescriptionDto } from '../../core/models/api.models';

@Component({
  selector: 'app-prescription-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Drop zone -->
    <div
      class="relative rounded-xl border-2 border-dashed transition-all"
      [class.border-slate-700]="!isDragOver && !previewUrl"
      [class.bg-slate-900/50]="!isDragOver && !previewUrl"
      [class.border-cyan-500]="isDragOver"
      [class.bg-cyan-950/20]="isDragOver"
      [class.border-emerald-600]="!!previewUrl"
      [class.bg-emerald-950/10]="!!previewUrl"
      (dragover)="onDragOver($event)"
      (dragleave)="isDragOver = false"
      (drop)="onDrop($event)"
    >
      <!-- Empty state -->
      <div *ngIf="!previewUrl && !uploading" class="flex flex-col items-center justify-center px-6 py-10 text-center">
        <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-2xl">📋</div>
        <p class="text-sm font-medium text-slate-200">Upload Prescription Image</p>
        <p class="mt-1 text-xs text-slate-400">Drag & drop your prescription here, or click to browse</p>
        <p class="mt-1 text-xs text-slate-500">Supports JPEG, PNG, WebP, GIF, PDF — max 10 MB</p>
        <button
          class="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          (click)="fileInput.click()">
          Browse Files
        </button>
      </div>

      <!-- Preview state -->
      <div *ngIf="previewUrl && !uploading" class="p-4">
        <div class="flex items-start gap-4">
          <div class="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
            <img *ngIf="!isPdf" [src]="previewUrl" alt="Prescription preview" class="h-full w-full object-cover" />
            <div *ngIf="isPdf" class="flex h-full w-full flex-col items-center justify-center text-slate-400">
              <span class="text-3xl">📄</span>
              <span class="mt-1 text-xs">PDF</span>
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-slate-200">{{ fileName }}</p>
            <p class="mt-0.5 text-xs text-slate-400">{{ fileSizeLabel }}</p>
            <div class="mt-3 flex gap-2">
              <button
                class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                (click)="upload()">
                ✓ Upload & Submit
              </button>
              <button
                class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:border-rose-500 hover:text-rose-300"
                (click)="clear()">
                ✕ Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Uploading state -->
      <div *ngIf="uploading" class="flex flex-col items-center justify-center px-6 py-10">
        <div class="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400"></div>
        <p class="text-sm font-medium text-cyan-300">Uploading prescription...</p>
        <p class="mt-1 text-xs text-slate-400">Please wait while we process your file</p>
      </div>

      <!-- Hidden file input -->
      <input
        #fileInput
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
        class="hidden"
        (change)="onFileSelected($event)"
      />
    </div>

    <!-- Error message -->
    <p *ngIf="errorMessage" class="mt-2 rounded-lg border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">
      {{ errorMessage }}
    </p>

    <!-- Success message -->
    <p *ngIf="successMessage" class="mt-2 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
      {{ successMessage }}
    </p>
  `
})
export class PrescriptionUploadComponent {
  @Output() uploaded = new EventEmitter<PrescriptionDto>();

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  fileName = '';
  fileSizeLabel = '';
  isPdf = false;
  isDragOver = false;
  uploading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly prescriptionService: PrescriptionService) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private processFile(file: File): void {
    this.errorMessage = '';
    this.successMessage = '';

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Invalid file type. Please upload a JPEG, PNG, WebP, GIF, or PDF file.';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'File is too large. Maximum size is 10 MB.';
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;
    this.isPdf = file.type === 'application/pdf';
    this.fileSizeLabel = this.formatFileSize(file.size);

    if (!this.isPdf) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl = 'pdf';
    }
  }

  upload(): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.prescriptionService.uploadImage(this.selectedFile).subscribe({
      next: (prescription) => {
        this.uploading = false;
        this.successMessage = 'Prescription uploaded successfully! Awaiting admin review.';
        this.uploaded.emit(prescription);
        this.clear();
      },
      error: (err) => {
        this.uploading = false;
        this.errorMessage = err?.error?.message ?? 'Upload failed. Please try again.';
      }
    });
  }

  clear(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.fileName = '';
    this.fileSizeLabel = '';
    this.isPdf = false;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
