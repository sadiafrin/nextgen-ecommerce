import { useState } from 'react';
import localforage from '../services/db'; // আমাদের সেই ডাটাবেজ ফাইলটিকে ইমপোর্ট করলাম

function ProductForm() {
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const saveProduct = async (e) => {
    e.preventDefault();
    
    // ১. প্রোডাক্টের একটি ইউনিক আইডি তৈরি করলাম
    const id = Date.now().toString();

    // ২. নতুন প্রোডাক্ট অবজেক্ট তৈরি করলাম
    const newProduct = {
      id: id,
      name: name,
      image: imageFile // এখানে ইমেজ ফাইলটি সরাসরি সেভ হচ্ছে
    };

    // ৩. localforage দিয়ে ডাটাবেজে সেভ করলাম
    await localforage.setItem(id, newProduct);
    
    alert("প্রোডাক্ট সফলভাবে সেভ হয়েছে!");
  };

  return (
    <form onSubmit={saveProduct}>
      <input type="text" placeholder="Product Name" onChange={(e) => setName(e.target.value)} />
      <input type="file" onChange={(e) => setImageFile(e.target.files[0])} />
      <button type="submit">Save Product</button>
    </form>
  );
}

export default ProductForm;