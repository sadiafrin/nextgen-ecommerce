// src/Components/searchbar.jsx
import { useState, useRef } from 'react';

export default function SearchBar({ searchQuery, setSearchQuery }) {
  const [isListening, setIsListening] = useState(false);
  const [isImageSearch, setIsImageSearch] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageName, setImageName] = useState('');
  const fileInputRef = useRef(null);

  // ✅ টেক্সট সার্চ - onChange ইভেন্ট
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value); // ← এখানে setSearchQuery কল হচ্ছে
  };

  // ✅ ইমেজ সার্চ
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setIsImageSearch(true);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);

    // ফাইলের নাম থেকে সার্চ টার্ম তৈরি
    const imageName = file.name.replace(/\.[^/.]+$/, '');
    const searchTerm = imageName.replace(/[_-]/g, ' ');
    setSearchQuery(searchTerm); // ← ইমেজ থেকেও সার্চ সেট হচ্ছে
  };

  // ✅ ভয়েস সার্চ
  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'bn-BD';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript); // ← ভয়েস থেকেও সার্চ সেট হচ্ছে
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Voice search is not supported in this browser.');
    }
  };

  // ✅ সার্চ ক্লিয়ার
  const clearSearch = () => {
    setSearchQuery('');
    setImagePreview(null);
    setIsImageSearch(false);
    setImageName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative w-full max-w-full sm:max-w-xs md:max-w-md">
      <div className="relative flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search products..."
          className="w-full px-3 sm:px-4 py-1.5 sm:py-2.5 pr-32 sm:pr-36 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm"
        />
        
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-28 sm:right-32 text-gray-400 hover:text-gray-600 transition p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute right-14 sm:right-16 p-1.5 rounded-lg transition text-gray-500 hover:text-blue-600 hover:bg-gray-100 border border-gray-200"
          title="Search by image"
          type="button"
        >
          <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <button
          onClick={handleVoiceSearch}
          className={`absolute right-6 sm:right-7 p-1.5 rounded-lg transition ${
            isListening 
              ? 'text-red-500 animate-pulse bg-red-50 border border-red-200' 
              : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100 border border-gray-200'
          }`}
          title="Voice search"
          type="button"
        >
          <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        <button
          type="submit"
          className="absolute right-0.5 sm:right-1 p-1.5 sm:p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {imagePreview && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-10 flex items-center gap-3">
          <img src={imagePreview} alt="Search" className="w-12 h-12 object-cover rounded-lg border" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">🔍 Searching by image</p>
            <p className="text-xs text-gray-400 truncate">{imageName}</p>
          </div>
          <button onClick={clearSearch} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>
      )}

      {isListening && (
        <div className="absolute -bottom-5 sm:-bottom-6 left-0 text-[10px] sm:text-xs text-red-500 font-medium animate-pulse">
          🎤 Listening...
        </div>
      )}
    </div>
  );
}