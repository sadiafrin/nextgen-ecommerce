// src/Components/ProductDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ প্রোডাক্ট লোড করুন (ডামি ডেটা)
  useEffect(() => {
    // এখানে আপনার আসল প্রোডাক্ট ডেটা লোড করুন
    const mockProduct = {
      id: parseInt(id),
      name: 'Shoes - Item 1',
      price: '৳1200',
      category: 'shoes',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      description: 'High quality shoes with comfortable fit. Perfect for daily use.',
      stock: 'In Stock'
    };
    setProduct(mockProduct);

    // ✅ রিভিউ লোড করুন (localStorage থেকে)
    const savedReviews = JSON.parse(localStorage.getItem(`reviews_${id}`) || '[]');
    setReviews(savedReviews);
  }, [id]);

  // ✅ রিভিউ সাবমিট
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to submit a review');
      return;
    }
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!reviewText.trim()) {
      alert('Please write a review');
      return;
    }

    setIsSubmitting(true);

    const newReview = {
      id: Date.now(),
      name: reviewName || user.name || 'Anonymous',
      email: reviewEmail || user.email || 'guest@example.com',
      rating: rating,
      text: reviewText,
      date: new Date().toISOString(),
      userId: user.uid || 'guest'
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem(`reviews_${id}`, JSON.stringify(updatedReviews));

    // রিসেট ফর্ম
    setRating(0);
    setReviewText('');
    setReviewName('');
    setReviewEmail('');
    setIsSubmitting(false);

    alert('✅ Review submitted successfully!');
  };

  if (!product) {
    return <div className="text-center py-20">Loading...</div>;
  }

  // ✅ গড় রেটিং
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* ✅ প্রোডাক্ট ডিটেইল */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 p-6">
          <div>
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-96 object-cover rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{product.name}</h1>
            <p className="text-sm text-gray-500 uppercase mt-1">{product.category}</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{product.price}</p>
            
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-5 h-5 ${i < Math.floor(avgRating) ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
            </div>

            <p className="text-gray-600 mt-4">{product.description}</p>
            <p className={`mt-2 font-medium ${product.stock === 'In Stock' ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock}
            </p>

            <button
              onClick={() => addToCart(product)}
              className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              🛒 Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* ✅ রিভিউ সেকশন */}
      <div className="mt-10 bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📝 Reviews & Ratings</h2>
        
        {/* রেটিং সারাংশ */}
        <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-800">{avgRating || 0}</div>
            <div className="flex items-center justify-center mt-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-4 h-4 ${i < Math.floor(avgRating) ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <div className="text-sm text-gray-500">{reviews.length} reviews</div>
          </div>
          <div className="flex-1">
            {[5,4,3,2,1].map((star) => {
              const count = reviews.filter(r => r.rating === star).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-8">{star}★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="w-8 text-gray-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ✅ রিভিউ ফর্ম */}
        {user ? (
          <form onSubmit={handleSubmitReview} className="border-t pt-6">
            <h3 className="font-semibold text-gray-700 mb-3">Write a Review</h3>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600">Rating:</span>
              {[1,2,3,4,5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <svg className={`w-8 h-8 transition-colors ${(hoverRating || rating) >= star ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                </button>
              ))}
              <span className="text-sm text-gray-500 ml-2">{rating > 0 ? `${rating}★` : 'Select'}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                placeholder="Your Name"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                value={reviewEmail}
                onChange={(e) => setReviewEmail(e.target.value)}
                placeholder="Your Email"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your review here..."
              rows="3"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium text-white transition ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div className="border-t pt-6 text-center">
            <p className="text-gray-500">Please <Link to="/login" className="text-blue-600 hover:underline">login</Link> to write a review</p>
          </div>
        )}

        {/* ✅ রিভিউ লিস্ট */}
        <div className="border-t pt-6 mt-6">
          <h3 className="font-semibold text-gray-700 mb-4">All Reviews ({reviews.length})</h3>
          {reviews.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {review.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{review.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2 text-sm">{review.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}