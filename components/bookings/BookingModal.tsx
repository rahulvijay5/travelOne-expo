import React from 'react';
import { View, Modal, ScrollView, StyleSheet, Pressable } from 'react-native';
import { format, parseISO } from 'date-fns';
import { BookingDataInDb } from '@/types';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';

interface BookingModalProps {
  booking: BookingDataInDb | null;
  visible: boolean;
  onClose: () => void;
}

export default function BookingModal({ booking, visible, onClose }: BookingModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  if (!booking) return null;

  const handleOverlayPress = (e: any) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
          <View style={styles.header}>
            <Text style={[styles.title, isDark && styles.titleDark]}>Booking Details</Text>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <X size={24} color={isDark ? 'white' : 'black'} />
            </Pressable>
          </View>

          <ScrollView 
            style={styles.scrollViewStyle}
            contentContainerStyle={styles.scrollView}
            showsVerticalScrollIndicator={true}
            bounces={true}
            overScrollMode="always"
            scrollEventThrottle={16}
          >
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <View style={styles.customerInfo}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{booking.customer.name[0]}</Text>
                </View>
                <View>
                  <Text style={[styles.customerName, isDark && styles.customerNameDark]}>{booking.customer.name}</Text>
                  <Text style={[styles.customerPhone, isDark && styles.customerPhoneDark]}>{booking.customer.phoneNumber}</Text>
                </View>
              </View>
              <Text style={[styles.customerEmail, isDark && styles.customerEmailDark]}>{booking.customer.email}</Text>
              <Text style={[styles.guestText, isDark && styles.guestTextDark]}>Guests: {booking.guests}</Text>
            </View>

            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Stay Details</Text>
              <View style={styles.detailsRow}>
                <Text style={[styles.detailsLabel, isDark && styles.detailsLabelDark]}>Check In</Text>
                <Text style={[styles.detailsValue, isDark && styles.detailsValueDark]}>
                  {format(parseISO(booking.checkIn), 'd MMM, HH:mm a')}
                </Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={[styles.detailsLabel, isDark && styles.detailsLabelDark]}>Check Out</Text>
                <Text style={[styles.detailsValue, isDark && styles.detailsValueDark]}>
                  {format(parseISO(booking.checkOut), 'd MMM, HH:mm a')}
                </Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={[styles.detailsLabel, isDark && styles.detailsLabelDark]}>Room</Text>
                <Text style={[styles.detailsValue, isDark && styles.detailsValueDark]}>
                  {booking.room.roomNumber} ({booking.room.type})
                </Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={[styles.detailsLabel, isDark && styles.detailsLabelDark]}>Status</Text>
                <Text style={[styles.detailsValue, { color: getStatusColor(booking.status) }]}>
                  {booking.status}
                </Text>
              </View>
            </View>

            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Payment Details</Text>
              <View style={styles.detailsRow}>
                <Text style={[styles.detailsLabel, isDark && styles.detailsLabelDark]}>Total Amount</Text>
                <Text style={[styles.detailsValue, isDark && styles.detailsValueDark]}>₹{booking.payment.totalAmount}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={[styles.detailsLabel, isDark && styles.detailsLabelDark]}>Paid Amount</Text>
                <Text style={[styles.detailsValue, isDark && styles.detailsValueDark]}>₹{booking.payment.paidAmount}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={[styles.detailsLabel, isDark && styles.detailsLabelDark]}>Status</Text>
                <Text style={[styles.detailsValue, { color: getPaymentStatusColor(booking.payment.status) }]}>
                  {booking.payment.status}
                </Text>
              </View>
              {booking.payment.transactionId && (
                <View style={styles.detailsRow}>
                  <Text style={[styles.detailsLabel, isDark && styles.detailsLabelDark]}>Transaction ID</Text>
                  <Text style={[styles.detailsValue, isDark && styles.detailsValueDark]}>{booking.payment.transactionId}</Text>
                </View>
              )}
            </View>

            <Pressable 
              onPress={() => {
                onClose();
                router.push(`/bookings/${booking.id}`);
              }} 
              style={styles.viewDetailsButton}
            >
              <Text style={styles.viewDetailsText}>View Full Details</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Utility function to get the color based on the status
function getStatusColor(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'green';
    case 'PENDING':
      return 'orange';
    case 'CANCELLED':
      return 'red';
    default:
      return 'blue';
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'PAID':
      return 'green';
    case 'PENDING':
      return 'orange';
    case 'REFUNDED':
      return 'blue';
    default:
      return 'red';
  }
}

// Styles
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '85%',
  },
  modalContainerDark: {
    backgroundColor: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  scrollViewStyle: {
    flex: 1,
  },
  scrollView: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  titleDark: {
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  section: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionDark: {
    backgroundColor: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#fff',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  customerNameDark: {
    color: '#fff',
  },
  customerPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  customerPhoneDark: {
    color: '#fff',
  },
  customerEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  customerEmailDark: {
    color: '#fff',
  },
  guestText: {
    fontSize: 14,
    color: '#6b7280',
  },
  guestTextDark: {
    color: '#fff',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailsLabelDark: {
    color: '#9ca3af',
  },
  detailsValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  detailsValueDark: {
    color: 'white',
  },
  viewDetailsButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 12,
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

