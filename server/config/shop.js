export const shopConfig = {
  name: process.env.SHOP_NAME || "Meera's Retail Shop",
  address: process.env.SHOP_ADDRESS || '123 Main Street, Mumbai, Maharashtra 400001',
  phone: process.env.SHOP_PHONE || '+91 98765 43210',
  email: process.env.SHOP_EMAIL || 'meera@quickbill.shop',
  gstin: process.env.SHOP_GSTIN || '27AAAAA0000A1Z5',
  taxRate: parseFloat(process.env.TAX_RATE || '18'),
  footerMessage: 'Thank you for shopping with us! Visit again.',
};
