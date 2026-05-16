import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    customerName: 'Walk-in Customer',
    customerPhone: '',
    paymentMethod: 'cash',
    discount: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const existing = state.items.find((i) => i._id === product._id);
      if (existing) {
        if (existing.quantity < product.stock) {
          existing.quantity += 1;
        }
      } else if (product.stock > 0) {
        state.items.push({
          _id: product._id,
          name: product.name,
          sku: product.sku,
          sellingPrice: product.sellingPrice,
          stock: product.stock,
          quantity: 1,
        });
      }
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i._id === id);
      if (item && quantity > 0 && quantity <= item.stock) {
        item.quantity = quantity;
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i._id !== action.payload);
    },
    setCustomer: (state, action) => {
      state.customerName = action.payload.name ?? state.customerName;
      state.customerPhone = action.payload.phone ?? state.customerPhone;
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    setDiscount: (state, action) => {
      state.discount = Math.max(0, action.payload);
    },
    clearCart: (state) => {
      state.items = [];
      state.discount = 0;
      state.customerName = 'Walk-in Customer';
      state.customerPhone = '';
      state.paymentMethod = 'cash';
    },
  },
});

export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  setCustomer,
  setPaymentMethod,
  setDiscount,
  clearCart,
} = cartSlice.actions;

export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);

export default cartSlice.reducer;
