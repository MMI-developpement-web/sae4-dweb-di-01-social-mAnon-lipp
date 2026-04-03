import { useState } from "react";
import Input from "./ui/Input";
import Button from "./ui/Button";
import type { SearchFilters } from "../lib/api";

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    q: "",
    user: "",
    startDate: "",
    searchType: "tweets",
  });

  // Auto-detect search type based on input
  const detectSearchType = (query: string): "tweets" | "users" | "hashtag" | "tweets" => {
    if (query.startsWith("@")) return "users";
    if (query.startsWith("#")) return "hashtag";
    return "tweets";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "q") {
      // Auto-detect search type based on query
      const detectedType = detectSearchType(value);
      setFilters((prev) => ({ 
        ...prev, 
        [name]: value,
        searchType: detectedType
      }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({ q: "", user: "", startDate: "", searchType: "tweets" });
    onSearch({ q: "", user: "", startDate: "", searchType: "tweets" });
  };

  const hasActiveFilters = filters.q || filters.user || filters.startDate;

  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            type="text"
            name="q"
            value={filters.q}
            onChange={handleChange}
            placeholder="Rechercher tweets, @utilisateurs, #hashtags..."
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="px-3"
            title="Filtres avancés"
          >
            ⚙️
          </Button>
          <Button
            onClick={handleSearch}
            variant="primary"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? "Recherche..." : "Rechercher"}
          </Button>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Author filter */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Auteur
              </label>
              <Input
                type="text"
                name="user"
                value={filters.user}
                onChange={handleChange}
                placeholder="@username"
                inputSize="sm"
              />
            </div>

            {/* Date filter */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                À partir du
              </label>
              <Input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleChange}
                inputSize="sm"
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex gap-2 justify-end">
          
          {hasActiveFilters && (
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
