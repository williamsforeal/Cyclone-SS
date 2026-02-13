import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AirtableProduct {
  recordId: string;
  "Product Name"?: string;
  "Product Images"?: Array<{ url: string; thumbnails?: { small?: { url: string }; large?: { url: string } } }>;
}

interface MappedProduct {
  id: string;
  name: string;
  imageUrl?: string;
}

function mapProduct(raw: AirtableProduct): MappedProduct {
  const images = raw["Product Images"];
  return {
    id: raw.recordId,
    name: raw["Product Name"] ?? "Untitled",
    imageUrl: images?.[0]?.thumbnails?.large?.url ?? images?.[0]?.url,
  };
}

interface ProductImageSelectorProps {
  onSelect: (product: { id: string; name: string }) => void;
  selectedProductId?: string;
  trigger?: React.ReactNode;
}

export function ProductImageSelector({
  onSelect,
  selectedProductId,
  trigger,
}: ProductImageSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery<MappedProduct[]>({
    queryKey: ["/api/airtable/products"],
    select: (data: AirtableProduct[]) => data.map(mapProduct),
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            data-testid="button-select-product"
          >
            <Package className="mr-2 h-4 w-4" />
            {selectedProduct ? selectedProduct.name : "Select product image"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl"
        data-testid="dialog-product-selector"
      >
        <DialogHeader>
          <DialogTitle>Select Product</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading products...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4" data-testid="grid-products">
            {products.map((product, index) => (
              <div
                key={product.id}
                className={`cursor-pointer rounded-md border p-3 transition-colors ${
                  product.id === selectedProductId
                    ? "border-primary"
                    : "border-border"
                }`}
                data-testid={`card-product-${index}`}
                onClick={() => {
                  onSelect(product);
                  setOpen(false);
                }}
              >
                {product.imageUrl ? (
                  <div className="flex h-24 items-center justify-center rounded-md overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      data-testid={`img-product-${index}`}
                    />
                  </div>
                ) : (
                  <div className="flex h-24 items-center justify-center rounded-md bg-gradient-to-br from-gray-800/50 to-purple-900/30">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <p className="mt-2 text-center text-sm font-medium" data-testid={`text-product-name-${index}`}>
                  {product.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
