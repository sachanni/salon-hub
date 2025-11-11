import { Card } from '@/components/ui/card';
import { Check, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getProductColor } from '@/utils/colors';

interface ProductOption {
  productId: string;
  name: string;
  brand: string;
  shade?: string;
  color: string;
  isInStock: boolean;
  isBestMatch?: boolean;
}

interface ProductColorPickerProps {
  category: string;
  products: ProductOption[];
  selectedProductId: string;
  onProductSelect: (productId: string) => void;
}

export default function ProductColorPicker({
  category,
  products,
  selectedProductId,
  onProductSelect,
}: ProductColorPickerProps) {
  if (products.length === 0) return null;

  const selectedProduct = products.find((p) => p.productId === selectedProductId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900 capitalize flex items-center gap-2">
          {category}
          {selectedProduct?.isBestMatch && (
            <Badge variant="default" className="gap-1 bg-green-600 text-xs">
              <ThumbsUp className="h-3 w-3" />
              AI Pick
            </Badge>
          )}
        </h4>
        <span className="text-xs text-gray-500">{products.length} shades</span>
      </div>

      {/* Color Palette */}
      <div className="flex items-center gap-2 flex-wrap p-3 bg-white rounded-lg border border-gray-200">
        {products.map((product) => {
          const isSelected = product.productId === selectedProductId;
          const isBestMatch = product.isBestMatch;

          return (
            <button
              key={product.productId}
              onClick={() => product.isInStock && onProductSelect(product.productId)}
              disabled={!product.isInStock}
              className={`
                relative w-14 h-14 rounded-xl border-3 transition-all shadow-md
                ${isSelected ? 'border-purple-600 scale-110 shadow-purple-300' : 'border-gray-300'}
                ${isBestMatch && !isSelected ? 'border-green-500 shadow-green-200' : ''}
                ${!product.isInStock ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg cursor-pointer'}
              `}
              style={{ backgroundColor: product.color }}
              title={`${product.brand} ${product.name}${product.shade ? ` - ${product.shade}` : ''}${!product.isInStock ? ' (Out of stock)' : ''}`}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                  <Check className="h-6 w-6 text-white drop-shadow-2xl" strokeWidth={4} />
                </div>
              )}
              {isBestMatch && !isSelected && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 shadow-lg">
                  <ThumbsUp className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Product Card */}
      {selectedProduct && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-md">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex-shrink-0 shadow-lg border-2 border-white"
              style={{ backgroundColor: selectedProduct.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">
                {selectedProduct.brand}
              </p>
              <p className="text-xs text-gray-700 font-medium mt-0.5">
                {selectedProduct.name}
              </p>
              {selectedProduct.shade && (
                <p className="text-xs text-gray-600 mt-1">Shade: {selectedProduct.shade}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={selectedProduct.isInStock ? "default" : "secondary"} className="text-xs">
                  {selectedProduct.isInStock ? '✓ In Stock' : 'Out of Stock'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
