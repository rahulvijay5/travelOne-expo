import React, { useState } from 'react';
import { View, Platform, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  label: string;
}

const DatePicker = ({ value, onChange, minimumDate, label }: DatePickerProps) => {
  const [show, setShow] = useState(false);

  const handleChange = (_: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  if (Platform.OS === 'ios') {
    return (
      <View className="flex-1">
        <Text className="dark:text-white text-lg font-semibold mb-2">{label}</Text>
        <DateTimePicker
          value={value}
          mode="date"
          onChange={handleChange}
          minimumDate={minimumDate}
        />
      </View>
    );
    }

  return (
    <View className="flex-1">
      <Text className="dark:text-white text-lg font-semibold mb-2">{label}</Text>
      <Pressable
        onPress={() => setShow(true)}
        className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg"
      >
        <Text className="dark:text-white text-center">
          {value.toLocaleDateString()}
        </Text>
      </Pressable>

      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          onChange={handleChange}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
};

export default DatePicker; 