import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Package, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ProductChecklistProps {
  look: any;
  salonId: string;
  onConfirm: () => void;
}

const categoryOrder = ['foundation', 'concealer', 'powder', 'primer', 'blush', 'bronzer', 'highlighter', 'eyeshadow', 'eyeliner', 'mascara', 'eyebrow_pencil', 'lipstick', 'lip_liner', 'lip_gloss', 'setting_spray'];
const categoryLabels: Record<string, string> = {
  foundation: 'Face Base',
  concealer: 'Face Base',
  powder: 'Face Base',
  primer: 'Face Base',
  blush: 'Cheeks',
  bronzer: 'Cheeks',
  highlighter: 'Cheeks',
  eyeshadow: 'Eyes',
  eyeliner: 'Eyes',
  mascara: 'Eyes',
  eyebrow_pencil: 'Eyes',
  lipstick: 'Lips',
  lip_liner: 'Lips',
  lip_gloss: 'Lips',
  setting_spray: 'Finishing',
};

export default function ProductChecklist({ look, salonId, onConfirm }: ProductChecklistProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Face Base', 'Eyes', 'Lips']));

  const groupedProducts = look.products.reduce((acc: any, item: any) => {
    const category = categoryLabels[item.product.category] || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const sectionOrder = ['Face Base', 'Eyes', 'Cheeks', 'Lips', 'Finishing', 'Other'];
  const sortedSections = sectionOrder.filter(section => groupedProducts[section]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const totalProducts = look.products.length;
  const inStockCount = look.products.filter((p: any) => p.product.isInStock).length;
  const outOfStockCount = totalProducts - inStockCount;

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border-purple-100">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              Product List
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {totalProducts} products • {inStockCount} in stock
            </p>
          </div>
          
          {outOfStockCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {outOfStockCount} out of stock
            </Badge>
          )}
        </div>

        {/* Inventory Status Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <p className="text-sm font-medium text-gray-900">Inventory Intelligence</p>
          </div>
          <p className="text-xs text-gray-700">
            {inStockCount === totalProducts
              ? '✅ All products available in your inventory! Ready to create this look.'
              : outOfStockCount <= 3
              ? `⚠️ ${outOfStockCount} product${outOfStockCount > 1 ? 's' : ''} need restocking. Alternative suggestions provided below.`
              : `❌ Multiple products out of stock. Consider suggesting a different look or restocking before proceeding.`}
          </p>
        </div>

        {/* Product Categories */}
        <div className="space-y-3">
          {sortedSections.map((section) => (
            <Collapsible
              key={section}
              open={expandedSections.has(section)}
              onOpenChange={() => toggleSection(section)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg px-4 py-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-medium">
                      {groupedProducts[section].length}
                    </div>
                    <h4 className="font-medium text-gray-900">{section}</h4>
                  </div>
                  {expandedSections.has(section) ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2 space-y-2">
                {groupedProducts[section].map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className={`ml-4 p-4 rounded-lg border-2 transition-all ${
                      item.product.isInStock
                        ? 'bg-white border-green-200 hover:border-green-300'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Stock Status Icon */}
                      <div className="mt-1">
                        {item.product.isInStock ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">
                              {item.product.brand} {item.product.name}
                            </h5>
                            {item.product.shade && (
                              <p className="text-sm text-gray-600 mt-0.5">
                                Shade: {item.product.shade}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {item.reason}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ₹{(item.product.price / 100).toFixed(2)}
                            </p>
                            {item.product.isInStock && (
                              <p className="text-xs text-green-600">
                                Qty: {item.product.quantity}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Substitute Product */}
                        {!item.product.isInStock && item.product.substituteProduct && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                            <p className="text-xs font-medium text-yellow-800 mb-1">
                              💡 Suggested Alternative:
                            </p>
                            <p className="text-sm text-gray-900">
                              {item.product.substituteProduct.brand} {item.product.substituteProduct.name}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              ✓ In stock ({item.product.substituteProduct.quantity} available)
                            </p>
                          </div>
                        )}

                        {/* Application Instructions */}
                        {item.applicationInstructions && (
                          <div className="mt-2 text-xs text-gray-600 bg-purple-50 p-2 rounded">
                            💄 {item.applicationInstructions}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {/* Confirm Button */}
        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={onConfirm}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
          >
            <Sparkles className="h-5 w-5" />
            Confirm & Save This Look
          </Button>
          {outOfStockCount > 0 && (
            <p className="text-xs text-center text-gray-600 mt-2">
              Note: Out-of-stock items will be flagged for reorder
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
