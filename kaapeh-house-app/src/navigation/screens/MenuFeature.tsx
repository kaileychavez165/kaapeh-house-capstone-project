import React from 'react'; 
import {
  View, 
  Text,
  StyleSheet,
  TextInput,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToStorage } from '../../services/menuService';

// Display interface for Menu screen (extends DB MenuItem with display properties)
export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  image_url: string;
  description?: string;
  served_hot?: boolean;
  served_cold?: boolean;
  allow_customizations?: string[];
  sizes?: Record<string, number>; // size -> price mapping
  sub_category?: 'Milk' | 'Syrup' | 'Flavor' | 'Extras';
}

interface DeleteModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Delete Item</Text>
          <Text style={styles.modalMessage}>
            Are you sure you want to delete this item?
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.noButton}
              onPress={onCancel}
            >
              <Text style={styles.noButtonText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.yesButton}
              onPress={onConfirm}
            >
              <Text style={styles.yesButtonText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface EditModeProps {
  item: MenuItem;
  onSave: (updatedItem: MenuItem) => void;
  onCancel: () => void;
}

export const EditMode: React.FC<EditModeProps> = ({ item, onSave, onCancel }) => {
  const [editedName, setEditedName] = React.useState(item.name);
  const [editedDescription, setEditedDescription] = React.useState(item.description || '');
  const [editedPrice, setEditedPrice] = React.useState(item.price.toString());
  const [editedStatus, setEditedStatus] = React.useState(item.available ? 'Available' : 'Unavailable');
  const [selectedImageUri, setSelectedImageUri] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Size prices for drink categories
  const [editedSizes, setEditedSizes] = React.useState<Record<string, string>>(() => {
    // Initialize with existing sizes, converting numbers to strings for input
    if (item.sizes) {
      const sizesObj: Record<string, string> = {};
      for (const [size, price] of Object.entries(item.sizes)) {
        sizesObj[size] = price.toString();
      }
      return sizesObj;
    }
    return {};
  });

  // Check if this is a drink category
  const drinkCategories = ['Coffee', 'Tea & Other Drinks', 'Seasonal Items'];
  const isDrinkCategory = drinkCategories.includes(item.category);
  const sizeOptions = ['2 oz', '6 oz', '12 oz', '16 oz', '20 oz'];

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (!editedName.trim()) {
      Alert.alert('Validation Error', 'Item name is required');
      return;
    }

    const priceValue = parseFloat(editedPrice.replace('$', '').trim());
    // Allow $0 price for Customizations category items, otherwise require > 0
    const isCustomizationsCategory = item.category === 'Customizations';
    if (isNaN(priceValue) || (!isCustomizationsCategory && priceValue <= 0) || (isCustomizationsCategory && priceValue < 0)) {
      Alert.alert('Validation Error', isCustomizationsCategory 
        ? 'Please enter a valid price (can be $0 for Customizations items)' 
        : 'Please enter a valid price');
      return;
    }

    // Validate size prices for drink categories
    if (isDrinkCategory && item.sizes && Object.keys(item.sizes).length > 0) {
      // Validate all size prices are valid numbers
      for (const [size, priceStr] of Object.entries(editedSizes)) {
        const sizePrice = parseFloat(priceStr.replace('$', '').trim());
        if (!priceStr || isNaN(sizePrice) || sizePrice <= 0) {
          Alert.alert('Validation Error', `Please enter a valid price for ${size}`);
          return;
        }
      }

      // Find the smallest size and validate its price matches base price
      const sizeOrder = ['2 oz', '6 oz', '12 oz', '16 oz', '20 oz'];
      const existingSizes = Object.keys(editedSizes);
      if (existingSizes.length > 0) {
        let smallestSize: string | null = null;
        for (const size of sizeOrder) {
          if (existingSizes.includes(size)) {
            smallestSize = size;
            break;
          }
        }

        if (smallestSize) {
          const smallestSizePrice = parseFloat(editedSizes[smallestSize].replace('$', '').trim());
          if (Math.abs(smallestSizePrice - priceValue) > 0.01) {
            Alert.alert('Validation Error', `The price for ${smallestSize} (${smallestSizePrice.toFixed(2)}) must equal the base price (${priceValue.toFixed(2)})`);
            return;
          }
        }
      }
    }

    setIsSaving(true);

    try {
      let imageUrl = item.image_url;

      // Upload image if a new one was selected
      if (selectedImageUri) {
        setIsUploading(true);
        try {
          // Generate a unique filename
          const fileName = `${item.id}-${Date.now()}.jpg`;
          imageUrl = await uploadImageToStorage(selectedImageUri, fileName);
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
          setIsUploading(false);
          setIsSaving(false);
          return;
        }
        setIsUploading(false);
      }

      // Convert edited sizes to number object if drink category
      let sizesObject: Record<string, number> | undefined = undefined;
      if (isDrinkCategory && Object.keys(editedSizes).length > 0) {
        sizesObject = {};
        for (const [size, priceStr] of Object.entries(editedSizes)) {
          const sizePrice = parseFloat(priceStr.replace('$', '').trim());
          if (!isNaN(sizePrice) && sizePrice > 0) {
            sizesObject[size] = sizePrice;
          }
        }
      }

      // Call onSave with updated item
      onSave({
        ...item,
        name: editedName.trim(),
        description: editedDescription,
        price: priceValue,
        available: editedStatus === 'Available',
        image_url: imageUrl,
        sizes: sizesObject,
      });
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Save Error', 'Failed to save item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.editMode}>
      <TextInput
        style={styles.editInput}
        value={editedName}
        onChangeText={setEditedName}
        placeholder="Item name"
        placeholderTextColor="#9CA3AF"
      />
      <TextInput
        style={[styles.editInput, styles.descriptionInput]}
        value={editedDescription}
        onChangeText={setEditedDescription}
        placeholder="Description"
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      <TextInput
        style={styles.editInput}
        value={editedPrice}
        onChangeText={setEditedPrice}
        placeholder="Price (e.g., 5.50)"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />

      {/* Size Prices Editor - Only for drink categories with sizes */}
      {isDrinkCategory && item.sizes && Object.keys(item.sizes).length > 0 && (
        <View style={styles.sizesContainer}>
          <Text style={styles.multiselectLabel}>Size Prices</Text>
          <Text style={styles.sizePriceHint}>Note: The smallest size price must match the base price above.</Text>
          <View style={styles.sizesGrid}>
            {Object.keys(item.sizes).sort((a, b) => {
              const order = ['2 oz', '6 oz', '12 oz', '16 oz', '20 oz'];
              return order.indexOf(a) - order.indexOf(b);
            }).map((size) => (
              <View key={size} style={styles.sizePriceRow}>
                <Text style={styles.sizeLabel}>{size}:</Text>
                <TextInput
                  style={styles.sizePriceInput}
                  value={editedSizes[size] || ''}
                  onChangeText={(text) => {
                    setEditedSizes(prev => ({
                      ...prev,
                      [size]: text,
                    }));
                  }}
                  placeholder="Price"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Image Picker */}
      <View style={styles.imagePickerContainer}>
        {(selectedImageUri || item.image_url) && (
          <Image
            source={{ uri: selectedImageUri || item.image_url }}
            style={styles.previewImage}
          />
        )}
        <TouchableOpacity
          style={[styles.imagePickerButton, isUploading && styles.disabledButton]}
          onPress={handlePickImage}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.imagePickerButtonText}>
              {selectedImageUri || item.image_url ? 'Change Image' : 'Select Image'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Status Toggle */}
      <View style={styles.statusToggleContainer}>
        <TouchableOpacity
          style={[
            styles.statusToggle,
            editedStatus === 'Available' && styles.statusToggleActive,
          ]}
          onPress={() => setEditedStatus('Available')}
        >
          <Text
            style={[
              styles.statusToggleText,
              editedStatus === 'Available' && styles.statusToggleTextActive,
            ]}
          >
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusToggle,
            editedStatus === 'Unavailable' && styles.statusToggleActive,
          ]}
          onPress={() => setEditedStatus('Unavailable')}
        >
          <Text
            style={[
              styles.statusToggleText,
              editedStatus === 'Unavailable' && styles.statusToggleTextActive,
            ]}
          >
            Unavailable
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.editActions}>
        <TouchableOpacity
          style={[styles.saveButton, (isSaving || isUploading) && styles.disabledButton]}
          onPress={handleSave}
          disabled={isSaving || isUploading}
        >
          {isSaving || isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, (isSaving || isUploading) && styles.disabledButton]}
          onPress={onCancel}
          disabled={isUploading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface AddItemModeProps {
  categories: string[];
  onSave: (newItem: Omit<MenuItem, 'id'>) => void;
  onCancel: () => void;
}

export const AddItemMode: React.FC<AddItemModeProps> = ({ categories, onSave, onCancel }) => {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [category, setCategory] = React.useState<string>('');
  const [status, setStatus] = React.useState<'Available' | 'Unavailable'>('Available');
  const [selectedImageUri, setSelectedImageUri] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const [servedHot, setServedHot] = React.useState(false);
  const [servedCold, setServedCold] = React.useState(false);
  const [allowCustomizations, setAllowCustomizations] = React.useState<string[]>([]);
  const [sizes, setSizes] = React.useState<Record<string, string>>({}); // size -> price string
  const [subCategory, setSubCategory] = React.useState<'Milk' | 'Syrup' | 'Flavor' | 'Extras' | ''>('');

  // Filter out "All Items" from categories for selection
  const selectableCategories = categories.filter(cat => cat !== 'All Items');
  
  // Categories that should show serving options, sizes, and customizations
  const drinkCategories = ['Coffee', 'Tea & Other Drinks', 'Seasonal Items'];
  const showDrinkOptions = category && drinkCategories.includes(category);
  
  // Available options
  const customizationOptions = ['Milk', 'Syrup', 'Flavor', 'Extras'];
  const sizeOptions = ['2 oz', '6 oz', '12 oz', '16 oz', '20 oz'];
  const subCategoryOptions: ('Milk' | 'Syrup' | 'Flavor' | 'Extras')[] = ['Milk', 'Syrup', 'Flavor', 'Extras'];

  // Used for multiselect
  const toggleCustomization = (option: string) => {
    setAllowCustomizations(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const toggleSize = (option: string) => {
    setSizes(prev => {
      // Check if size exists (even if price is empty string)
      if (prev.hasOwnProperty(option)) {
        // Remove size if it exists
        const newSizes = { ...prev };
        delete newSizes[option];
        return newSizes;
      } else {
        // Add size with empty price
        return { ...prev, [option]: '' };
      }
    });
  };

  const updateSizePrice = (size: string, priceStr: string) => {
    setSizes(prev => ({
      ...prev,
      [size]: priceStr,
    }));
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Item name is required');
      return;
    }

    if (!category) {
      Alert.alert('Validation Error', 'Please select a category.');
      return;
    }

    const priceValue = parseFloat(price.replace('$', '').trim());
    // Allow $0 price for Customizations category items, otherwise require > 0
    const isCustomizationsCategory = category === 'Customizations';
    if (isNaN(priceValue) || (!isCustomizationsCategory && priceValue <= 0) || (isCustomizationsCategory && priceValue < 0)) {
      Alert.alert('Validation Error', isCustomizationsCategory 
        ? 'Please enter a valid price (can be $0 for Customizations items)' 
        : 'Please enter a valid price');
      return;
    }

    // Validate drink category requirements
    if (showDrinkOptions) {
      if (!servedHot && !servedCold) {
        Alert.alert('Validation Error', 'Please select at least one serving option (Served Hot or Served Cold)');
        return;
      }

      const selectedSizes = Object.keys(sizes);
      if (selectedSizes.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one available size');
        return;
      }

      for (const size of selectedSizes) {
        const sizePriceStr = sizes[size]?.trim() || '';
        const sizePrice = parseFloat(sizePriceStr.replace('$', '').trim());
        if (!sizePriceStr || isNaN(sizePrice) || sizePrice <= 0) {
          Alert.alert('Validation Error', `Please enter a valid price for ${size}`);
          return;
        }
      }

      if (selectedSizes.length > 0) {
        const sizeOrder = ['2 oz', '6 oz', '12 oz', '16 oz', '20 oz'];

        let smallestSize: string | null = null;
        for (const size of sizeOrder) {
          if (selectedSizes.includes(size)) {
            smallestSize = size;
            break;
          }
        }

        if (smallestSize) {
          const smallestSizePriceStr = sizes[smallestSize]?.trim() || '';
          const smallestSizePrice = parseFloat(smallestSizePriceStr.replace('$', '').trim());
          if (Math.abs(smallestSizePrice - priceValue) > 0.01) { // Allow small floating point differences
            Alert.alert('Validation Error', `The price for ${smallestSize} (${smallestSizePrice.toFixed(2)}) must equal the base price (${priceValue.toFixed(2)})`);
            return;
          }
        }
      }

      // Must have at least one customization selected
      if (allowCustomizations.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one allowed customization');
        return;
      }
    }

    // Validate Customizations category requirement
    if (isCustomizationsCategory && !subCategory) {
      Alert.alert('Validation Error', 'Please select a sub category for Customizations items');
      return;
    }

    setIsSaving(true);

    try {
      let imageUrl = '';

      // Upload image if one was selected
      if (selectedImageUri) {
        setIsUploading(true);
        try {
          // Generate a unique filename
          const fileName = `${name.trim().replace(/\s+/g, '-')}-${Date.now()}.jpg`;
          imageUrl = await uploadImageToStorage(selectedImageUri, fileName);
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
          setIsUploading(false);
          setIsSaving(false);
          return;
        }
        setIsUploading(false);
      }

      // Convert sizes object to size-price pairs (size -> number)
      let sizesObject: Record<string, number> | undefined = undefined;
      if (showDrinkOptions && Object.keys(sizes).length > 0) {
        sizesObject = {};
        for (const size of Object.keys(sizes)) {
          const priceStr = sizes[size]?.trim() || '';
          const sizePrice = parseFloat(priceStr.replace('$', '').trim());
          if (!isNaN(sizePrice) && sizePrice > 0) {
            sizesObject[size] = sizePrice;
          }
        }
      }

      // Call onSave with new item data
      onSave({
        name: name.trim(),
        description: description.trim(),
        category,
        price: priceValue,
        available: status === 'Available',
        image_url: imageUrl,
        // For drink categories, these are required and validated above
        served_hot: showDrinkOptions ? servedHot : undefined,
        served_cold: showDrinkOptions ? servedCold : undefined,
        allow_customizations: showDrinkOptions && allowCustomizations.length > 0 ? allowCustomizations : undefined,
        sizes: sizesObject,
        // For Customizations category, sub_category is required and validated above
        sub_category: isCustomizationsCategory && subCategory ? subCategory : undefined,
      });
      
      // Reset form
      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setStatus('Available');
      setSelectedImageUri(null);
      setServedHot(false);
      setServedCold(false);
      setAllowCustomizations([]);
      setSizes({});
      setSubCategory('');
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Save Error', 'Failed to save item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.editMode}>
      <Text style={styles.addItemTitle}>Add New Menu Item</Text>
      
      <TextInput
        style={styles.editInput}
        value={name}
        onChangeText={setName}
        placeholder="Item name *"
        placeholderTextColor="#9CA3AF"
      />
      
      <TextInput
        style={[styles.editInput, styles.descriptionInput]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TextInput
        style={styles.editInput}
        value={price}
        onChangeText={setPrice}
        placeholder="Price (e.g., 5.50)"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />

      {/* Category Selector */}
      <View style={styles.categorySelectorContainer}>
        <Text style={styles.categorySelectorLabel}>Category *</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categorySelectorScroll}
          contentContainerStyle={styles.categorySelectorContent}
        >
          {selectableCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryOption,
                category === cat && styles.categoryOptionSelected,
              ]}
              onPress={() => {
                setCategory(cat);
                // Reset sub_category if category is not Customizations
                if (cat !== 'Customizations') {
                  setSubCategory('');
                }
                // Reset drink-specific fields if switching to non-drink category
                if (!drinkCategories.includes(cat)) {
                  setServedHot(false);
                  setServedCold(false);
                  setAllowCustomizations([]);
                  setSizes({});
                }
              }}
            >
              <Text
                style={[
                  styles.categoryOptionText,
                  category === cat && styles.categoryOptionTextSelected,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sub Category Selector (only for Customizations category) */}
      {category === 'Customizations' && (
        <View style={styles.categorySelectorContainer}>
          <Text style={styles.categorySelectorLabel}>Sub Category</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categorySelectorScroll}
            contentContainerStyle={styles.categorySelectorContent}
          >
            {subCategoryOptions.map((subCat) => (
              <TouchableOpacity
                key={subCat}
                style={[
                  styles.categoryOption,
                  subCategory === subCat && styles.categoryOptionSelected,
                ]}
                onPress={() => setSubCategory(subCat)}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    subCategory === subCat && styles.categoryOptionTextSelected,
                  ]}
                >
                  {subCat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Served Hot/Cold Toggles - Only for drink categories */}
      {showDrinkOptions && (
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Serving Options</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                servedHot && styles.toggleButtonActive,
              ]}
              onPress={() => setServedHot(!servedHot)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  servedHot && styles.toggleButtonTextActive,
                ]}
              >
                Served Hot
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                servedCold && styles.toggleButtonActive,
              ]}
              onPress={() => setServedCold(!servedCold)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  servedCold && styles.toggleButtonTextActive,
                ]}
              >
                Served Cold
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sizes Multiselect with Price Inputs - Only for drink categories */}
      {showDrinkOptions && (
        <View style={styles.sizesContainer}>
          <Text style={styles.multiselectLabel}>Available Sizes & Prices</Text>
          <View style={styles.sizesGrid}>
            {sizeOptions.map((size) => {
              const isSelected = sizes[size] !== undefined;
              return (
                <View key={size} style={styles.sizePriceRow}>
                  <TouchableOpacity
                    style={[
                      styles.multiselectOption,
                      isSelected && styles.multiselectOptionSelected,
                    ]}
                    onPress={() => toggleSize(size)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.multiselectOptionText,
                        isSelected && styles.multiselectOptionTextSelected,
                      ]}
                    >
                      {size} {isSelected && '✓'}
                    </Text>
                  </TouchableOpacity>
                  {isSelected && (
                    <TextInput
                      style={styles.sizePriceInput}
                      value={sizes[size] || ''}
                      onChangeText={(text) => updateSizePrice(size, text)}
                      placeholder="Price"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      onFocus={() => {
                        // Prevent accidental deselection when focusing input
                      }}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Allow Customizations Multiselect - Only for drink categories */}
      {showDrinkOptions && (
        <View style={styles.multiselectContainer}>
          <Text style={styles.multiselectLabel}>Allowed Customizations</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.multiselectScroll}
            contentContainerStyle={styles.multiselectContent}
          >
            {customizationOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.multiselectOption,
                  allowCustomizations.includes(option) && styles.multiselectOptionSelected,
                ]}
                onPress={() => toggleCustomization(option)}
              >
                <Text
                  style={[
                    styles.multiselectOptionText,
                    allowCustomizations.includes(option) && styles.multiselectOptionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Image Picker */}
      <View style={styles.imagePickerContainer}>
        {selectedImageUri && (
          <Image
            source={{ uri: selectedImageUri }}
            style={styles.previewImage}
          />
        )}
        <TouchableOpacity
          style={[styles.imagePickerButton, isUploading && styles.disabledButton]}
          onPress={handlePickImage}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.imagePickerButtonText}>
              {selectedImageUri ? 'Change Image' : 'Select Image'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Status Toggle */}
      <View style={styles.statusToggleContainer}>
        <TouchableOpacity
          style={[
            styles.statusToggle,
            status === 'Available' && styles.statusToggleActive,
          ]}
          onPress={() => setStatus('Available')}
        >
          <Text
            style={[
              styles.statusToggleText,
              status === 'Available' && styles.statusToggleTextActive,
            ]}
          >
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusToggle,
            status === 'Unavailable' && styles.statusToggleActive,
          ]}
          onPress={() => setStatus('Unavailable')}
        >
          <Text
            style={[
              styles.statusToggleText,
              status === 'Unavailable' && styles.statusToggleTextActive,
            ]}
          >
            Unavailable
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.editActions}>
        <TouchableOpacity
          style={[styles.saveButton, (isSaving || isUploading) && styles.disabledButton]}
          onPress={handleSave}
          disabled={isSaving || isUploading}
        >
          {isSaving || isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Add Item</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, (isSaving || isUploading) && styles.disabledButton]}
          onPress={onCancel}
          disabled={isUploading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  editMode: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#20B2AA',
  },
  addItemTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#20B2AA',
    marginBottom: 16,
    textAlign: 'center',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  descriptionInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  categorySelectorContainer: {
    marginBottom: 12,
  },
  categorySelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  categorySelectorScroll: {
    maxHeight: 50,
  },
  categorySelectorContent: {
    paddingRight: 10,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  categoryOptionSelected: {
    backgroundColor: '#20B2AA',
    borderColor: '#20B2AA',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusToggleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statusToggle: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  statusToggleActive: {
    backgroundColor: '#20B2AA',
    borderColor: '#20B2AA',
  },
  statusToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusToggleTextActive: {
    color: '#FFFFFF',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#20B2AA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  yesButton: {
    flex: 1,
    backgroundColor: '#20B2AA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  yesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  noButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  noButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  imagePickerContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  imagePickerButton: {
    backgroundColor: '#20B2AA',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  imagePickerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  toggleContainer: {
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#20B2AA',
    borderColor: '#20B2AA',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  multiselectContainer: {
    marginBottom: 12,
  },
  multiselectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  multiselectScroll: {
    maxHeight: 50,
  },
  multiselectContent: {
    paddingRight: 10,
  },
  multiselectOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  multiselectOptionSelected: {
    backgroundColor: '#20B2AA',
    borderColor: '#20B2AA',
  },
  multiselectOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  multiselectOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sizesContainer: {
    marginBottom: 12,
  },
  sizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sizePriceInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
    minWidth: 80,
    maxWidth: 100,
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 60,
  },
  sizePriceHint: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
});

