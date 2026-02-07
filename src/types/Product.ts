export interface Product {
  id?: string;
  barcode: string;
  name: string;
  frontQuantity: number;
  backQuantity: number;
  wasteQuantity: number;
  reorderThreshold: number;
}
