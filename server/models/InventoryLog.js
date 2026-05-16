import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['SALE', 'RESTOCK', 'CANCEL'], required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('InventoryLog', inventoryLogSchema);
