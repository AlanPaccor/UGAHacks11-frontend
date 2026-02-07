export interface Transaction {
  id: string;
  productId: string;
  barcode: string;
  productName: string;
  transactionType: "CHECKOUT" | "RESTOCK" | "WASTE" | "RECEIVE";
  quantity: number;
  location: string;
  createdAt: string;
}
