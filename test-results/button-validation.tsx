/**
 * Button Component Validation Test
 * This file validates that all 5 button components render correctly
 */

import {
  PrimaryButton,
  SecondaryButton,
  PublishButton,
  ExportButton,
  DangerButton,
} from "@/components/podbrain/buttons";

export default function ButtonValidationPage() {
  return (
    <div className="p-8 space-y-8">
      <section>
        <h2 className="text-xl font-bold mb-4">PrimaryButton - Gradient Border</h2>
        <div className="space-x-4">
          <PrimaryButton onClick={() => console.log("Primary clicked")} size="sm">
            Small
          </PrimaryButton>
          <PrimaryButton onClick={() => console.log("Primary clicked")} size="md">
            Medium
          </PrimaryButton>
          <PrimaryButton onClick={() => console.log("Primary clicked")} size="lg">
            Large
          </PrimaryButton>
          <PrimaryButton onClick={() => console.log("Primary clicked")} loading>
            Loading
          </PrimaryButton>
          <PrimaryButton disabled>Disabled</PrimaryButton>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">SecondaryButton - Press Animation</h2>
        <div className="space-x-4">
          <SecondaryButton onClick={() => console.log("Secondary clicked")} variant="outline">
            Outline
          </SecondaryButton>
          <SecondaryButton onClick={() => console.log("Secondary clicked")} variant="ghost">
            Ghost
          </SecondaryButton>
          <SecondaryButton disabled variant="outline">
            Disabled
          </SecondaryButton>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">PublishButton - Slide Text</h2>
        <div className="space-x-4">
          <PublishButton
            onClick={() => console.log("Publish clicked")}
            destination="to Notion"
          >
            Publish
          </PublishButton>
          <PublishButton
            onClick={() => console.log("Export clicked")}
            destination="as PDF"
          >
            Export
          </PublishButton>
          <PublishButton disabled destination="to Notion">
            Disabled
          </PublishButton>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">ExportButton - Keyboard Shortcut</h2>
        <div className="space-x-4">
          <ExportButton onClick={() => console.log("Export clicked")} shortcut="⌘E">
            Export
          </ExportButton>
          <ExportButton onClick={() => console.log("Save clicked")} shortcut="⌘S">
            Save
          </ExportButton>
          <ExportButton disabled shortcut="⌘D">
            Disabled
          </ExportButton>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">DangerButton - Hold to Confirm</h2>
        <div className="space-x-4">
          <DangerButton
            onConfirm={() => console.log("Delete confirmed")}
            holdDuration={1000}
          >
            Delete
          </DangerButton>
          <DangerButton
            onConfirm={() => console.log("Archive confirmed")}
            holdDuration={1500}
            holdingText="Release to archive"
          >
            Archive
          </DangerButton>
          <DangerButton disabled onConfirm={() => console.log("Never fires")}>
            Disabled
          </DangerButton>
        </div>
      </section>
    </div>
  );
}
