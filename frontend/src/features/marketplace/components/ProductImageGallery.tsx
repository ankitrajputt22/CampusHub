import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { ProductDetails } from '../api/marketplaceApi';
import { MarketplaceProductVisual } from './MarketplaceProductVisual';

export function ProductImageGallery({ product }: { product: ProductDetails }) {
  const images = useMemo(
    () =>
      product.images.length > 0
        ? product.images
        : product.primaryImageUrl
          ? [product.primaryImageUrl]
          : [null],
    [product.images, product.primaryImageUrl],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setZoomOpen(false);
  }, [product.id]);

  useEffect(() => {
    if (!zoomOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setZoomOpen(false);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [zoomOpen]);

  const activeImage = images[activeIndex] ?? null;

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % images.length);
  }

  return (
    <>
      <section aria-label="Product images">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#dce2eb] bg-white shadow-[0_4px_18px_rgba(3,22,53,0.06)]">
          <MarketplaceProductVisual
            listing={{ ...product, primaryImageUrl: activeImage }}
          />
          <button
            aria-label="Open larger product image"
            className="absolute bottom-4 right-4 inline-flex h-10 items-center gap-2 rounded-xl border border-white/70 bg-white/95 px-3 text-xs font-bold text-[#10233d] shadow-md backdrop-blur hover:bg-white"
            onClick={() => setZoomOpen(true)}
            type="button"
          >
            <Maximize2 aria-hidden="true" className="h-4 w-4" />
            View larger
          </button>
          {images.length > 1 && (
            <>
              <GalleryArrow direction="previous" onClick={showPrevious} />
              <GalleryArrow direction="next" onClick={showNext} />
            </>
          )}
        </div>

        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              aria-label={`View product image ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white ${
                index === activeIndex
                  ? 'border-[#007b95] ring-2 ring-cyan-100'
                  : 'border-[#dce2eb] hover:border-[#8aa0b9]'
              }`}
              key={`${image ?? 'fallback'}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <MarketplaceProductVisual
                compact
                listing={{ ...product, primaryImageUrl: image }}
              />
            </button>
          ))}
        </div>
      </section>

      {zoomOpen && (
        <div
          aria-labelledby="product-image-viewer-title"
          aria-modal="true"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#031635]/90 p-4"
          role="dialog"
        >
          <h2 className="sr-only" id="product-image-viewer-title">
            {product.title} image viewer
          </h2>
          <button
            aria-label="Close image viewer"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#10233d] shadow-lg"
            onClick={() => setZoomOpen(false)}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
          <div className="relative aspect-[4/3] max-h-[84vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white">
            <MarketplaceProductVisual
              listing={{ ...product, primaryImageUrl: activeImage }}
            />
            {images.length > 1 && (
              <>
                <GalleryArrow direction="previous" onClick={showPrevious} />
                <GalleryArrow direction="next" onClick={showNext} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function GalleryArrow({
  direction,
  onClick,
}: {
  direction: 'previous' | 'next';
  onClick: () => void;
}) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;
  return (
    <button
      aria-label={`${direction === 'previous' ? 'Previous' : 'Next'} product image`}
      className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/95 text-[#10233d] shadow-md ${
        direction === 'previous' ? 'left-4' : 'right-4'
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
