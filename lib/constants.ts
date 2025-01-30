export const NAV_THEME = {
    light: {
      background: 'hsl(0 0% 100%)', // background
      border: 'hsl(240 5.9% 90%)', // border
      card: 'hsl(0 0% 100%)', // card
      notification: 'hsl(0 84.2% 60.2%)', // destructive
      primary: 'hsl(240 5.9% 10%)', // primary
      text: 'hsl(240 10% 3.9%)', // foreground
    },
    dark: {
      background: 'hsl(240 10% 3.9%)', // background
      border: 'hsl(240 3.7% 15.9%)', // border
      card: 'hsl(240 10% 3.9%)', // card
      notification: 'hsl(0 72% 51%)', // destructive
      primary: 'hsl(0 0% 98%)', // primary
      text: 'hsl(0 0% 98%)', // foreground
    },
  };

export const defaultAmenities = [
  "WiFi",
  "Parking",
  "Swimming Pool",
  "Restaurant",
  "Gym",
  "Spa",
  "Room Service",
  "Air Conditioning",
  "Bar",
  "Conference Room",
] as const;

export const defaultRoomFeatures = [
  'Air Conditioning',
  'TV',
  'Mini Bar',
  'Safe',
  'Desk',
  'Balcony',
  'Sea View',
  'Mountain View',
  'Room Service',
  'Free WiFi'
] as const;

export const HotelData = [
  {
    "hotelId": "H1234",
    "hotelName": "Sunset Paradise Hotel",
    "description": "A luxurious hotel with breathtaking views of the sunset, offering world-class amenities and exceptional hospitality.",
    "location": "Jaipur, Rajasthan, India",
    "code": 1234,
    "owner": {
      "name": "Rajesh Mehta",
      "phone": "+91-9876543210",
      "email": "rajesh.mehta@sunsetparadise.com"
    },
    "rules": {
      "petsAllowed": true,
      "maxPeopleInOneRoom": 3,
      "extraMattressOnAvailability": true,
      "parking": true,
      "swimmingPool": true,
      "swimmingPoolTimings": "6:00 AM - 8:00 PM",
      "ownRestaurant": true,
      "checkInTime": "12:00 PM",
      "checkOutTime": "11:00 AM",
      "guestInfoNeeded": true,
      "smokingAllowed": false,
      "alcoholAllowed": true,
      "eventsAllowed": true,
      "minimumAgeForCheckIn": 18
    },
    "amenities": [
      "Free WiFi",
      "Gym",
      "Spa",
      "Room Service",
      "Airport Pickup"
    ],
    "hotelImages": [
      "https://images.unsplash.com/photo-1517840901100-8179e982acb7?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://api.unsplash.com/random/800x600/?room",
      "https://api.unsplash.com/random/800x600/?pool",
      "https://api.unsplash.com/random/800x600/?restaurant",
      "https://api.unsplash.com/random/800x600/?view"
    ],
    "contactNumber": "+91-9876543210"
  },
  {
    "hotelId": "H5678",
    "hotelName": "Mountain Retreat Inn",
    "description": "Nestled in the hills, this retreat offers a tranquil escape with cozy rooms and personalized service.",
    "location": "Manali, Himachal Pradesh, India",
    "code": 5678,
    "owner": {
      "name": "Suman Joshi",
      "phone": "+91-8765432109",
      "email": "suman.joshi@mountainretreat.com"
    },
    "rules": {
      "petsAllowed": false,
      "maxPeopleInOneRoom": 4,
      "extraMattressOnAvailability": true,
      "parking": true,
      "swimmingPool": false,
      "ownRestaurant": true,
      "checkInTime": "2:00 PM",
      "checkOutTime": "12:00 PM",
      "guestInfoNeeded": true,
      "smokingAllowed": true,
      "alcoholAllowed": true,
      "eventsAllowed": false,
      "minimumAgeForCheckIn": 21
    },
    "amenities": [
      "Free Breakfast",
      "Hiking Trails",
      "Bonfire",
      "Room Service"
    ],
    "hotelImages": [
      "https://api.unsplash.com/random/800x600/?mountain",
      "https://api.unsplash.com/random/800x600/?nature",
      "https://api.unsplash.com/random/800x600/?fireplace",
      "https://api.unsplash.com/random/800x600/?cozyroom",
      "https://api.unsplash.com/random/800x600/?lobby"
    ],
    "contactNumber": "+91-8765432109"
  },
  {
    "hotelId": "H9012",
    "hotelName": "Urban Stay Deluxe",
    "description": "A modern hotel in the heart of the city, designed for comfort and convenience for business and leisure travelers.",
    "location": "Mumbai, Maharashtra, India",
    "code": 9012,
    "owner": {
      "name": "Amit Sharma",
      "phone": "+91-9123456780",
      "email": "amit.sharma@urbanstay.com"
    },
    "rules": {
      "petsAllowed": false,
      "maxPeopleInOneRoom": 2,
      "extraMattressOnAvailability": false,
      "parking": false,
      "swimmingPool": true,
      "swimmingPoolTimings": "7:00 AM - 10:00 PM",
      "ownRestaurant": true,
      "checkInTime": "3:00 PM",
      "checkOutTime": "12:00 PM",
      "guestInfoNeeded": true,
      "smokingAllowed": false,
      "alcoholAllowed": false,
      "eventsAllowed": true,
      "minimumAgeForCheckIn": 18
    },
    "amenities": [
      "High-Speed WiFi",
      "Business Center",
      "Conference Room",
      "Laundry Service",
      "Complimentary Snacks"
    ],
    "hotelImages": [
      "https://api.unsplash.com/random/800x600/?business",
      "https://api.unsplash.com/random/800x600/?cityhotel",
      "https://api.unsplash.com/random/800x600/?lounge",
      "https://api.unsplash.com/random/800x600/?dining",
      "https://api.unsplash.com/random/800x600/?reception"
    ],
    "contactNumber": "+91-9123456780"
  }
]
