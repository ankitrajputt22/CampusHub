import { ImagePlus, Star, Trash2 } from 'lucide-react';

export function ImageUploadSection({
  files,
  previewUrls,
  error,
  onAdd,
  onRemove,
}: {
  files: File[];
  previewUrls: Array<string | null>;
  error: string | null;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section
      aria-labelledby="listing-images-heading"
      className="rounded-2xl border border-[#dce2eb] bg-white p-5 shadow-[0_4px_18px_rgba(3,22,53,0.05)] sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            className="text-lg font-black text-[#10233d]"
            id="listing-images-heading"
          >
            Product images
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#667386]">
            Add 1–5 clear photos. The first image becomes the cover.
          </p>
        </div>
        <span className="rounded-full bg-[#eff4ff] px-3 py-1 text-xs font-bold text-[#40546d]">
          {files.length}/5 selected
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {files.length < 5 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#bfcbd9] bg-[#f8faff] px-3 text-center transition hover:border-[#00a7c4] hover:bg-cyan-50">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-[#007b95]">
              <ImagePlus aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="mt-2 text-xs font-black text-[#18304b]">
              Add photos
            </span>
            <span className="mt-1 text-[10px] leading-4 text-[#788496]">
              Up to {5 - files.length} more
            </span>
            <input
              accept="image/jpeg,image/png,image/webp"
              aria-label="Add product images"
              className="sr-only"
              multiple
              onChange={(event) => {
                onAdd(Array.from(event.target.files ?? []));
                event.target.value = '';
              }}
              type="file"
            />
          </label>
        )}

        {files.map((file, index) => (
          <div
            className="group relative aspect-square overflow-hidden rounded-xl border border-[#dce2eb] bg-[#eef3f8]"
            key={`${file.name}-${file.lastModified}-${index}`}
          >
            {previewUrls[index] ? (
              <img
                alt={`Selected product ${index + 1}`}
                className="h-full w-full object-cover"
                src={previewUrls[index] ?? undefined}
              />
            ) : (
              <span className="flex h-full items-center justify-center px-3 text-center text-xs font-semibold text-[#657387]">
                {file.name}
              </span>
            )}
            {index === 0 && (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#031635] px-2 py-1 text-[10px] font-bold text-white shadow">
                <Star aria-hidden="true" className="h-3 w-3" />
                Cover
              </span>
            )}
            <button
              aria-label={`Remove ${file.name}`}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-rose-700 shadow-sm hover:bg-rose-50"
              onClick={() => onRemove(index)}
              type="button"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
            <span className="absolute inset-x-0 bottom-0 truncate bg-[#031635]/80 px-2 py-1.5 text-[10px] font-semibold text-white">
              {file.name}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-[#687587]">
        JPG, JPEG, PNG, or WEBP · maximum 2 MB each. Clear photos from different
        angles help buyers trust the listing.
      </p>

      {error && (
        <p className="mt-3 text-sm font-semibold text-rose-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
