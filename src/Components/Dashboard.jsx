import { useState } from 'react';
import SearchBar from './searchbar'; 
import ProductGrid from './ProductGrid';

export default function Dashboard() {
  const categories = ['shoes', 'watch', 'handbag', 'laptop', 'camera', 'perfume', 'sneakers'];
  
  const allProducts = Array.from({ length: 5000 }, (_, i) => {
    const category = categories[i % categories.length];
    const productImages = {
      shoes: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      watch: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400",
      handbag: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400",
      laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
      camera: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
      perfume: "https://images.unsplash.com/photo-1523293182086-76515894d078?w=400",
      sneakers: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400"
    };

    return {
      id: i + 1,
      name: `${category.charAt(0).toUpperCase() + category.slice(1)} - Item ${i + 1}`,
      price: `৳${Math.floor(Math.random() * 5000) + 500}`,
      stock: i % 2 === 0 ? "Available" : "Out of Stock",
      image: productImages[category]
    };
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const productsPerPage = 12;

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <div className="flex-1 p-8 bg-gray-50">
      {/* ওয়েলকাম সেকশন */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Welcome, Alex Carter!</h2>
        <p className="text-gray-500">Browse products and manage your cart.</p>
      </div>

      {/* ✅ এখানে আর business stats নেই */}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Trending Products</h2>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>
      
      <ProductGrid products={currentProducts} />

      {/* পেজিনেশন কন্ট্রোলস */}
      <div className="mt-10 flex justify-center items-center gap-2 flex-wrap pb-10">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          className="px-4 py-2 bg-white border rounded hover:bg-gray-100 disabled:opacity-50"
          disabled={currentPage === 1}
        >
          Previous
        </button>
        
        {Array.from({ length: 5 }).map((_, idx) => {
          const pageNumber = currentPage + idx;
          if (pageNumber > totalPages) return null;
          return (
            <button 
              key={pageNumber} 
              onClick={() => setCurrentPage(pageNumber)}
              className={`px-4 py-2 rounded ${currentPage === pageNumber ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-100'}`}
            >
              {pageNumber}
            </button>
          );
        })}
        
        <span className="px-2">...</span>
        
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          className="px-4 py-2 bg-white border rounded hover:bg-gray-100"
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
