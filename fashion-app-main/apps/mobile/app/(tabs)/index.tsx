import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  categories,
  formatPrice,
  getCategoryLabel,
  getProductImageSource,
  normalizeProducts,
} from '@/lib/products';
import type { Product } from '@/types/product';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setErrorMessage(null);

    const { data, error } = await supabase.from('products').select('*');

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setProducts(normalizeProducts(data));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categoryOptions = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.value === 'all' || products.some((product) => product.category === category.value)
      ),
    [products]
  );

  const filteredProducts = useMemo(
    () =>
      selectedCategory === 'all'
        ? products
        : products.filter((product) => product.category === selectedCategory),
    [products, selectedCategory]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign out.');
    }
  }, [signOut]);

  const renderProduct = ({ item }: { item: Product }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
        style={styles.productCard}
      >
        <View style={styles.imageContainer}>
          <Image
            source={getProductImageSource(item.image)}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
          />
        </View>
        <View style={styles.productInfo}>
          <View style={styles.metaRow}>
            <Text style={styles.categoryText}>{getCategoryLabel(item.category)}</Text>
            <Text style={[styles.stockText, !item.inStock && styles.stockTextMuted]}>
              {item.inStock ? 'In stock' : 'Sold out'}
            </Text>
          </View>
          <ThemedText type="default" style={styles.productName} numberOfLines={2}>
            {item.name}
          </ThemedText>
          <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.welcomeText}>Welcome</Text>
          <ThemedText type="title" style={styles.title}>
            Latest Fashion
          </ThemedText>
          {user?.email && (
            <Text style={styles.emailText} numberOfLines={1}>
              {user.email}
            </Text>
          )}
        </View>
        <TouchableOpacity
          accessibilityLabel="Sign out"
          activeOpacity={0.75}
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={21} color="#111111" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.subtitle}>Discover curated pieces from the web catalog.</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {categoryOptions.map((category) => {
                const selected = selectedCategory === category.value;

                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    key={category.value}
                    onPress={() => setSelectedCategory(category.value)}
                    style={[styles.categoryChip, selected && styles.categoryChipActive]}
                  >
                    <Text style={[styles.categoryChipText, selected && styles.categoryChipTextActive]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity onPress={fetchProducts}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <>
                <ThemedText type="subtitle">No products found</ThemedText>
                <Text style={styles.emptyText}>Try another category or pull to refresh.</Text>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
    paddingRight: 16,
  },
  welcomeText: {
    color: '#2f6f6d',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#111111',
    lineHeight: 36,
  },
  emailText: {
    color: '#68717d',
    fontSize: 13,
    marginTop: 6,
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e0e5eb',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  subtitle: {
    fontSize: 16,
    color: '#59616b',
    lineHeight: 23,
    marginBottom: 14,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  categoryList: {
    gap: 10,
    paddingBottom: 18,
  },
  categoryChip: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe4ea',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryChipActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  categoryChipText: {
    color: '#4d5661',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: '#fff2f0',
    borderColor: '#ffd0ca',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
  },
  errorText: {
    color: '#9f2a1d',
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  retryText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '800',
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e3e7ec',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
    width: '48.5%',
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: '#eef1f5',
    width: '100%',
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productInfo: {
    gap: 7,
    padding: 12,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryText: {
    color: '#2f6f6d',
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  stockText: {
    color: '#16803d',
    fontSize: 11,
    fontWeight: '800',
  },
  stockTextMuted: {
    color: '#a23c35',
  },
  productName: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    minHeight: 42,
  },
  productPrice: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    minHeight: 260,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#68717d',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
