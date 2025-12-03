import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  generateTimeSlotsForToday,
  generateTimeSlotsFromMinTime,
  formatTime,
  formatDateDisplay,
  parseCustomTime,
  validateCustomTime,
  isWithinBusinessHours,
  isOutsideBusinessHours,
  TEST_CURRENT_TIME,
} from '../utils/pickupTimeUtils';

interface PickupTimeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (time: Date) => void;
  initialTime?: Date | null;
  minTime?: Date; // For editing existing orders - minimum allowed time
}

export default function PickupTimeModal({
  visible,
  onClose,
  onSelectTime,
  initialTime,
  minTime,
}: PickupTimeModalProps) {
  // Use test time if set, otherwise use actual current time
  const today = TEST_CURRENT_TIME || new Date();
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [timeSlots, setTimeSlots] = useState<Date[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [modalBodyHeight, setModalBodyHeight] = useState<number | null>(null);
  
  // Calculate modal body height dynamically
  const screenHeight = Dimensions.get('window').height;
  const calculatedBodyHeight = Math.min(400, screenHeight * 0.5);

  useEffect(() => {
    if (visible) {
      console.log('PickupTimeModal: Modal opened, visible=', visible);
      
      // Check if business is closed
      if (!minTime) {
        const closed = isOutsideBusinessHours();
        setIsClosed(closed);
        
        if (closed) {
          console.log('PickupTimeModal: Business is closed');
          setTimeSlots([]);
          setSelectedTime(null);
          setCustomTimeInput('');
          setShowCustomInput(false);
          return;
        }
      }

      // Generate time slots
      if (minTime) {
        // For editing: generate slots from minimum time
        const slots = generateTimeSlotsFromMinTime(minTime);
        console.log('PickupTimeModal: Generated time slots (editing):', slots.length, slots.map(s => formatTime(s)));
        setTimeSlots(slots);
        setIsClosed(false);
        // Set first slot as default if no initial time
        if (!initialTime && slots.length > 0) {
          setSelectedTime(slots[0]);
        }
      } else {
        // For new orders: generate slots for today
        const slots = generateTimeSlotsForToday();
        console.log('PickupTimeModal: Generated time slots (new order):', slots.length, slots.map(s => formatTime(s)));
        setTimeSlots(slots);
        setIsClosed(slots.length === 0);
        // Set first slot as default if no initial time
        if (!initialTime && slots.length > 0) {
          setSelectedTime(slots[0]);
        }
      }

      // Set initial time if provided
      if (initialTime) {
        setSelectedTime(initialTime);
        setCustomTimeInput(formatTime(initialTime));
      } else {
        setCustomTimeInput('');
      }
      setShowCustomInput(false);
    } else {
      // Reset state when modal closes
      console.log('PickupTimeModal: Modal closed');
    }
  }, [visible, minTime, initialTime]);

  const handleTimeSlotSelect = (time: Date) => {
    setSelectedTime(time);
    setShowCustomInput(false);
    setCustomTimeInput('');
  };

  const handleCustomTimeChange = (text: string) => {
    setCustomTimeInput(text);
    
    if (!text.trim()) {
      setSelectedTime(null);
      return;
    }

    const parsed = parseCustomTime(text, today);
    if (parsed) {
      const firstSlot = timeSlots.length > 0 ? timeSlots[0] : new Date();
      const validation = validateCustomTime(parsed, firstSlot, today, minTime);
      
      if (validation.valid) {
        setSelectedTime(parsed);
      } else {
        // Don't set selected time if invalid, but keep the input
        setSelectedTime(null);
      }
    } else {
      setSelectedTime(null);
    }
  };

  const handleSchedule = () => {
    if (isClosed) {
      Alert.alert('Business closed', 'Please come back during business hours to place your order.');
      return;
    }

    if (!selectedTime) {
      Alert.alert('Please select a time', 'You must select a valid pickup time within business hours and no earlier than the first available time slot before continuing.');
      return;
    }

    // Final validation
    const firstSlot = timeSlots.length > 0 ? timeSlots[0] : new Date();
    const validation = validateCustomTime(selectedTime, firstSlot, today, minTime);
    
    if (!validation.valid) {
      Alert.alert('Invalid time', validation.error || 'Please select a valid pickup time.');
      return;
    }

    onSelectTime(selectedTime);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View 
          style={styles.modalContent}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            console.log('PickupTimeModal: modalContent dimensions =', { width, height });
          }}
        >
          {/* Header - Fixed */}
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>PICKUP TIME</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#2B2B2B" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content Body */}
          <View 
            style={[styles.modalBody, { height: calculatedBodyHeight }]}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              console.log('PickupTimeModal: modalBody height =', height, 'calculated =', calculatedBodyHeight);
              setModalBodyHeight(height);
            }}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                console.log('PickupTimeModal: ScrollView height =', height);
              }}
            >
                {/* Day Selection - Only Today */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>SELECT DAY</Text>
                  <View style={styles.dayContainer}>
                    <View style={[styles.dayButton, styles.selectedDayButton]}>
                      <Text style={styles.selectedDayText}>{formatDateDisplay(today)}</Text>
                    </View>
                  </View>
                </View>

                {/* Time Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>SELECT TIME</Text>
                  {isClosed ? (
                    <View style={styles.closedContainer}>
                      <Text style={styles.closedHeader}>Outside of business hours ☕</Text>
                      <Text style={styles.closedMessage}>Check back during business hours to place your order.</Text>
                    </View>
                  ) : timeSlots.length === 0 ? (
                    <View style={styles.closedContainer}>
                      <Text style={styles.closedHeader}>No more available time slots 😢</Text>
                      <Text style={styles.closedMessage}>Business will be closed soon.</Text>
                    </View>
                  ) : (
                    <View>
                      {/* Time slots */}
                      {timeSlots.map((slot, index) => {
                        const isSelected = selectedTime && selectedTime.getTime() === slot.getTime();

                        return (
                          <TouchableOpacity
                            key={slot.getTime()}
                            style={[styles.timeOption, isSelected && styles.selectedTimeOption]}
                            onPress={() => handleTimeSlotSelect(slot)}
                          >
                            <Text
                              style={[
                                styles.timeOptionText,
                                isSelected && styles.selectedTimeOptionText,
                              ]}
                            >
                              {formatTime(slot)}
                            </Text>
                            {isSelected && (
                              <MaterialCommunityIcons name="check-circle" size={20} color="#acc18a" />
                            )}
                          </TouchableOpacity>
                        );
                      })}

                      {/* Custom time input */}
                      <TouchableOpacity
                        style={[
                          styles.timeOption,
                          showCustomInput && styles.selectedTimeOption,
                          selectedTime && !timeSlots.some(slot => slot.getTime() === selectedTime.getTime()) && styles.selectedTimeOption,
                        ]}
                        onPress={() => setShowCustomInput(true)}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            showCustomInput && styles.selectedTimeOptionText,
                            selectedTime && !timeSlots.some(slot => slot.getTime() === selectedTime.getTime()) && styles.selectedTimeOptionText,
                          ]}
                        >
                          Custom Time
                        </Text>
                        {selectedTime && !timeSlots.some(slot => slot.getTime() === selectedTime.getTime()) && (
                          <MaterialCommunityIcons name="check-circle" size={20} color="#acc18a" />
                        )}
                      </TouchableOpacity>

                      {showCustomInput && (
                        <View style={styles.customInputContainer}>
                          <Text style={styles.customInputLabel}>Enter custom time (e.g., 1:12 PM)</Text>
                          <TextInput
                            style={styles.customInput}
                            value={customTimeInput}
                            onChangeText={handleCustomTimeChange}
                            placeholder="1:12 PM"
                            placeholderTextColor="#999999"
                            autoFocus
                          />
                          {selectedTime && !timeSlots.some(slot => slot.getTime() === selectedTime.getTime()) && (
                            <Text style={styles.customTimeDisplay}>
                              Selected: {formatTime(selectedTime)}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
            </ScrollView>
          </View>

          {/* Schedule Button - Fixed at bottom */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.scheduleButton} onPress={handleSchedule}>
              <Text style={styles.scheduleButtonText}>SCHEDULE PICKUP TIME</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalBody: {
    // Height is set dynamically in component
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexShrink: 0,
    zIndex: 1,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#acc18a',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    minHeight: 200,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  dayContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  selectedDayButton: {
    backgroundColor: '#acc18a',
    borderColor: '#acc18a',
  },
  selectedDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noSlotsContainer: {
    paddingVertical: 20,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  closedContainer: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  closedHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#403f3f',
    marginBottom: 12,
    textAlign: 'center',
  },
  closedMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedTimeOption: {
    backgroundColor: '#eff6e7',
    borderColor: '#acc18a',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#2B2B2B',
  },
  selectedTimeOptionText: {
    color: '#2B2B2B',
    fontWeight: '600',
  },
  customInputContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  customInputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2B2B2B',
    backgroundColor: '#FFFFFF',
  },
  customTimeDisplay: {
    marginTop: 8,
    fontSize: 14,
    color: '#acc18a',
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  scheduleButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#acc18a',
  },
});

