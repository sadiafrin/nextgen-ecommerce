import { jsPDF } from "jspdf";

export const generateInvoice = (cart) => {
  const doc = new jsPDF();
  doc.text("NexGen E-Comm Invoice", 20, 20);
  
  cart.forEach((item, index) => {
    doc.text(`${index + 1}. ${item.name} - ${item.price}`, 20, 30 + (index * 10));
  });
  
  doc.save("invoice.pdf");
};