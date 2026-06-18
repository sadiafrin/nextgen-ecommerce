export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        
        {/* Brand */}
        <div className="mb-4 md:mb-0">
          <h2 className="text-xl font-bold text-white">NexGen E‑Commerce</h2>
          <p className="mt-2 text-sm">
            Smart shopping with AI powered search and secure checkout.
          </p>
        </div>

        {/* Contact Info */}
        <div className="text-sm text-gray-400">
          <p>📧 support@nexgen.com</p>
          <p>☎ +880-1234-567890</p>
          <div className="flex gap-4 mt-3">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-blue-400">Facebook</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-blue-400">Twitter</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-blue-400">Instagram</a>
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} NexGen E‑Commerce. All rights reserved.
      </div>
    </footer>
  );
}
