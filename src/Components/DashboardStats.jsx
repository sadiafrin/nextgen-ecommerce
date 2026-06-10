export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm">New Customers</p>
        <h3 className="text-2xl font-bold text-gray-800">845</h3>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm">Total Orders</p>
        <h3 className="text-2xl font-bold text-gray-800">2,130</h3>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 text-sm">Monthly Sales</p>
        <h3 className="text-2xl font-bold text-gray-800">৳1,50,000</h3>
      </div>
    </div>
  );
}