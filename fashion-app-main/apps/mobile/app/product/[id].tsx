import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useCart } from '@/contexts/CartContext';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/product';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { addToCart, getQuantity } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setProduct({
        ...data,
        id: String(data.id),
        sizes: data.sizes || ['S', 'M', 'L', 'XL'],
      } as Product);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText>Product not found</ThemedText>
      </SafeAreaView>
    );
  }

  const bookmarked = isBookmarked(product.id);
  const quantity = getQuantity(product.id);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.productImage}
            contentFit="cover"
          />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <ThemedText type="title" style={styles.productName}>
              {product.name}
            </ThemedText>
            <ThemedText style={styles.stockBadge}>In Stock</ThemedText>
          </View>

          <View style={styles.sizesSection}>
            <ThemedText type="subtitle" style={styles.sectionLabel}>
              Sizes
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeScroll}>
              {product.sizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeBtn,
                    selectedSize === size && styles.sizeActive,
                  ]}
                  onPress={() => setSelectedSize(size)}
                >
                  <ThemedText
                    style={[
                      styles.sizeText,
                      selectedSize === size && styles.sizeTextActive,
                    ]}
                  >
                    {size}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.descriptionSection}>
            <ThemedText type="subtitle" style={styles.sectionLabel}>
              Description
            </ThemedText>
            <ThemedText style={styles.description}>{product.description}</ThemedText>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <ThemedText style={styles.bottomPrice}>${product.price.toFixed(2)}</ThemedText>
        </View>
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.bookmarkBtn}
            onPress={() => toggleBookmark(product.id)}
          >
            <IconSymbol
              name={bookmarked ? 'bookmark.fill' : 'bookmark'}
              size={24}
              color={bookmarked ? '#ef4444' : '#000'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addCartBtn, quantity > 0 && styles.addCartBtnActive]}
            onPress={() => addToCart(product.id)}
          >
            <IconSymbol
              name="plus"
              size={24}
              color={quantity > 0 ? '#fff' : '#000'}
            />
            {quantity > 0 && (
              <View style={styles.cartQtyBadge}>
                <Text style={styles.cartQtyText}>{quantity}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 4.5,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 20,
    gap: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  stockBadge: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  sizesSection: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  sizeScroll: {
    flexDirection: 'row',
  },
  sizeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  sizeActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  sizeTextActive: {
    color: '#fff',
  },
  descriptionSection: {
    gap: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 34,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bottomLeft: {
    flex: 1,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookmarkBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  addCartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  addCartBtnActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  cartQtyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartQtyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  buyNowBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },
  buyNowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
