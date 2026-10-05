import React from "react";
import { ParsedImageRef } from "../../utils/feasibilityParsers";
import { ExternalLink } from "lucide-react";

export interface InspectorAttachmentsTabProps {
  previewableImages: ParsedImageRef[];
  referenceLinks: string[];
  imageSourceFor: (url?: string) => string | undefined;
  onSelectPreviewImage: (url: string) => void;
}

export const InspectorAttachmentsTab: React.FC<InspectorAttachmentsTabProps> = ({
  previewableImages,
  referenceLinks,
  imageSourceFor,
  onSelectPreviewImage,
}) => {
  return (
    <div className="py-4 space-y-4">
      {previewableImages.length > 0 && (
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 font-mono">
            Attached Photo References ({previewableImages.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {previewableImages.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => img.url && onSelectPreviewImage(img.url)}
                className="group relative rounded border border-[#CED4DA] dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-900 overflow-hidden cursor-pointer hover:border-[#714B67] transition"
              >
                <div className="aspect-[4/3] w-full bg-neutral-100 dark:bg-zinc-800 overflow-hidden relative">
                  <img
                    src={imageSourceFor(img.url)}
                    alt={img.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-[10px] font-medium text-white bg-black/60 px-2 py-0.5 rounded">
                      View Preview
                    </span>
                  </div>
                </div>
                <div className="p-1.5 flex items-center justify-between text-[10px] text-neutral-600 dark:text-zinc-400">
                  <span className="truncate">{img.name}</span>
                  <span className="font-mono text-neutral-400">#{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {referenceLinks.length > 0 && (
        <div className="pt-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 font-mono">
            Web Reference Links ({referenceLinks.length})
          </div>
          <div className="space-y-1.5">
            {referenceLinks.map((url, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded border border-[#CED4DA] dark:border-zinc-800 bg-[#F8F9FA] dark:bg-zinc-900/50 text-xs"
              >
                <a
                  href={url.startsWith("http") ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#714B67] dark:text-purple-400 hover:underline truncate font-mono text-xs flex-1"
                >
                  {url}
                </a>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {previewableImages.length === 0 && referenceLinks.length === 0 && (
        <div className="py-8 text-center text-neutral-400">
          No reference attachments or links attached to this record.
        </div>
      )}
    </div>
  );
};
