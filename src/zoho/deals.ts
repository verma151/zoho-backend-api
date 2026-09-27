import { zohoRequest } from "./client.js";

export async function getDealStatus(phone: string) {
  const criteria = `(Customer_Phone:equals:${phone})`;

  const response = await zohoRequest(
    `/crm/v8/Deals/search?criteria=${encodeURIComponent(criteria)}`
  );

  if (!response?.data || response.data.length === 0) {
    return {
      found: false,
      message: "No active deal was found for this phone number.",
      deal: null,
    };
  }

  const deal = response.data[0];

  return {
    found: true,
    message: "Deal found.",
    deal: {
      id: deal.id,
      customerName: deal.Contact_Name?.name ?? null,
      vehicle: deal.Vehicle ?? null,
      stage: deal.Stage ?? null,
      customerPhone: deal.Customer_Phone ?? null,
      testDriveStatus: deal.Test_Drive_Status ?? null,
      testDriveDate: deal.Test_Drive_Date ?? null,
    },
  };
}

export interface UpdateDealInput {
  dealId: string;
  testDriveStatus?: string;
  testDriveDate?: string;
  followUpPreference?: string;
}

export async function updateDeal(args: UpdateDealInput) {
  const fields: Record<string, any> = {};

  if (args.testDriveStatus) fields.Test_Drive_Status = args.testDriveStatus;
  if (args.testDriveDate) fields.Test_Drive_Date = args.testDriveDate;
  // Follow_Up_Preference must exist as a custom field on the Deals module in Zoho.
  if (args.followUpPreference) fields.Follow_Up_Preference = args.followUpPreference;

  if (Object.keys(fields).length === 0) {
    return {
      updated: false,
      message: "No updatable fields were provided.",
    };
  }

  const payload = {
    data: [
      {
        id: args.dealId,
        ...fields,
      },
    ],
  };

  const response = await zohoRequest("/crm/v8/Deals", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  const record = response?.data?.[0];

  if (!record || record.code !== "SUCCESS") {
    return {
      updated: false,
      message: "Deal could not be updated in Zoho CRM.",
    };
  }

  return {
    updated: true,
    dealId: args.dealId,
    message: "Deal updated successfully.",
  };
}

export async function getVehicleInfo(vehicle: string) {
  const vehicles: Record<string, any> = {
    thar: {
      name: "Thar",
      variants: ["AX", "LX"],
      features: [
        "4x4 capability",
        "Touchscreen infotainment",
        "Cruise control",
        "Adventure-focused design",
      ],
      demoPricing: "₹11.5 lakh onwards",
    },
    xuv700: {
      name: "XUV700",
      variants: ["MX", "AX3", "AX5", "AX7"],
      features: [
        "ADAS",
        "Panoramic sunroof",
        "Connected technology",
        "Advanced safety features",
      ],
      demoPricing: "₹14 lakh onwards",
    },
    "scorpio-n": {
      name: "Scorpio-N",
      variants: ["Z2", "Z4", "Z6", "Z8", "Z8L"],
      features: [
        "Body-on-frame SUV",
        "4x4 capability",
        "Large cabin",
        "Advanced safety features",
      ],
      demoPricing: "₹13.5 lakh onwards",
    },
  };

  const key = vehicle.toLowerCase().trim();
  const data = vehicles[key];

  if (!data) {
    return {
      found: false,
      message: `I don't have vehicle information for ${vehicle}.`,
      vehicle: null,
    };
  }

  return {
    found: true,
    message: "Vehicle information found.",
    vehicle: data,
  };
}