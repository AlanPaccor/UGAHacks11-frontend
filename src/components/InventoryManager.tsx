import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Search,
  Camera,
  CameraOff,
  ShoppingCart,
  PackagePlus,
  ArrowRightLeft,
  Trash2,
  ScanBarcode,
  X,
  Check,
} from "lucide-react";
import {
  getProductByBarcode,
  checkoutProduct,
  restockProduct,
  receiveProduct,
  logWaste,
} from "../services/api";
import type { Product } from "../types/Product";

type ActionType = "checkout" | "restock" | "receive" | "waste" | null;

interface Props {
  onTransactionComplete: () => void;
}

export default function InventoryManager({ onTransactionComplete }: Props) {
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [action, setAction] = useState<ActionType>(null);
  const [quantity, setQuantity] = useState(1);
  const [wasteLocation, setWasteLocation] = useState<"FRONT" | "BACK">("FRONT");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const lookupProduct = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setMessage("");
    setProduct(null);
    setAction(null);

    try {
      const res = await getProductByBarcode(code.trim());
      setProduct(res.data);
    } catch {
      setError(`No product found for barcode: ${code}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupProduct(barcode);
    }
  };

  const toggleCamera = async () => {
    if (cameraOpen) {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      setCameraOpen(false);
      return;
    }

    setCameraOpen(true);

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("barcode-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            setBarcode(decodedText);
            lookupProduct(decodedText);
            scanner.stop().catch(() => {});
            setCameraOpen(false);
          },
          () => {}
        );
      } catch {
        setError("Could not access camera. Check permissions.");
        setCameraOpen(false);
      }
    }, 100);
  };

  const handleConfirm = async () => {
    if (!product || !action || quantity < 1) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      switch (action) {
        case "checkout":
          await checkoutProduct(product.barcode, quantity);
          setMessage(
            `Checked out ${quantity} units of ${product.name} from front stock.`
          );
          break;
        case "restock":
          await restockProduct(product.barcode, quantity);
          setMessage(
            `Moved ${quantity} units of ${product.name} from back to front.`
          );
          break;
        case "receive":
          await receiveProduct(product.barcode, quantity);
          setMessage(
            `Received ${quantity} units of ${product.name} into back storage.`
          );
          break;
        case "waste":
          await logWaste(product.barcode, quantity, wasteLocation);
          setMessage(
            `Logged ${quantity} units of ${product.name} as discarded from ${wasteLocation.toLowerCase()} stock.`
          );
          break;
      }

      const res = await getProductByBarcode(product.barcode);
      setProduct(res.data);
      onTransactionComplete();
      setAction(null);
      setQuantity(1);
      setWasteLocation("FRONT");
    } catch {
      setError("Transaction failed. Please check the backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBarcode("");
    setProduct(null);
    setAction(null);
    setQuantity(1);
    setWasteLocation("FRONT");
    setMessage("");
    setError("");
    barcodeInputRef.current?.focus();
  };

  const actionConfig = [
    {
      key: "checkout" as const,
      label: "Checkout",
      desc: "Customer sale",
      icon: <ShoppingCart className="w-4 h-4" />,
      activeClass: "bg-indigo-600 text-white border-indigo-600",
      inactiveClass: "border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50",
    },
    {
      key: "receive" as const,
      label: "Receive",
      desc: "New stock in",
      icon: <PackagePlus className="w-4 h-4" />,
      activeClass: "bg-emerald-600 text-white border-emerald-600",
      inactiveClass: "border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50",
    },
    {
      key: "restock" as const,
      label: "Restock",
      desc: "Back to front",
      icon: <ArrowRightLeft className="w-4 h-4" />,
      activeClass: "bg-amber-600 text-white border-amber-600",
      inactiveClass: "border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50",
    },
    {
      key: "waste" as const,
      label: "Discard",
      desc: "Log waste",
      icon: <Trash2 className="w-4 h-4" />,
      activeClass: "bg-red-600 text-white border-red-600",
      inactiveClass: "border-slate-200 text-slate-600 hover:border-red-300 hover:bg-red-50",
    },
  ];

  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <ScanBarcode className="w-5 h-5 text-slate-400" />
        <h2 className="text-lg font-semibold text-slate-900">
          Scanner & Actions
        </h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        {/* Barcode Input */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan or enter barcode..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => lookupProduct(barcode)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Lookup
          </button>
          <button
            onClick={toggleCamera}
            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
              cameraOpen
                ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
            title={cameraOpen ? "Stop camera" : "Open camera scanner"}
          >
            {cameraOpen ? (
              <CameraOff className="w-4 h-4" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Camera */}
        {cameraOpen && (
          <div
            id="barcode-reader"
            className="mb-4 rounded-lg overflow-hidden border border-slate-200"
          />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Processing...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Success */}
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            {message}
          </div>
        )}

        {/* Product Card */}
        {product && (
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {product.barcode}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stock Levels */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                  Front
                </p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {product.frontQuantity}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                  Back
                </p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {product.backQuantity}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                  Discard
                </p>
                <p className="text-xl font-bold text-red-600 mt-0.5">
                  {product.wasteQuantity}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {actionConfig.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setAction(a.key)}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg border text-sm font-medium transition-all ${
                    action === a.key ? a.activeClass : a.inactiveClass
                  }`}
                >
                  {a.icon}
                  <span className="text-xs font-semibold">{a.label}</span>
                  <span className={`text-[10px] ${action === a.key ? "opacity-80" : "text-slate-400"}`}>
                    {a.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Confirm Section */}
            {action && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                {/* Waste location */}
                {action === "waste" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium w-12">
                      From:
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setWasteLocation("FRONT")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                          wasteLocation === "FRONT"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        Front Shelf
                      </button>
                      <button
                        onClick={() => setWasteLocation("BACK")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                          wasteLocation === "BACK"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        Back Storage
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium w-12">
                    Qty:
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      setAction(null);
                      setQuantity(1);
                      setWasteLocation("FRONT");
                    }}
                    className="px-4 py-2 rounded-lg text-sm text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
