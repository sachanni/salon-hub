import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

const categories = [
  { id: 'all', label: 'All Salons' },
  { id: 'hair', label: 'Hair Salons' },
  { id: 'nails', label: 'Nail Salons' },
  { id: 'spa', label: 'Spas' },
  { id: 'makeup', label: 'Makeup' },
  { id: 'massage', label: 'Massage' },
];

const CategoryTabs = ({ selectedCategory, onCategoryChange, className }: CategoryTabsProps) => {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
            selectedCategory === category.id
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          )}
          data-testid={`tab-category-${category.id}`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
