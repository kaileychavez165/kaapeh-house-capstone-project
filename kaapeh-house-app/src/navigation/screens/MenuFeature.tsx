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
    if (isNaN(priceValue) || priceValue <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return;
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

      // Call onSave with updated item
      onSave({
        ...item,
        name: editedName.trim(),
        description: editedDescription,
        price: priceValue,
        available: editedStatus === 'Available',
        image_url: imageUrl,
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
          disabled={uploading}
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
  const [uploading, setUploading] = React.useState(false);

  // Filter out "All Items" from categories for selection
  const selectableCategories = categories.filter(cat => cat !== 'All Items');

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
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter an item name.');
      return;
    }
    if (!price.trim()) {
      Alert.alert('Validation Error', 'Please enter a price.');
      return;
    }
    if (!category) {
      Alert.alert('Validation Error', 'Please select a category.');
      return;
    }

    try {
      setUploading(true);
      let finalImageUrl = '☕';

      // Upload image if one was selected (and it's a local file)
      if (selectedImageUri && (selectedImageUri.startsWith('file://') || selectedImageUri.startsWith('ph://') || selectedImageUri.startsWith('assets-library://'))) {
        try {
          finalImageUrl = await uploadMenuImage(selectedImageUri, name.trim());
        } catch (error) {
          Alert.alert('Upload Error', 'Failed to upload image. Using default emoji.');
          console.error('Image upload error:', error);
        }
      } else if (selectedImageUri) {
        // If it's already a URL, use it directly
        finalImageUrl = selectedImageUri;
      }

      onSave({
        name: name.trim(),
        description: description.trim(),
        category,
        price: price.trim(),
        status,
        image: finalImageUrl,
      });
      
      // Reset form
      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setStatus('Available');
      setSelectedImageUri(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to save item. Please try again.');
      console.error('Save error:', error);
    } finally {
      setUploading(false);
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
        placeholder="Price *"
        placeholderTextColor="#9CA3AF"
        keyboardType="default"
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
              onPress={() => setCategory(cat)}
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

      {/* Image Picker */}
      <View style={styles.imagePickerContainer}>
        {selectedImageUri && (
          <Image
            source={{ uri: selectedImageUri }}
            style={styles.previewImage}
          />
        )}
        <TouchableOpacity
          style={styles.imagePickerButton}
          onPress={handlePickImage}
        >
          <Text style={styles.imagePickerButtonText}>
            {selectedImageUri ? 'Change Image' : 'Select Image'}
          </Text>
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
          style={[styles.saveButton, uploading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Add Item</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isSaving || isUploading}
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
});

