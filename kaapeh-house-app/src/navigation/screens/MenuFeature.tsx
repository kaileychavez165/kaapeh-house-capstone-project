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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: string;
  status: 'Available' | 'Unavailable';
  image: string;
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
  const [editedPrice, setEditedPrice] = React.useState(item.price);
  const [editedStatus, setEditedStatus] = React.useState(item.status);
  const [editedImage, setEditedImage] = React.useState(item.image);
  const [selectedImageUri, setSelectedImageUri] = React.useState<string | null>(null);

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

  const handleSave = () => {
    onSave({
      ...item,
      name: editedName,
      price: editedPrice,
      status: editedStatus,
      image: selectedImageUri || editedImage,
    });
  };

  return (
    <View style={styles.editMode}>
      <TextInput
        style={styles.editInput}
        value={editedName}
        onChangeText={setEditedName}
        placeholder="Item name"
      />
      <TextInput
        style={styles.editInput}
        value={editedPrice}
        onChangeText={setEditedPrice}
        placeholder="Price"
        keyboardType="default"
      />

      {/* Image Picker */}
      <View style={styles.imagePickerContainer}>
        {(selectedImageUri || editedImage) && (
          <Image
            source={{ uri: selectedImageUri || editedImage }}
            style={styles.previewImage}
          />
        )}
        <TouchableOpacity
          style={styles.imagePickerButton}
          onPress={handlePickImage}
        >
          <Text style={styles.imagePickerButtonText}>
            {selectedImageUri || editedImage ? 'Change Image' : 'Select Image'}
          </Text>
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
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
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
  editInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
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
});

