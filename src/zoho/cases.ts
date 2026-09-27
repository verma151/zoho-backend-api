import { zohoRequest } from "./client.js";

export interface CreateCaseInput {
  subject?: string;
  registrationNumber: string;
  odometer: number;
  issue: string;
  serviceCenter: string;

  phone?: string;
  email?: string;
  productName?: string;
  priority?: string;
  caseReason?: string;
  reportedBy?: string;

  status?: string;
  caseOrigin?: string;
}

export async function createServiceCase(args: CreateCaseInput) {
  const description = `
Vehicle Service Request

Vehicle Registration Number: ${args.registrationNumber}
Odometer Reading: ${args.odometer} km
Preferred Service Center: ${args.serviceCenter}

Issue:
${args.issue}

Customer Contact:
Phone: ${args.phone || "Not provided"}
Email: ${args.email || "Not provided"}

Service request was created through the AI service assistant.
  `.trim();

  const payload = {
    data: [
      {
        // Case Subject
        Subject:
          args.subject ||
          `Vehicle Service - ${args.registrationNumber}`,

        // Custom fields
        Registration_Number: args.registrationNumber,

        Odometer: args.odometer,

        Issue: args.issue,

        Preferred_Service_Center:
          args.serviceCenter,

        Customer_Phone:
          args.phone || null,

        // Standard / additional fields
        Description: description,

        Status: args.status || "New",

        Case_Origin: args.caseOrigin || "Chat",

        Priority: args.priority || "Medium",

        Case_Reason:
          args.caseReason || "Vehicle Service",

        Phone: args.phone || null,

        Email: args.email || null,

        Product_Name:
          args.productName || null,

        Reported_By:
          args.reportedBy || null
      }
    ]
  };

  console.log(
    "Creating Zoho Service Case:",
    JSON.stringify(payload, null, 2)
  );

  const response = await zohoRequest("/crm/v8/Cases", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  console.log(
    "Zoho Create Case Response:",
    JSON.stringify(response, null, 2)
  );

  const record = response?.data?.[0];

  if (!record) {
    return {
      created: false,
      caseId: null,
      message: "Service case could not be created."
    };
  }

  return {
    created: true,
    caseId: record.details?.id || record.id,
    message: "Service case created successfully."
  };
}