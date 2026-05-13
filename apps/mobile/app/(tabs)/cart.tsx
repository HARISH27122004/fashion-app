import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Link } from 'expo-router';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useCart } from '@/contexts/CartContext';

const PRODUCTS = [
  {
    id: '1',
    name: 'Mandt T-Shirt',
    price: 125.0,
    category: 't-shirt',
    image: '/products/mandt-tshirt.png',
  },
  {
    id: '2',
    name: 'Hand Sneak T-Shirt',
    price: 118.0,
    category: 't-shirt',
    image: '/products/hand-sneak-tshirt.png',
  },
  {
    id: '3',
    name: 'Cuiar T-Shirt',
    price: 109.0,
    category: 't-shirt',
    image: '/products/cuiar-tshirt.png',
  },
  {
    id: '4',
    name: 'Leon Dose Shirt',
    price: 188.0,
    category: 'shirt',
    image: '/products/leon-dose-shirt.png',
  },
  {
    id: '5',
    name: 'Embroidery Gen Shirt',
    price: 126.0,
    category: 'shirt',
    image: '/products/embroidery-gen-shirt.png',
  },
];

export default function CartScreen() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const cartItems = cart
    .map((item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      return product ? { ...item, product } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const renderCartItem = ({ item }: { item: typeof cartItems[0] }) => {
    const bookmarked = isBookmarked(item.productId);
    return (
      <View style={styles.cartItem}>
        <Link href={`/product/${item.productId}`} style={styles.productLink}>
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.productImage}
            contentFit="cover"
          />
        </Link>
        <View style={styles.productInfo}>
          <Link href={`/product/${item.productId}`}>
            <ThemedText type="default" style={styles.productName} numberOfLines={1}>
              {item.product.name}
            </ThemedText>
          </Link>
          <Text style={styles.productPrice}>${item.product.price.toFixed(2)}</Text>
          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.productId, item.quantity - 1)}
            >
              <Text style={styles.qtyText}>–</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.productId, item.quantity + 1)}
            >
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.rightColumn}>
          <Text style={styles.itemTotal}>${(item.product.price * item.quantity).toFixed(2)}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.bookmarkBtn}
              onPress={() => toggleBookmark(item.productId)}
            >
              <Text style={{ color: bookmarked ? '#ef4444' : '#ccc', fontSize: 18 }}>
                {bookmarked ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeFromCart(item.productId)}
            >
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.headerTitle}>
        Cart
      </ThemedText>

      {cartItems.length > 0 ? (
        <>
          <View style={styles.cartHeader}>
            <ThemedText style={styles.itemCount}>
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
            </ThemedText>
            <TouchableOpacity onPress={clearCart}>
              <ThemedText style={styles.clearBtn}>Clear all</ThemedText>
            </TouchableOpacity>
          </View>

          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.productId}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <ThemedText>Subtotal</ThemedText>
              <ThemedText>${total.toFixed(2)}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText>Shipping</ThemedText>
              <ThemedText style={styles.free}>Free</ThemedText>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <ThemedText type="subtitle">Total</ThemedText>
              <ThemedText type="subtitle">${total.toFixed(2)}</ThemedText>
            </View>
            <TouchableOpacity style={styles.checkoutBtn}>
              <ThemedText style={styles.checkoutText}>Proceed to Checkout</ThemedText>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <ThemedText type="subtitle">Your cart is empty</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Looks like you haven&apos;t added anything yet
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemCount: {
    fontSize: 13,
    color: '#666',
  },
  clearBtn: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  list: {
    gap: 12,
    paddingBottom: 100,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  productLink: {
    textDecorationLine: 'none',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    maxWidth: 120,
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quantity: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 8,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  bookmarkBtn: {
    padding: 4,
  },
  removeBtn: {
    padding: 4,
  },
  removeText: {
    fontSize: 18,
    color: '#999',
  },
  summary: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  free: {
    color: '#22c55e',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  checkoutBtn: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptySubtext: {
    color: '#999',
    textAlign: 'center',
  },
});
