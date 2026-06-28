// src/context/Invoice.js
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (order) => {
  console.log('📄 Generating invoice for order:', order?.id);
  
  if (!order) {
    console.error('❌ No order object provided!');
    alert('No order data found!');
    return null;
  }
  
  if (!order.items || order.items.length === 0) {
    console.error('❌ No items in order!');
    alert('No items found in this order!');
    return null;
  }

  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // ========== HEADER ==========
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 107, 53);
    doc.text('QuickBuy', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Online Store', pageWidth / 2, 28, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Dhaka, Bangladesh | Phone: +880 1234-567890', pageWidth / 2, 35, { align: 'center' });
    
    doc.setDrawColor(255, 107, 53);
    doc.setLineWidth(0.5);
    doc.line(15, 40, pageWidth - 15, 40);
    
    // ========== TITLE ==========
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text('INVOICE', pageWidth / 2, 52, { align: 'center' });
    
    // ========== ORDER INFO ==========
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    const startY = 65;
    const col1X = 18;
    const col2X = pageWidth - 70;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Order Details', col1X, startY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: #${order.id?.slice(0, 12) || 'N/A'}`, col1X, startY + 8);
    
    let dateStr = 'N/A';
    if (order.createdAt) {
      try {
        const date = new Date(order.createdAt);
        if (!isNaN(date.getTime())) {
          dateStr = date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        }
      } catch (e) {
        dateStr = 'N/A';
      }
    }
    doc.text(`Date: ${dateStr}`, col1X, startY + 16);
    doc.text(`Status: ${order.status || 'Pending'}`, col1X, startY + 24);
    doc.text(`Payment: ${order.paymentMethod || 'Cash on Delivery'}`, col1X, startY + 32);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To', col2X, startY);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customerName || 'Guest Customer', col2X, startY + 8);
    doc.text(order.customerEmail || 'guest@email.com', col2X, startY + 16);
    doc.text(order.customerPhone || 'N/A', col2X, startY + 24);
    
    // ========== ITEMS TABLE ==========
    const tableData = order.items.map((item, index) => {
      let price = 0;
      if (typeof item.price === 'string') {
        const cleaned = item.price.replace(/[^0-9.]/g, '');
        price = parseFloat(cleaned) || 0;
      } else {
        price = Number(item.price) || 0;
      }
      const qty = Number(item.quantity) || 1;
      const total = price * qty;
      
      return [
        index + 1,
        item.name || 'Unknown Product',
        qty,
        `৳${price.toFixed(2)}`,
        `৳${total.toFixed(2)}`
      ];
    });
    
    autoTable(doc, {
      startY: 110,
      head: [['#', 'Item', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [255, 107, 53],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 15, right: 15 }
    });
    
    // ========== TOTAL SECTION ==========
    const finalY = doc.lastAutoTable.finalY + 10;
    
    // ✅ সঠিকভাবে Calculate করুন - সব Number এ Convert
    const subtotal = order.items.reduce((sum, item) => {
      let price = 0;
      if (typeof item.price === 'string') {
        const cleaned = item.price.replace(/[^0-9.]/g, '');
        price = parseFloat(cleaned) || 0;
      } else {
        price = Number(item.price) || 0;
      }
      const qty = Number(item.quantity) || 1;
      return sum + (price * qty);
    }, 0);
    
    // ✅ discount এবং deliveryCharge কে Number এ Convert করুন
    const discount = Number(order.discount) || 0;
    const deliveryCharge = Number(order.deliveryCharge) || 0;
    
    // ✅ Total Calculate - সঠিক ফর্মুলা
    const total = subtotal - discount + deliveryCharge;
    
    // ✅ Debug Log
    console.log('📊 Invoice Calculation:', {
      subtotal: subtotal,
      discount: discount,
      deliveryCharge: deliveryCharge,
      total: total
    });
    
    const rightX = pageWidth - 28;
    const labelX = rightX - 55;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    doc.text('Subtotal:', labelX, finalY);
    doc.text(`৳${subtotal.toFixed(2)}`, rightX, finalY, { align: 'right' });
    
    if (discount > 0) {
      doc.text('Discount:', labelX, finalY + 7);
      doc.text(`-৳${discount.toFixed(2)}`, rightX, finalY + 7, { align: 'right' });
    }
    
    // ✅ Delivery Charge দেখান (যদি ০ এর বেশি হয়)
    if (deliveryCharge > 0) {
      doc.text('Delivery Charge:', labelX, finalY + 14);
      doc.text(`৳${deliveryCharge.toFixed(2)}`, rightX, finalY + 14, { align: 'right' });
    }
    
    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    const dividerY = deliveryCharge > 0 ? finalY + 20 : finalY + 14;
    doc.line(rightX - 60, dividerY + 2, rightX, dividerY + 2);
    
    // ✅ Total - সঠিকভাবে দেখান
    const totalY = deliveryCharge > 0 ? finalY + 30 : finalY + 22;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 107, 53);
    doc.text('TOTAL:', labelX, totalY);
    doc.text(`৳${total.toFixed(2)}`, rightX, totalY, { align: 'right' });
    
    // ========== FOOTER ==========
    const footerY = Math.min(totalY + 40, pageHeight - 15);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text('Thank you for shopping with QuickBuy!', pageWidth / 2, footerY, { align: 'center' });
    doc.text('Visit us: www.quickbuy.com', pageWidth / 2, footerY + 6, { align: 'center' });
    
    // ========== SAVE ==========
    const fileName = `Invoice-${order.id?.slice(0, 8) || Date.now()}.pdf`;
    doc.save(fileName);
    console.log('✅ Invoice downloaded:', fileName);
    
    return doc;
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    alert('Failed to generate PDF: ' + error.message);
    return null;
  }
};

export default generateInvoicePDF;