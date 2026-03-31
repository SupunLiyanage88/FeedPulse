'use client';

interface FilterBarProps {
  category: string;
  status: string;
  sortBy: string;
  search: string;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: string) => void;
  onSortChange: (sortBy: string) => void;
  onSearchChange: (search: string) => void;
  onSearch: () => void;
}

export default function FilterBar({
  category,
  status,
  sortBy,
  search,
  onCategoryChange,
  onStatusChange,
  onSortChange,
  onSearchChange,
  onSearch,
}: FilterBarProps) {
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="fp-card mb-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search Input */}
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#1f4e78]">
            Search Feedback
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="Search by title or summary..."
              className="fp-input flex-1 px-4 py-2.5 text-sm"
            />
            <button
              onClick={onSearch}
              className="fp-button-primary px-4 py-2.5 text-sm"
            >
              Search
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#1f4e78]">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="fp-select px-4 py-2.5 text-sm"
          >
            <option value="All">All Categories</option>
            <option value="Bug">Bug</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Improvement">Improvement</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#1f4e78]">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="fp-select px-4 py-2.5 text-sm"
          >
            <option value="All">All Status</option>
            <option value="New">New</option>
            <option value="In Review">In Review</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#1f4e78]">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="fp-select px-4 py-2.5 text-sm"
          >
            <option value="date">Date (Newest)</option>
            <option value="priority">Priority (High)</option>
            <option value="sentiment">Sentiment</option>
          </select>
        </div>
      </div>
    </div>
  );
}
