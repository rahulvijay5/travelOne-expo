import * as React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Text } from '@/components/ui/text';
import { Filter } from 'lucide-react-native';
import { BookingStatus, RoomStatus } from '@/types';
import { useColorScheme } from 'nativewind';

interface FilterMenuProps {
  onFilterChange: (filterType: string, value: string) => void;
  currentFilters: {
    status: BookingStatus | '';
    roomStatus: RoomStatus | '';
    sortBy: 'checkIn' | 'checkOut' | 'bookingTime';
  };
}

export function FilterMenu({ onFilterChange, currentFilters }: FilterMenuProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-blue-500 p-2 rounded-lg">
          <Filter size={20} color="white" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>
          <Text className="text-base font-semibold dark:text-white">Filters</Text>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <Text className="text-sm text-gray-500 dark:text-gray-400">Booking Status</Text>
          </DropdownMenuLabel>
          <DropdownMenuItem onPress={() => onFilterChange('status', '')}>
            <Text className={currentFilters.status === '' ? 'text-blue-500' : ''}>All Status</Text>
          </DropdownMenuItem>
          <DropdownMenuItem onPress={() => onFilterChange('status', 'PENDING')}>
            <Text className={currentFilters.status === 'PENDING' ? 'text-blue-500' : ''}>Pending</Text>
          </DropdownMenuItem>
          <DropdownMenuItem onPress={() => onFilterChange('status', 'CONFIRMED')}>
            <Text className={currentFilters.status === 'CONFIRMED' ? 'text-blue-500' : ''}>Confirmed</Text>
          </DropdownMenuItem>
          <DropdownMenuItem onPress={() => onFilterChange('status', 'CANCELLED')}>
            <Text className={currentFilters.status === 'CANCELLED' ? 'text-blue-500' : ''}>Cancelled</Text>
          </DropdownMenuItem>
          <DropdownMenuItem onPress={() => onFilterChange('status', 'COMPLETED')}>
            <Text className={currentFilters.status === 'COMPLETED' ? 'text-blue-500' : ''}>Completed</Text>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <Text className="text-sm text-gray-500 dark:text-gray-400">Room Status</Text>
          </DropdownMenuLabel>
          <DropdownMenuItem onPress={() => onFilterChange('roomStatus', '')}>
            <Text className={currentFilters.roomStatus === '' ? 'text-blue-500' : ''}>All</Text>
          </DropdownMenuItem>
          <DropdownMenuItem onPress={() => onFilterChange('roomStatus', 'AVAILABLE')}>
            <Text className={currentFilters.roomStatus === 'AVAILABLE' ? 'text-blue-500' : ''}>Available</Text>
          </DropdownMenuItem>
          <DropdownMenuItem onPress={() => onFilterChange('roomStatus', 'BOOKED')}>
            <Text className={currentFilters.roomStatus === 'BOOKED' ? 'text-blue-500' : ''}>Booked</Text>
          </DropdownMenuItem>
          <DropdownMenuItem onPress={() => onFilterChange('roomStatus', 'MAINTENANCE')}>
            <Text className={currentFilters.roomStatus === 'MAINTENANCE' ? 'text-blue-500' : ''}>Maintenance</Text>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <Text className="text-sm text-gray-500 dark:text-gray-400">Sort By</Text>
          </DropdownMenuLabel>
          <DropdownMenuItem onPress={() => onFilterChange('sortBy', 'checkIn')}>
            <Text className={currentFilters.sortBy === 'checkIn' ? 'text-blue-500' : ''}>Check In</Text>
          </DropdownMenuItem>
          <DropdownMenuItem onPress={() => onFilterChange('sortBy', 'checkOut')}>
            <Text className={currentFilters.sortBy === 'checkOut' ? 'text-blue-500' : ''}>Check Out</Text>
          </DropdownMenuItem>
          <DropdownMenuItem onPress={() => onFilterChange('sortBy', 'bookingTime')}>
            <Text className={currentFilters.sortBy === 'bookingTime' ? 'text-blue-500' : ''}>Booking Time</Text>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 