import { useEffect, useState } from 'react';
import localforage from '../services/db';

function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // ডাটাবেজে যত ডাটা আছে সব একবারে নিয়ে আসা
    localforage.iterate((value) => {
      setProducts((prev) => [...prev, value]);
    });
  }, []);

  return (
    <div>
      <h2>প্রোডাক্ট লিস্ট</h2>
      {products.map((p) => (
        <div key={p.id} style={{ border: '1px solid #ccc', margin: '10px' }}>
          <p>{p.name}</p>
          {/* ইমেজ দেখানোর আসল জাদু এখানে */}
          <ProductImage imageBlob={p.image} />
        </div>
      ))}
    </div>
  );
}

// ইমেজ দেখানোর আলাদা ছোট কম্পোনেন্ট
function ProductImage({ imageBlob }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (imageBlob) {
      const objectUrl = URL.createObjectURL(imageBlob);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [imageBlob]);

  return url ? <img src={url} alt="Product" width="100" /> : <p>Loading...</p>;
}

export default ProductList;