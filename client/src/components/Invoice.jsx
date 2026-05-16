import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Printer, Download } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/format';

const Invoice = ({ order, shop }) => {
  const invoiceRef = useRef(null);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${order.orderNumber}.pdf`);
  };

  if (!order) return null;

  const taxRate = shop?.taxRate || 18;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <button onClick={handlePrint} className="btn-primary">
          <Printer className="h-4 w-4" />
          Print
        </button>
        <button onClick={handleDownloadPDF} className="btn-secondary">
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      <div
        id="invoice-print"
        ref={invoiceRef}
        className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm"
      >
        <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">
              QB
            </div>
            <h1 className="font-display text-2xl font-bold">{shop?.name || "Meera's Retail Shop"}</h1>
            <p className="mt-1 text-sm text-slate-600">{shop?.address}</p>
            <p className="text-sm text-slate-600">
              {shop?.phone} | {shop?.email}
            </p>
            {shop?.gstin && <p className="text-sm text-slate-600">GSTIN: {shop.gstin}</p>}
          </div>
          <div className="text-right">
            <h2 className="font-display text-xl font-bold text-brand-600">TAX INVOICE</h2>
            <p className="mt-2 text-sm">
              <span className="text-slate-500">Invoice #:</span>{' '}
              <span className="font-semibold">{order.orderNumber}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-500">Date:</span>{' '}
              {formatDateTime(order.createdAt)}
            </p>
            <p className="text-sm capitalize">
              <span className="text-slate-500">Status:</span> {order.status}
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-slate-500">Bill To</p>
            <p className="font-medium">{order.customerName}</p>
            {order.customerPhone && <p>{order.customerPhone}</p>}
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-500">Cashier</p>
            <p>{order.cashier?.name || 'N/A'}</p>
            <p className="mt-2 font-semibold text-slate-500">Payment</p>
            <p className="uppercase">{order.paymentMethod}</p>
          </div>
        </div>

        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-800 bg-slate-50">
              <th className="py-2 text-left">#</th>
              <th className="py-2 text-left">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-2">{idx + 1}</td>
                <td className="py-2">
                  <p className="font-medium">{item.productName}</p>
                  {item.sku && <p className="text-xs text-slate-500">{item.sku}</p>}
                </td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 text-right">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Discount</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">GST ({taxRate}%)</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-slate-800 pt-2 text-lg font-bold">
            <span>Grand Total</span>
            <span className="text-brand-600">{formatCurrency(order.grandTotal)}</span>
          </div>
        </div>

        <p className="mt-8 border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
          {shop?.footerMessage || 'Thank you for shopping with us! Visit again.'}
        </p>
      </div>
    </div>
  );
};

export default Invoice;


