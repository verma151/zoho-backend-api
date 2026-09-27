import { createLead, searchLead } from "../zoho/leads.js";
import { getDealStatus, getVehicleInfo, updateDeal } from "../zoho/deals.js";
import { getBookingStatus } from "../zoho/bookings.js";
import { createServiceCase } from "../zoho/cases.js";

// Maps each tool to the lifecycle stage it represents, so the backend
// can track and surface "where" the conversation currently is.
export const TOOL_STAGE_MAP: Record<string, string> = {
  get_vehicle_info: "NEW_LEAD",
  search_lead: "NEW_LEAD",
  create_lead: "NEW_LEAD",
  get_deal_status: "ONGOING_PIPELINE",
  update_deal: "ONGOING_PIPELINE",
  get_booking_status: "BOOKED_VEHICLE",
  create_service_case: "POST_PURCHASE_SERVICE",
};

export const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "get_vehicle_info",
      description:
        "Get vehicle model, variants, features and demo pricing information.",
      parameters: {
        type: "object",
        properties: {
          vehicle: {
            type: "string",
            description: "Vehicle name such as Thar, XUV700 or Scorpio-N",
          },
        },
        required: ["vehicle"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "search_lead",
      description:
        "Check whether a lead already exists in Zoho CRM for a given phone number, before creating a new one.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string" },
        },
        required: ["phone"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "create_lead",
      description: "Create a new automotive customer lead in Zoho CRM.",
      parameters: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          city: { type: "string" },
          interestedVehicle: { type: "string" },
        },
        required: ["firstName", "lastName", "phone", "city", "interestedVehicle"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "get_deal_status",
      description:
        "Find an existing customer deal in Zoho CRM using their phone number. Returns the deal id, which is required to later update the deal.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string" },
        },
        required: ["phone"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "update_deal",
      description:
        "Update an existing deal in Zoho CRM — e.g. test drive status/date or follow-up preference. Requires the dealId returned by get_deal_status.",
      parameters: {
        type: "object",
        properties: {
          dealId: { type: "string" },
          testDriveStatus: {
            type: "string",
            enum: ["Not Scheduled", "Scheduled", "Completed", "Cancelled"],
          },
          testDriveDate: {
            type: "string",
            description: "ISO 8601 date/time",
          },
          followUpPreference: { type: "string" },
        },
        required: ["dealId"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "get_booking_status",
      description: "Get vehicle booking status using the booking ID.",
      parameters: {
        type: "object",
        properties: {
          bookingId: { type: "string" },
        },
        required: ["bookingId"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "create_service_case",
      description: "Create a post-purchase vehicle service case in Zoho CRM.",
      parameters: {
        type: "object",
        properties: {
          registrationNumber: { type: "string" },
          odometer: { type: "number" },
          issue: { type: "string" },
          serviceCenter: { type: "string" },
          phone: { type: "string" },
        },
        required: ["registrationNumber", "odometer", "issue", "serviceCenter"],
      },
    },
  },
];

export async function executeTool(name: string, args: any) {
  try {
    let result;

    switch (name) {
      case "get_vehicle_info":
        result = await getVehicleInfo(args.vehicle);
        break;

      case "search_lead":
        result = await searchLead(args.phone);
        break;

      case "create_lead":
        result = await createLead(args);
        break;

      case "get_deal_status":
        result = await getDealStatus(args.phone);
        break;

      case "update_deal":
        result = await updateDeal(args);
        break;

      case "get_booking_status":
        result = await getBookingStatus(args.bookingId);
        break;

      case "create_service_case":
        result = await createServiceCase(args);
        break;

      default:
        return {
          success: false,
          error: `Unknown tool: ${name}`,
          message: "The requested operation is not supported.",
        };
    }

    if (result === undefined || result === null) {
      return {
        success: false,
        data: null,
        message: `The ${name} operation completed but returned no data.`,
      };
    }

    return {
      success: true,
      data: result,
      stage: TOOL_STAGE_MAP[name] ?? null,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: error?.message || "Unknown error",
      message: `Unable to complete ${name}.`,
      stage: TOOL_STAGE_MAP[name] ?? null,
    };
  }
}