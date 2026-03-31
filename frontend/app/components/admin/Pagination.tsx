'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="fp-card mt-8 flex flex-wrap items-center justify-center gap-2 p-4 sm:justify-between">
      <div className="flex items-center gap-2">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        className="rounded-lg border border-[#c7dbef] px-4 py-2 text-sm font-semibold text-[#3f6482] transition hover:bg-[#edf4fb] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => {
              if (typeof page === 'number') {
                onPageChange(page);
              }
            }}
            disabled={page === '...' || page === currentPage || loading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              page === currentPage
                ? 'bg-[#2e74b5] text-white'
                : page === '...'
                ? 'cursor-default text-[#7290aa]'
                : 'border border-[#c7dbef] text-[#3f6482] hover:bg-[#edf4fb]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        className="rounded-lg border border-[#c7dbef] px-4 py-2 text-sm font-semibold text-[#3f6482] transition hover:bg-[#edf4fb] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
      </div>

      {/* Page Info */}
      <div className="text-sm text-[#5e7d98]">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}
