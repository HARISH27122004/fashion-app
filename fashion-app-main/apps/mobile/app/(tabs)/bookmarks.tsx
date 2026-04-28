import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Link } from 'expo-router';

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

export default function BookmarksScreen() {
  const { bookmarks, toggleBookmark, isLoading } = useBookmarks();

  const bookmarkedProducts = PRODUCTS.filter((p) =>
    bookmarks.some((b) => b.productId === p.id)
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Bookmarks</ThemedText>
        <ThemedView style={styles.loading}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const renderProduct = ({ item }: { item: typeof PRODUCTS[0] }) => (
    <View style={styles.productCard}>
      <Link href={`/product/${item.id}`} style={styles.productLink}>
        <View style={styles.productLinkContent}>
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.productImage}
            contentFit="cover"
          />
          <View style={styles.productInfo}>
            <ThemedText type="default" style={styles.productName}>
              {item.name}
            </ThemedText>
            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
          </View>
        </View>
      </Link>
      <TouchableOpacity
        style={styles.bookmarkBtn}
        onPress={() => toggleBookmark(item.id)}
        accessibilityLabel={`Remove ${item.name} from bookmarks`}
      >
        <Text style={styles.bookmarkIcon}>♥</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.headerTitle}>
        Bookmarks
      </ThemedText>

      {bookmarkedProducts.length > 0 ? (
        <FlatList
          data={bookmarkedProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderProduct}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{'♥'}</Text>
          <ThemedText type="subtitle">No bookmarks yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Items you save will appear here
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
    marginBottom: 24,
  },
  loading: {
    marginTop: 20,
  },
  list: {
    gap: 16,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
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
    fontSize: 16,
    fontWeight: '600',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  bookmarkBtn: {
    padding: 8,
  },
  bookmarkIcon: {
    fontSize: 24,
    color: '#ff4444',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
    color: '#ccc',
  },
  emptySubtext: {
    color: '#999',
    textAlign: 'center',
  },
});
