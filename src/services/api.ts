import axios from "axios";

const API = axios.create({
  baseURL: "", // proxied through Vite dev server
});

// ── Product Endpoints ──
export const getProducts = () => API.get("/products");
export const getProductByBarcode = (barcode: string) =>
  API.get(`/products/barcode/${barcode}`);
export const addProduct = (product: object) => API.post("/products", product);

// ── Inventory Transaction Endpoints ──
export const checkoutProduct = (barcode: string, quantity: number) =>
  API.post("/inventory/checkout", { barcode, quantity });

export const restockProduct = (barcode: string, quantity: number) =>
  API.post("/inventory/restock", { barcode, quantity });

export const logWaste = (barcode: string, quantity: number, location: "FRONT" | "BACK") =>
  API.post("/inventory/waste", { barcode, quantity, location });

// ── Waste History ──
export const getWasteHistory = () => API.get("/inventory/waste");
export const getWasteHistoryByBarcode = (barcode: string) =>
  API.get(`/inventory/waste/${barcode}`);

export default API;
