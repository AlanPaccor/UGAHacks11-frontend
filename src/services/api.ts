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
  API.put(`/products/barcode/${barcode}/checkout`, { quantity });

export const restockProduct = (barcode: string, quantity: number) =>
  API.put(`/products/barcode/${barcode}/restock`, { quantity });

export const logWaste = (barcode: string, quantity: number) =>
  API.put(`/products/barcode/${barcode}/waste`, { quantity });

export default API;
