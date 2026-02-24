import { PageHeader } from "@/components/layout/page-header"
import { UploadWizard } from "@/components/upload/upload-wizard"

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Upload Episode"
        description="Upload audio and let AI generate show notes, assets, and more"
      />
      <UploadWizard />
    </div>
  )
}
