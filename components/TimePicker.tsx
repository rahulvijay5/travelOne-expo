import React, { useState } from 'react';
import { View, Platform, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TimePickerProps {
  value: number; // minutes since midnight (e.g., 660 for 11:00 AM)
  onChange: (minutes: number) => void;
  label: string;
}

const TimePicker = ({ value, onChange, label }: TimePickerProps) => {
  const [show, setShow] = useState(false);

  // Convert minutes to Date object for the picker
  const minutesToDate = (minutes: number) => {
    const date = new Date();
    date.setHours(Math.floor(minutes / 60));
    date.setMinutes(minutes % 60);
    return date;
  };

  // Convert Date object to minutes since midnight
  const dateToMinutes = (date: Date) => {
    return date.getHours() * 60 + date.getMinutes();
  };

  const handleChange = (_: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(dateToMinutes(selectedDate));
    }
  };

  // Format minutes to time string (e.g., "11:00 AM")
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  if (Platform.OS === 'ios') {
    return (
      <View className="flex-1 flex-row justify-between items-center">
        <Text className="dark:text-white text-lg">{label}</Text>
        <DateTimePicker
          value={minutesToDate(value)}
          mode="time"
          onChange={handleChange}
          minuteInterval={1}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 flex-row justify-between items-center">
      <Text className="dark:text-white text-lg">{label}</Text>
      <Pressable
        onPress={() => setShow(true)}
        className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg"
      >
        <Text className="dark:text-white text-center">
          {formatTime(value)}
        </Text>
      </Pressable>

      {show && (
        <DateTimePicker
          value={minutesToDate(value)}
          mode="time"
          onChange={handleChange}
          minuteInterval={1}
        />
      )}
    </View>
  );
};

export default TimePicker; 