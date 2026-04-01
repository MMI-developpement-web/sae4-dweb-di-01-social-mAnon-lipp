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
  const [searchType, setSearchType] = useState<"tweets" | "users" | "hashtag">("tweets");
  const [filters, setFilters] = useState<SearchFilters>({
    q: "",
    user: "",
    startDate: "",
    searchType: "tweets",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchTypeChange = (type: "tweets" | "users" | "hashtag") => {
    setSearchType(type);
    setFilters((prev) => ({ ...prev, searchType: type }));
  };

  const handleSearch = () => {
    onSearch({ ...filters, searchType });
  };

  const handleReset = () => {
    setFilters({ q: "", user: "", startDate: "", searchType: "tweets" });
    onSearch({ q: "", user: "", startDate: "", searchType: "tweets" });
  };

  const hasActiveFilters = filters.q || filters.user || filters.startDate;
  const searchPlaceholder = 
    searchType === "users" 
      ? "Rechercher un utilisateur..." 
      : searchType === "hashtag"
      ? "Rechercher un hashtag..."
      : "Rechercher un tweet...";

  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Search type tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => handleSearchTypeChange("tweets")}
            variant={searchType === "tweets" ? "primary" : "secondary"}
            size="sm"
            className="rounded-full"
          >
            Tweets
          </Button>
          <Button
            onClick={() => handleSearchTypeChange("users")}
            variant={searchType === "users" ? "primary" : "secondary"}
            size="sm"
            className="rounded-full"
          >
            Utilisateurs
          </Button>
          <Button
            onClick={() => handleSearchTypeChange("hashtag")}
            variant={searchType === "hashtag" ? "primary" : "secondary"}
            size="sm"
            className="rounded-full"
          >
            Hashtags
          </Button>
        </div>

        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            type="text"
            name="q"
            value={filters.q}
            onChange={handleChange}
            placeholder={searchPlaceholder}
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

        {/* Advanced Filters - only show for tweets */}
        {isExpanded && searchType !== "users" && (
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
