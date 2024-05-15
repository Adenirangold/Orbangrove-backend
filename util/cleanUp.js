const Cart = require("../models/cart");

const deleteExpiredCarts = async () => {
  try {
    const expirationDate = new Date(Date.now() - 24 * 60 * 30 * 1000); // 24 hours ago
    const result = await Cart.deleteMany({
      sessionId: { $exists: true },
      createdAt: { $lt: expirationDate },
    });
    console.log(`Deleted ${result.deletedCount} expired carts`);
  } catch (err) {
    console.error("Error deleting expired carts:", err);
  }
};

module.exports = deleteExpiredCarts;
