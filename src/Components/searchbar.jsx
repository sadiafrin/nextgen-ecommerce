import { useRef } from 'react';
import * as mobilenet from '@tensorflow-models/mobilenet';

export default function SearchBar({ searchQuery, setSearchQuery }) {
  const fileInputRef = useRef();

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      const model = await mobilenet.load();
      const predictions = await model.classify(img);
      if (predictions.length > 0) {
        // প্রেডিকশন থেকে প্রথম শব্দটি সার্চ কুয়েরিতে সেট করুন
        setSearchQuery(predictions[0].className.split(',')[0]);
      }
    };
  };

  return (
    <div className="flex items-center gap-2 w-full md:w-96">
      <input 
        type="text"
        placeholder="Search by name or upload image..."
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*"
      />
      <button 
        onClick={() => fileInputRef.current.click()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        📷
      </button>
    </div>
  );
}