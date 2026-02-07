export interface Transaction {
  id: string;
  productId: string;
  barcode: string;
  productName: string;
  transactionType: "CHECKOUT" | "RESTOCK" | "WASTE";
  quantity: number;
  location: string;
  createdAt: string;
}
