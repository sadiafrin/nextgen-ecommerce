// src/context/Invoice.js
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

export const generateInvoicePDF = (order) => {
  if (!order || !order.items) {
    console.error('❌ No order data found!');
    return null;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // ✅ Header - QuickBuy
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 107, 53); // QuickBuy Orange Color
  doc.text('🛍️ QuickBuy', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('QuickBuy Online Store', pageWidth / 2, 28, { align: 'center' });
  doc.text('Dhaka, Bangladesh | Phone: +880 1234-567890', pageWidth / 2, 33, { align: 'center' });
  
  doc.setDrawColor(255, 107, 53);
  doc.setLineWidth(0.5);
  doc.line(15, 38, pageWidth - 15, 38);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('INVOICE', pageWidth / 2, 50, { align: 'center' });
  
  // Order Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  const startY = 60;
  doc.text(`Invoice No: #${order.id?.slice(0, 12) || 'N/A'}`, 20, startY);
  doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 20, startY + 7);
  doc.text(`Status: ${order.status || 'Pending'}`, 20, startY + 14);
  doc.text(`Payment: ${order.paymentMethod || 'Cash on Delivery'}`, 20, startY + 21);
  
  doc.text('Bill To:', pageWidth - 60, startY);
  doc.text(order.customerName || 'Guest Customer', pageWidth - 60, startY + 7);
  doc.text(order.customerEmail || 'guest@email.com', pageWidth - 60, startY + 14);
  doc.text(order.customerPhone || 'N/A', pageWidth - 60, startY + 21);
  
  // Items Table
  const tableData = order.items?.map((item, index) => [
    index + 1,
    item.name || 'Unknown Product',
    item.quantity || 1,
    `৳${Number(item.price).toFixed(2)}`,
    `৳${(Number(item.price) * (item.quantity || 1)).toFixed(2)}`
  ]) || [];
  
  doc.autoTable({
    startY: 95,
    head: [['#', 'Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [255, 107, 53], // QuickBuy Orange
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    }
  });
  
  // Total
  const finalY = doc.lastAutoTable?.finalY + 10 || 120;
  const subtotal = order.items?.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0) || 0;
  const discount = order.discount || 0;
  const deliveryCharge = order.deliveryCharge || 0;
  const total = subtotal - discount + deliveryCharge;
  
  const rightX = pageWidth - 30;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  doc.text('Subtotal:', rightX - 50, finalY);
  doc.text(`৳${subtotal.toFixed(2)}`, rightX, finalY);
  
  if (discount > 0) {
    doc.text('Discount:', rightX - 50, finalY + 7);
    doc.text(`-৳${discount.toFixed(2)}`, rightX, finalY + 7);
  }
  
  doc.text('Delivery Charge:', rightX - 50, finalY + 14);
  doc.text(`৳${deliveryCharge.toFixed(2)}`, rightX, finalY + 14);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 107, 53);
  doc.text('Total:', rightX - 50, finalY + 25);
  doc.text(`৳${total.toFixed(2)}`, rightX, finalY + 25);
  
  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for shopping with QuickBuy!', pageWidth / 2, finalY + 45, { align: 'center' });
  doc.text('Visit us: www.quickbuy.com', pageWidth / 2, finalY + 52, { align: 'center' });
  
  doc.save(`Invoice-${order.id?.slice(0, 8) || Date.now()}.pdf`);
  return doc;
};

export default generateInvoicePDF;