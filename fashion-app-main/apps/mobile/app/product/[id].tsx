import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { supabase } from '@/lib/supabase';
import {
  formatPrice,
  getCategoryLabel,
  getProductImageSource,
  normalizeProduct,
} from '@/lib/products';
import type { Product } from '@/types/product';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setErrorMessage('Product id is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();

    if (error) {
      setErrorMessage(error.message);
      setProduct(null);
      setLoading(false);
      return;
    }

    if (data) {
      const nextProduct = normalizeProduct(data);
      setProduct(nextProduct);
      setSelectedSize(nextProduct.sizes[0] ?? null);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  }, [router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator color="#111111" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <TouchableOpacity activeOpacity={0.75} onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#111111" />
        </TouchableOpacity>
        <ThemedText type="subtitle">Product not found</ThemedText>
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        <TouchableOpacity activeOpacity={0.8} onPress={fetchProduct} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.75} onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#111111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image
            source={getProductImageSource(product.image)}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <Text style={styles.categoryBadge}>{getCategoryLabel(product.category)}</Text>
            <Text style={[styles.stockBadge, !product.inStock && styles.stockBadgeMuted]}>
              {product.inStock ? 'In Stock' : 'Sold Out'}
            </Text>
          </View>

          <View style={styles.titleRow}>
            <ThemedText type="title" style={styles.productName}>
              {product.name}
            </ThemedText>
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
          <Text style={styles.bottomLabel}>Price</Text>
          <ThemedText style={styles.bottomPrice}>{formatPrice(product.price)}</ThemedText>
        </View>
        <Text style={[styles.bottomStock, !product.inStock && styles.bottomStockMuted]}>
          {product.inStock ? 'Available' : 'Unavailable'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#f5f7fa',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e0e5eb',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerTitle: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: 124,
  },
  imageContainer: {
    aspectRatio: 4 / 4.5,
    backgroundColor: '#eef1f5',
    marginHorizontal: 16,
    overflow: 'hidden',
    borderRadius: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 20,
    gap: 22,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryBadge: {
    color: '#2f6f6d',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    lineHeight: 31,
  },
  stockBadge: {
    color: '#16803d',
    fontSize: 13,
    fontWeight: '800',
  },
  stockBadgeMuted: {
    color: '#a23c35',
  },
  sizesSection: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  sizeScroll: {
    flexDirection: 'row',
  },
  sizeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dce2e8',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  sizeActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '800',
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
    color: '#59616b',
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
    borderTopColor: '#e0e5eb',
  },
  bottomLeft: {
    flex: 1,
  },
  bottomLabel: {
    color: '#68717d',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '800',
  },
  bottomStock: {
    color: '#16803d',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomStockMuted: {
    color: '#a23c35',
  },
  errorText: {
    color: '#9f2a1d',
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#111111',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
