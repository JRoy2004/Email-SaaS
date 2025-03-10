import { db } from "@/server/db";

interface email {
  email_address: string;
}

interface WebhookPayload {
  data: {
    id: string;
    email_addresses: email[];
    first_name: string;
    last_name: string;
    profile_image_url: string;
  };
}

export const POST = async (req: Request) => {
  const { data }: WebhookPayload = (await req.json()) as WebhookPayload;
  console.log(data);
  const { id, email_addresses, first_name, last_name, profile_image_url } =
    data;

  // Ensure at least one email exists before accessing it
  // Check if email_addresses array is not empty
  if (!email_addresses.length || !email_addresses[0]?.email_address) {
    return new Response("No valid email provided", { status: 400 });
  }

  await db.user.create({
    data: {
      id: id,
      emailAddress: email_addresses[0].email_address,
      firstName: first_name,
      lastName: last_name,
      imageURL: profile_image_url,
    },
  });

  return new Response("Webhook received", { status: 200 });
};
