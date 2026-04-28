import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
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

export default function HomeScreen() {
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const { addToCart, getQuantity: getCartQuantity } = useCart();

  const renderProduct = ({ item }: { item: typeof PRODUCTS[0] }) => {
    const quantity = getCartQuantity(item.id);
    return (
      <View style={styles.productCard}>
        <Link href={`/product/${item.id}`} style={styles.productLink}>
          <View style={styles.productLinkContent}>
            <View style={styles.imageContainer}>
              <Image
                source={require('@/assets/images/partial-react-logo.png')}
                style={styles.productImage}
                contentFit="cover"
                transition={200}
              />
            </View>
            <View style={styles.productInfo}>
              <ThemedText type="default" style={styles.productName} numberOfLines={1}>
                {item.name}
              </ThemedText>
              <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            </View>
          </View>
        </Link>
        <View style={styles.rightActions}>
          {quantity > 0 && (
            <ThemedText style={styles.cartIndicator}>
              {quantity} in cart
            </ThemedText>
          )}
          <TouchableOpacity
            style={[styles.bookmarkBtn, isBookmarked(item.id) && styles.bookmarkedBtn]}
            onPress={() => toggleBookmark(item.id)}
            accessibilityLabel={isBookmarked(item.id) ? `Remove ${item.name} from bookmarks` : `Save ${item.name} to bookmarks`}
          >
            <IconSymbol
              name={isBookmarked(item.id) ? 'bookmark.fill' : 'bookmark'}
              size={24}
              color={isBookmarked(item.id) ? '#ef4444' : '#666'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addCartBtn}
            onPress={() => addToCart(item.id)}
            accessibilityLabel={`Add ${item.name} to cart`}
          >
            <IconSymbol name="plus" size={24} color="#111" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Welcome</ThemedText>
      </ThemedView>
      <FlatList
        data={PRODUCTS}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ThemedText style={styles.subtitle}>
            Discover the latest fashion
          </ThemedText>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  productLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  productImage: {
    width: 80,
    height: 80,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  cartIndicator: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    position: 'absolute',
    top: -8,
    right: 60,
  },
  bookmarkBtn: {
    padding: 6,
  },
  addCartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  bookmarkedBtn: {
    backgroundColor: '#fef2f2',
  },
});
