import { useEffect, useState } from "react";
import API from "./services/api";

interface Product {
  _id: string;
  name: string;
  price: number;
  description?: string;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    API.get("/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
        🛒 Products
      </h1>
      {products.length === 0 ? (
        <p className="text-center text-gray-500">Loading products...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-800">
                {product.name}
              </h2>
              {product.description && (
                <p className="text-gray-500 mt-2">{product.description}</p>
              )}
              <p className="text-green-600 font-bold text-lg mt-4">
                ${product.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
