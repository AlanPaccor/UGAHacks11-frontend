import { useState } from "react";
import { X, Heart, MapPin, Phone, ExternalLink } from "lucide-react";
import type { Product } from "../types/Product";

interface Props {
  products: Product[];
  onClose: () => void;
}

interface Shelter {
  name: string;
  address: string;
  phone: string;
  accepts: string[];
  distance: string;
}

const SHELTERS: Shelter[] = [
  {
    name: "Athens Area Homeless Shelter",
    address: "120 N. Harris St, Athens, GA 30601",
    phone: "(706) 555-0101",
    accepts: ["Non-perishable food", "Canned goods", "Dry goods"],
    distance: "1.2 mi",
  },
  {
    name: "Food Bank of Northeast Georgia",
    address: "861 Newton Bridge Rd, Athens, GA 30607",
    phone: "(706) 555-0202",
    accepts: ["All food items", "Fresh produce", "Dairy", "Bakery"],
    distance: "3.4 mi",
  },
  {
    name: "Our Daily Bread Kitchen",
    address: "1000 Hawthorne Ave, Athens, GA 30606",
    phone: "(706) 555-0303",
    accepts: ["Prepared foods", "Fresh produce", "Bread", "Meat"],
    distance: "2.1 mi",
  },
  {
    name: "Campus Kitchen at UGA",
    address: "240 E Broad St, Athens, GA 30601",
    phone: "(706) 555-0404",
    accepts: ["Fresh produce", "Dairy", "Bakery items", "Surplus meals"],
    distance: "0.8 mi",
  },
  {
    name: "Salvation Army Athens",
    address: "575 N Pope St, Athens, GA 30601",
    phone: "(706) 555-0505",
    accepts: ["Non-perishable food", "Canned goods", "Hygiene products"],
    distance: "1.5 mi",
  },
];

export default function DonateModal({ products, onClose }: Props) {
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, number>
  >({});
  const [submitted, setSubmitted] = useState(false);

  // Only show products that have waste
  const donatable = products.filter((p) => p.wasteQuantity > 0);

  const toggleProduct = (barcode: string, maxQty: number) => {
    setSelectedProducts((prev) => {
      if (prev[barcode]) {
        const next = { ...prev };
        delete next[barcode];
        return next;
      }
      return { ...prev, [barcode]: Math.min(maxQty, 5) };
    });
  };

  const updateQty = (barcode: string, qty: number) => {
    setSelectedProducts((prev) => ({ ...prev, [barcode]: qty }));
  };

  const totalItems = Object.values(selectedProducts).reduce(
    (s, q) => s + q,
    0
  );

  const handleSubmit = () => {
    // In a real app this would POST to backend
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Heart className="w-5 h-5 text-emerald-500" />
            Donate Surplus Items
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {submitted ? (
            /* ── Success State ── */
            <div className="text-center py-10 space-y-4">
              <div className="text-6xl">💚</div>
              <h3 className="text-2xl font-bold text-gray-800">
                Donation Scheduled!
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {totalItems} item{totalItems !== 1 ? "s" : ""} will be picked up
                by <strong>{selectedShelter?.name}</strong>. Thank you for
                reducing waste and helping the community!
              </p>
              <button
                onClick={onClose}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors mt-4"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* ── Step 1: Choose Shelter ── */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  1. Choose a Shelter
                </h3>
                <div className="space-y-2">
                  {SHELTERS.map((shelter) => (
                    <button
                      key={shelter.name}
                      onClick={() => setSelectedShelter(shelter)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedShelter?.name === shelter.name
                          ? "border-emerald-500 bg-emerald-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {shelter.name}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {shelter.address}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {shelter.phone}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {shelter.accepts.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 ml-3">
                          {shelter.distance}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Step 2: Select Products ── */}
              {selectedShelter && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    2. Select Items to Donate
                  </h3>
                  {donatable.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6">
                      No products with waste to donate.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {donatable.map((p) => {
                        const isSelected = !!selectedProducts[p.barcode];
                        return (
                          <div
                            key={p.barcode}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              isSelected
                                ? "border-emerald-400 bg-emerald-50"
                                : "border-gray-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleProduct(p.barcode, p.wasteQuantity)
                              }
                              className="w-4 h-4 accent-emerald-600"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 text-sm">
                                {p.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {p.wasteQuantity} available for donation
                              </p>
                            </div>
                            {isSelected && (
                              <input
                                type="number"
                                min={1}
                                max={p.wasteQuantity}
                                value={selectedProducts[p.barcode] || 1}
                                onChange={(e) =>
                                  updateQty(
                                    p.barcode,
                                    Math.min(
                                      Number(e.target.value),
                                      p.wasteQuantity
                                    )
                                  )
                                }
                                className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Submit ── */}
              {selectedShelter && totalItems > 0 && (
                <button
                  onClick={handleSubmit}
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Schedule Donation — {totalItems} item
                  {totalItems !== 1 ? "s" : ""} to {selectedShelter.name}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
