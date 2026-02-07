import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  getProductByBarcode,
  checkoutProduct,
  restockProduct,
  logWaste,
} from "../services/api";
import type { Product } from "../types/Product";

type ActionType = "checkout" | "restock" | "waste" | null;

interface Props {
  onTransactionComplete: () => void;
}

export default function InventoryManager({ onTransactionComplete }: Props) {
  // ── state ──
  const [barcode, setBarcode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [action, setAction] = useState<ActionType>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // ── auto-focus the barcode input (for USB scanner) ──
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // ── cleanup camera on unmount ──
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // ── lookup product ──
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

  // ── handle keyboard enter / USB scanner ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupProduct(barcode);
    }
  };

  // ── camera toggle ──
  const toggleCamera = async () => {
    if (cameraOpen) {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      setCameraOpen(false);
      return;
    }

    setCameraOpen(true);

    // give the DOM a tick to render the reader div
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
          () => {} // ignore scan failures (each frame that has no barcode)
        );
      } catch {
        setError("Could not access camera. Check permissions.");
        setCameraOpen(false);
      }
    }, 100);
  };

  // ── execute action ──
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
            `✅ Checked out ${quantity} × ${product.name} from front stock.`
          );
          break;
        case "restock":
          await restockProduct(product.barcode, quantity);
          setMessage(
            `✅ Restocked ${quantity} × ${product.name} to front shelves.`
          );
          break;
        case "waste":
          await logWaste(product.barcode, quantity);
          setMessage(
            `✅ Logged ${quantity} × ${product.name} as waste.`
          );
          break;
      }

      // refresh the product card and dashboard
      const res = await getProductByBarcode(product.barcode);
      setProduct(res.data);
      onTransactionComplete();
      setAction(null);
      setQuantity(1);
    } catch {
      setError("Transaction failed. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  // ── reset ──
  const handleReset = () => {
    setBarcode("");
    setProduct(null);
    setAction(null);
    setQuantity(1);
    setMessage("");
    setError("");
    barcodeInputRef.current?.focus();
  };

  // ── render ──
  return (
    <div className="max-w-2xl mx-auto mb-12">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {/* ── Header ── */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          📦 Scanner &amp; Actions
        </h2>

        {/* ── Barcode Input Row ── */}
        <div className="flex gap-2 mb-4">
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Scan or type barcode…"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => lookupProduct(barcode)}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Lookup
          </button>
          <button
            onClick={toggleCamera}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              cameraOpen
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {cameraOpen ? "Stop Cam" : "📷 Cam"}
          </button>
        </div>

        {/* ── Camera View ── */}
        {cameraOpen && (
          <div
            id="barcode-reader"
            className="mb-4 rounded-lg overflow-hidden border border-gray-200"
          />
        )}

        {/* ── Loading ── */}
        {loading && (
          <p className="text-blue-500 text-center animate-pulse my-4">
            Loading…
          </p>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {/* ── Success Message ── */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-4">
            {message}
          </div>
        )}

        {/* ── Product Card ── */}
        {product && (
          <div className="border border-gray-200 rounded-xl p-5 mb-4 bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-400">
                  Barcode: {product.barcode}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-gray-400 hover:text-gray-600 text-lg"
                title="Clear"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Front Stock
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {product.frontQuantity}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Back Stock
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {product.backQuantity}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Waste
                </p>
                <p className="text-2xl font-bold text-red-500">
                  {product.wasteQuantity}
                </p>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setAction("checkout")}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  action === "checkout"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                🛒 Checkout
              </button>
              <button
                onClick={() => setAction("restock")}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  action === "restock"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                }`}
              >
                📦 Restock
              </button>
              <button
                onClick={() => setAction("waste")}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  action === "waste"
                    ? "bg-red-600 text-white"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                🗑️ Waste
              </button>
            </div>

            {/* ── Quantity + Confirm ── */}
            {action && (
              <div className="flex items-center gap-3 mt-4">
                <label className="text-sm text-gray-600 font-medium">
                  Qty:
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing…" : "✔ Confirm"}
                </button>
                <button
                  onClick={() => {
                    setAction(null);
                    setQuantity(1);
                  }}
                  className="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
