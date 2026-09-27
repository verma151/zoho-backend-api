import { zohoRequest } from "./client.js";

export async function getBookingStatus(bookingId: string) {
  const criteria = `(Booking_ID:equals:${bookingId})`;

  const response = await zohoRequest(
    `/crm/v8/Bookings/search?criteria=${encodeURIComponent(criteria)}`
  );

  if (!response?.data || response.data.length === 0) {
    return {
      found: false,
      message: `No booking was found for booking ID ${bookingId}.`,
      booking: null,
    };
  }

  const booking = response.data[0];

  return {
    found: true,
    message: "Booking found.",
    booking: {
      id: booking.id,
      bookingId: booking.Booking_ID || bookingId,
      vehicleModel: booking.Vehicle_Model || null,
      vehicleVariant: booking.Vehicle_Variant || null,
      customerName: booking.Customer_Name || null,
      email: booking.Email || null,
      status: booking.Booking_Status || null,
      vin: booking.VIN || null,
      balancePaymentLink: booking.Balance_Payment_Link || null,
    },
  };
}