import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FiShoppingBag,
  FiSearch,
  FiFilter,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiStar,
  FiDatabase,
  FiUpload,
  FiFolder,
} from 'react-icons/fi';
import {
  getAllProducts,
  subscribeToProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  seedInitialProducts,
  getAllCategories,
  subscribeToCategories,
  createCategory,
  deleteCategory,
  processProductImageFile,
  CATEGORIES as DEFAULT_CATEGORIES,
  formatProductPrice,
} from '../../services/productService';

const initialFormState = {
  id: '',
  name: '',
  category: 'Personalized Gifts',
  price: '',
  rating: 4.9,
  image: '',
  description: '',
  features: '',
  available: true,
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal states: 'create' | 'edit' | 'delete' | 'categories' | null
  const [modalMode, setModalMode] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [targetProduct, setTargetProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Image Upload / URL tab state in product modal
  const [imageInputMode, setImageInputMode] = useState('url'); // 'url' | 'upload'
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  // Category management sub-state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // Real-time synchronization for products and categories
  useEffect(() => {
    setLoading(true);
    const unsubProds = subscribeToProducts(
      (items) => {
        setProducts(items);
        setLoading(false);
      },
      (err) => {
        console.error('Products subscription error:', err);
        setError(err.message || 'Unable to subscribe to live products.');
        setLoading(false);
      }
    );

    const unsubCats = subscribeToCategories(
      (cats) => {
        setCategories(cats);
      },
      (err) => {
        console.warn('Categories subscription error:', err);
      }
    );

    return () => {
      unsubProds();
      unsubCats();
    };
  }, []);

  // Manual refresh helper
  const handleManualRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [prods, cats] = await Promise.all([
        getAllProducts(),
        getAllCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setStatusMessage({ type: 'success', text: 'Live catalog refreshed from Cloud Firestore.' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Refresh error:', err);
      setError(err.message || 'Refresh failed.');
    } finally {
      setRefreshing(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    const defaultCat = categories.find((c) => c !== 'All') || 'Personalized Gifts';
    setFormData({
      ...initialFormState,
      category: defaultCat,
    });
    setImagePreview('');
    setImageInputMode('url');
    setModalMode('create');
  };

  // Open Edit Modal
  const openEditModal = (prod) => {
    setTargetProduct(prod);
    setFormData({
      id: prod.id,
      name: prod.name || '',
      category: prod.category || 'Personalized Gifts',
      price: prod.numericPrice !== undefined ? String(prod.numericPrice) : String(prod.price || '').replace(/[^0-9.]/g, ''),
      rating: prod.rating || 4.9,
      image: prod.image || '',
      description: prod.description || '',
      features: Array.isArray(prod.features) ? prod.features.join('\n') : '',
      available: prod.available !== false,
    });
    setImagePreview(prod.image || '');
    setImageInputMode(prod.image && prod.image.startsWith('data:') ? 'upload' : 'url');
    setModalMode('edit');
  };

  // Open Delete Modal
  const openDeleteModal = (prod) => {
    setTargetProduct(prod);
    setModalMode('delete');
  };

  // Close any active modal
  const closeModal = () => {
    setModalMode(null);
    setTargetProduct(null);
    setFormData(initialFormState);
    setImagePreview('');
    setNewCategoryName('');
  };

  // Handle local file selection and processing
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await processProductImageFile(file);
      setImagePreview(dataUrl);
      setFormData((prev) => ({ ...prev, image: dataUrl }));
    } catch (err) {
      console.error('Image upload processing failed:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to process image file.' });
    }
  };

  // Handle URL change
  const handleImageUrlChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, image: val }));
    setImagePreview(val.trim());
  };

  // Handle Product Form Submit (Create / Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Product name is required.' });
      return;
    }
    const parsedPrice = Number(formData.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setStatusMessage({ type: 'error', text: 'Product price must be a valid non-negative number.' });
      return;
    }
    if (!formData.image || !formData.image.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide a product image or upload an image file.' });
      return;
    }
    if (!formData.category || formData.category === 'All') {
      setStatusMessage({ type: 'error', text: 'Please select a valid product category.' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const featuresArray = formData.features
        ? String(formData.features).split('\n').map((f) => f.trim()).filter(Boolean)
        : [];

      if (modalMode === 'create') {
        const created = await createProduct({
          name: formData.name.trim(),
          category: formData.category,
          price: parsedPrice,
          rating: Number(formData.rating) || 5.0,
          image: formData.image.trim(),
          description: formData.description?.trim() || '',
          features: featuresArray,
          available: Boolean(formData.available),
        });

        setStatusMessage({
          type: 'success',
          text: `"${created.name}" was added to Firestore and is now live in the customer Shop!`,
        });
      } else if (modalMode === 'edit' && targetProduct) {
        await updateProduct(targetProduct.id, {
          name: formData.name.trim(),
          category: formData.category,
          price: parsedPrice,
          rating: Number(formData.rating) || targetProduct.rating,
          image: formData.image.trim(),
          description: formData.description?.trim() || '',
          features: featuresArray,
          available: Boolean(formData.available),
        });

        setStatusMessage({
          type: 'success',
          text: `"${formData.name}" has been updated in Firestore and synchronized.`,
        });
      }

      closeModal();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.error('Product save error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Operation failed. Please check Firestore permissions.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!targetProduct) return;
    setSubmitting(true);

    try {
      await deleteProduct(targetProduct.id);
      setStatusMessage({
        type: 'success',
        text: `Product "${targetProduct.name}" removed from Firestore and storefront.`,
      });
      closeModal();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.error('Delete product error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to delete product.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Seed Initial Catalog
  const handleSeedCatalog = async () => {
    setSubmitting(true);
    setStatusMessage(null);
    try {
      const seeded = await seedInitialProducts();
      if (seeded) {
        setStatusMessage({
          type: 'success',
          text: 'Initial static product catalog seeded into Cloud Firestore successfully!',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Firestore already contains catalog documents. Preserved existing items.',
        });
      }
    } catch (err) {
      console.error('Seed error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to seed catalog into Firestore.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Category Management Handlers
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setCategorySubmitting(true);
    try {
      await createCategory(newCategoryName.trim());
      setNewCategoryName('');
      setStatusMessage({
        type: 'success',
        text: `Category "${newCategoryName.trim()}" added to Firestore and Shop filters!`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Create category error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to create category.',
      });
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (!catName || catName === 'All') return;
    setCategorySubmitting(true);

    try {
      await deleteCategory(catName);
      setStatusMessage({
        type: 'success',
        text: `Category "${catName}" deleted from Firestore.`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Delete category error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Could not delete category.',
      });
    } finally {
      setCategorySubmitting(false);
    }
  };

  // Compute product count per category for safety checks
  const categoryUsageCount = useMemo(() => {
    const counts = {};
    for (const prod of products) {
      const c = prod.category || 'General';
      counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCat =
        selectedCategory === 'All' || prod.category === selectedCategory;
      if (!matchesCat) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const name = (prod.name || '').toLowerCase();
      const desc = (prod.description || '').toLowerCase();
      const cat = (prod.category || '').toLowerCase();

      return name.includes(term) || desc.includes(term) || cat.includes(term);
    });
  }, [products, selectedCategory, searchTerm]);

  const selectCategoriesList = useMemo(() => {
    return categories.filter((c) => c !== 'All');
  }, [categories]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-secondary-dark tracking-tight">
            Dynamic Product Management
          </h1>
          <p className="text-sm text-secondary-light mt-1">
            Real-time Firestore catalog administration, pricing, categories, and inventory availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalMode('categories')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-secondary-dark bg-white border border-[#F8B8C8] rounded-xl hover:bg-pink-50 transition cursor-pointer shadow-xs"
          >
            <FiFolder className="w-3.5 h-3.5 text-accent" />
            <span>Manage Categories</span>
          </button>

          <button
            type="button"
            onClick={handleSeedCatalog}
            disabled={submitting}
            title="Seed static catalog into Firestore if empty"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-secondary-dark bg-white border border-[#F8B8C8] rounded-xl hover:bg-pink-50 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <FiDatabase className="w-3.5 h-3.5 text-accent" />
            <span>Sync Firestore Catalog</span>
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-secondary-dark bg-white border border-[#F8B8C8] rounded-xl hover:bg-pink-50 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-accent' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent-dark rounded-xl shadow-md shadow-accent/20 transition cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Global Toast Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm border shadow-xs animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <FiAlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="flex-1 font-medium">{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-sm">
          <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Catalog Error</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="text-xs font-bold underline hover:text-red-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Dynamic Category Filter Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-pink-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by title, category, description..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-pink-50/40 border border-pink-200/60 rounded-xl focus:outline-hidden focus:border-accent focus:bg-white transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-secondary-light">
            <span>Showing:</span>
            <span className="font-bold text-secondary-dark">{filteredProducts.length}</span>
            <span>of</span>
            <span className="font-bold text-secondary-dark">{products.length}</span>
            <span>live products</span>
          </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-pink-50 scrollbar-none">
          <span className="text-xs font-semibold text-secondary-light flex items-center gap-1 shrink-0 mr-1">
            <FiFilter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </span>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer shrink-0 ${
                  active
                    ? 'bg-accent text-white shadow-xs'
                    : 'bg-pink-50/70 text-secondary-light hover:bg-pink-100 hover:text-secondary-dark border border-pink-200/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-pink-50/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center px-4">
            <FiShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-secondary-dark font-heading">
              No products found
            </h3>
            <p className="text-xs text-secondary-light mt-1 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== 'All'
                ? 'No catalog items match your search filters.'
                : 'Your catalog is empty. Click "Add New Product" to populate items.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F7] border-b border-pink-100 text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Price</th>
                  <th className="py-3 px-4 font-semibold">Rating</th>
                  <th className="py-3 px-4 font-semibold">Stock Availability</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((prod) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-pink-50/40 transition-colors group"
                  >
                    {/* Thumbnail & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-11 h-11 rounded-xl object-cover border border-pink-100 shrink-0 bg-[#FAF7F7]"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=200&auto=format&fit=crop';
                          }}
                        />
                        <div className="min-w-0 max-w-xs">
                          <p className="font-bold text-secondary-dark truncate">
                            {prod.name}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            ID: {prod.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold text-secondary-dark bg-pink-50 border border-pink-200/60 rounded-full">
                        {prod.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-bold text-secondary-dark whitespace-nowrap">
                      {formatProductPrice(prod.price)}
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <FiStar className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{prod.rating || 5.0}</span>
                      </div>
                    </td>

                    {/* Stock Availability Toggle Indicator */}
                    <td className="py-3.5 px-4">
                      {prod.available !== false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <FiCheckCircle className="w-3 h-3" />
                          <span>In Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          <FiAlertCircle className="w-3 h-3" />
                          <span>Out of Stock</span>
                        </span>
                      )}
                    </td>

                    {/* Edit & Delete Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(prod)}
                          title="Edit Product"
                          className="p-1.5 text-secondary-light hover:text-accent hover:bg-pink-50 rounded-lg transition cursor-pointer"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(prod)}
                          title="Delete Product"
                          className="p-1.5 text-secondary-light hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Create / Edit Product Modal                                   */}
      {/* ------------------------------------------------------------- */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white w-full max-w-xl rounded-3xl shadow-xl border border-pink-100 flex flex-col max-h-[90vh] overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-6 border-b border-pink-100 flex items-center justify-between bg-[#FAF7F7]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-pink-100 px-2 py-0.5 rounded-full inline-block mb-1">
                  {modalMode === 'create' ? 'New Offering' : 'Modify Item'}
                </span>
                <h3 className="text-xl font-heading font-bold text-secondary-dark">
                  {modalMode === 'create' ? 'Add Catalog Product' : `Edit: ${targetProduct?.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl text-gray-400 hover:text-secondary-dark hover:bg-pink-50 transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block font-bold text-secondary-dark mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Personalized Wooden Engraved Watch"
                  className="w-full px-3.5 py-2.5 bg-pink-50/40 border border-pink-200/80 rounded-xl focus:outline-hidden focus:border-accent focus:bg-white transition text-xs"
                />
              </div>

              {/* Category & Price Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-secondary-dark">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalMode('categories')}
                      className="text-[10px] font-semibold text-accent hover:underline cursor-pointer"
                    >
                      + New Category
                    </button>
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-pink-50/40 border border-pink-200/80 rounded-xl focus:outline-hidden focus:border-accent focus:bg-white transition text-xs cursor-pointer"
                  >
                    {selectCategoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-secondary-dark mb-1">
                    Price (INR ₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 150"
                    className="w-full px-3.5 py-2.5 bg-pink-50/40 border border-pink-200/80 rounded-xl focus:outline-hidden focus:border-accent focus:bg-white transition text-xs"
                  />
                </div>
              </div>

              {/* Rating & Availability Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-secondary-dark mb-1">
                    Rating (1.0 - 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-pink-50/40 border border-pink-200/80 rounded-xl focus:outline-hidden focus:border-accent focus:bg-white transition text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-secondary-dark mb-1">
                    Stock Availability
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.available}
                        onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                        className="rounded text-accent focus:ring-accent w-4 h-4 border-pink-300 cursor-pointer"
                      />
                      <span className={`font-semibold ${formData.available ? 'text-emerald-700' : 'text-red-600'}`}>
                        {formData.available ? 'In Stock (Available for Purchase)' : 'Out of Stock (Disabled in Shop)'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Product Image Input & Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-bold text-secondary-dark">
                    Product Image *
                  </label>
                  <div className="flex items-center gap-1 p-0.5 bg-pink-50/70 border border-pink-200/60 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                        imageInputMode === 'url' ? 'bg-white text-accent shadow-2xs' : 'text-gray-500'
                      }`}
                    >
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                        imageInputMode === 'upload' ? 'bg-white text-accent shadow-2xs' : 'text-gray-500'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                {imageInputMode === 'url' ? (
                  <input
                    type="url"
                    value={formData.image}
                    onChange={handleImageUrlChange}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 bg-pink-50/40 border border-pink-200/80 rounded-xl focus:outline-hidden focus:border-accent focus:bg-white transition text-xs"
                  />
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 px-4 border-2 border-dashed border-[#F8B8C8] hover:border-accent rounded-2xl bg-pink-50/30 flex items-center justify-center gap-2 text-secondary-dark transition cursor-pointer"
                    >
                      <FiUpload className="w-4 h-4 text-accent" />
                      <span className="font-semibold">Select image file from computer (max 5MB)</span>
                    </button>
                  </div>
                )}

                {/* Instant Image Preview */}
                {imagePreview && (
                  <div className="mt-3 flex items-center gap-3 p-2 bg-[#FAF7F7] border border-pink-100 rounded-2xl">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-pink-200 shrink-0"
                      onError={() => setImagePreview('')}
                    />
                    <div className="flex-1 min-w-0 text-[11px]">
                      <p className="font-bold text-secondary-dark">Image Preview</p>
                      <p className="text-gray-400 truncate">
                        {formData.image.startsWith('data:') ? 'Local file processed' : formData.image}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setFormData((prev) => ({ ...prev, image: '' }));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      title="Remove image"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-secondary-dark mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this luxurious gift, personalization options, and craftsmanship..."
                  className="w-full px-3.5 py-2.5 bg-pink-50/40 border border-pink-200/80 rounded-xl focus:outline-hidden focus:border-accent focus:bg-white transition text-xs"
                />
              </div>

              {/* Key Features */}
              <div>
                <label className="block font-bold text-secondary-dark mb-1">
                  Features (One per line)
                </label>
                <textarea
                  rows="3"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Custom Name Engraving&#10;Premium Gift Packaging&#10;Includes Keepsake Card"
                  className="w-full px-3.5 py-2.5 bg-pink-50/40 border border-pink-200/80 rounded-xl focus:outline-hidden focus:border-accent focus:bg-white transition text-xs font-mono"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-pink-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-secondary-dark bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent-dark rounded-xl shadow-md shadow-accent/20 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving to Firestore...' : modalMode === 'create' ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Category Management Modal                                     */}
      {/* ------------------------------------------------------------- */}
      {modalMode === 'categories' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-pink-100 flex flex-col max-h-[85vh] overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-6 border-b border-pink-100 flex items-center justify-between bg-[#FAF7F7]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-pink-100 px-2 py-0.5 rounded-full inline-block mb-1">
                  Taxonomy
                </span>
                <h3 className="text-xl font-heading font-bold text-secondary-dark">
                  Manage Product Categories
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl text-gray-400 hover:text-secondary-dark hover:bg-pink-50 transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Add New Category Input */}
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name (e.g. Wedding Favors)..."
                  className="flex-1 px-3.5 py-2.5 bg-pink-50/40 border border-pink-200/80 rounded-xl focus:outline-hidden focus:border-accent focus:bg-white transition text-xs"
                />
                <button
                  type="submit"
                  disabled={categorySubmitting || !newCategoryName.trim()}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-accent hover:bg-accent-dark rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {categorySubmitting ? 'Adding...' : 'Add'}
                </button>
              </form>

              {/* Active Categories List */}
              <div>
                <h4 className="font-heading font-bold text-sm text-secondary-dark mb-3">
                  Active Categories ({selectCategoriesList.length})
                </h4>

                <div className="divide-y divide-gray-100 border border-pink-100 rounded-2xl overflow-hidden bg-white">
                  {selectCategoriesList.map((cat) => {
                    const count = categoryUsageCount[cat] || 0;
                    return (
                      <div
                        key={cat}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-pink-50/30 transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FiFolder className="w-4 h-4 text-accent shrink-0" />
                          <span className="font-semibold text-secondary-dark truncate">{cat}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            ({count} product{count === 1 ? '' : 's'})
                          </span>
                        </div>

                        {count > 0 ? (
                          <span
                            title={`Cannot delete: Assigned to ${count} product(s)`}
                            className="text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full"
                          >
                            In Use
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            disabled={categorySubmitting}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete unused category"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-pink-100 bg-[#FAF7F7] flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent-dark rounded-xl transition cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Delete Confirmation Modal                                     */}
      {/* ------------------------------------------------------------- */}
      {modalMode === 'delete' && targetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-pink-100 p-6 space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto">
              <FiTrash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-heading font-bold text-secondary-dark">
                Delete Catalog Item
              </h3>
              <p className="text-xs text-secondary-light">
                Are you sure you want to remove <span className="font-bold text-secondary-dark">"{targetProduct.name}"</span>?
                This action will delete the item from Cloud Firestore and remove it from the customer storefront immediately.
              </p>

              {/* Product mini card preview */}
              <div className="p-3 bg-pink-50/40 border border-pink-100 rounded-2xl flex items-center gap-3 text-left">
                <img
                  src={targetProduct.image}
                  alt={targetProduct.name}
                  className="w-12 h-12 rounded-xl object-cover border border-pink-100 shrink-0"
                />
                <div className="min-w-0 text-xs">
                  <p className="font-bold text-secondary-dark truncate">{targetProduct.name}</p>
                  <p className="text-[11px] text-gray-500">{formatProductPrice(targetProduct.price)} &bull; {targetProduct.category}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-secondary-dark bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
