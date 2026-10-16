export interface TimeSlot {
  id: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  isBooked: boolean;
  clientName: string;
  clientPhone: string;
  clientNotes: string;
  createdAt: string;
}

export interface BookingFormData {
  selectedService: string;
  selectedCategory: string;
  selectedHairstylist: string;
  selectedSlotId: string;
  clientName: string;
  clientPhone: string;
  clientNotes: string;
}

export interface ReviewItem {
  id: string;
  name: string;
  role: string;
  message: string;
  rating: number;
}
