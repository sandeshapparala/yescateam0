// WhatsApp Business API - Send Registration Confirmation
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';
const WHATSAPP_SUCCESS_TEMPLATE_NAME = process.env.WHATSAPP_SUCCESS_TEMPLATE_NAME || 'registration_success';

interface WhatsAppConfirmationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send registration confirmation via WhatsApp Template
 * Template: "Praise the Lord! Your Youthcamp 2026 registration is confirmed..."
 * 
 * @param phoneNumber - Phone number in E.164 format (+919876543210)
 * @param userName - Full name of the registered user
 * @param memberId - Member ID (e.g., YC26_001234)
 * @param loginUrl - Login URL for the user
 * @returns Promise with success status and message ID
 */
export async function sendRegistrationConfirmation(
  phoneNumber: string,
  userName: string,
  memberId: string,
  loginUrl: string = process.env.NEXT_PUBLIC_URL || 'https://yescateam.com/login'
): Promise<WhatsAppConfirmationResponse> {
  try {
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error('WhatsApp API credentials not configured');
    }

    if (!WHATSAPP_SUCCESS_TEMPLATE_NAME) {
      throw new Error('WhatsApp success template name not configured');
    }

    // Format phone number (remove + for WhatsApp API)
    const formattedPhone = phoneNumber.replace('+', '');

    // WhatsApp Cloud API endpoint
    const apiUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    // Template payload
    // Template variables:
    // {{1}} = User Name
    // {{2}} = Member ID
    // {{3}} = Login URL
    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: WHATSAPP_SUCCESS_TEMPLATE_NAME,
        language: {
          code: 'en',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: userName, // {{1}}
              },
              {
                type: 'text',
                text: memberId, // {{2}}
              },
              {
                type: 'text',
                text: loginUrl, // {{3}}
              },
            ],
          },
        ],
      },
    };

    console.log('📱 Sending registration confirmation to:', formattedPhone);

    // Send request to WhatsApp API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp Confirmation API Error:', data);
      throw new Error(data.error?.message || 'Failed to send confirmation message');
    }

    console.log('✅ WhatsApp registration confirmation sent:', data.messages?.[0]?.id);

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    console.error('Error sending WhatsApp confirmation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
