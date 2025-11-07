import { NextRequest, NextResponse } from 'next/server';
import type { WhatsAppMessage, WhatsAppStatus, WhatsAppWebhookPayload } from '@/lib/whatsapp/types';

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Meta sends these parameters for webhook verification
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('Webhook verified successfully');
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      console.error('Webhook verification failed - invalid token');
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 403 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Missing parameters' },
    { status: 400 }
  );
}

// POST endpoint for receiving webhook events
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WhatsAppWebhookPayload;

    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // WhatsApp Business API sends events in this structure
    if (body.object === 'whatsapp_business_account') {
      // Extract the entry from the webhook payload
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Handle different types of events
      if (value?.messages) {
        // Incoming message
        const message = value.messages[0];
        await handleIncomingMessage(message);
      }

      if (value?.statuses) {
        // Message status update
        const status = value.statuses[0];
        await handleStatusUpdate(status);
      }

      // Return 200 OK to acknowledge receipt
      return NextResponse.json({ status: 'received' }, { status: 200 });
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}

// Handle incoming messages
async function handleIncomingMessage(message: WhatsAppMessage) {
  console.log('📨 Incoming message:', {
    from: message.from,
    type: message.type,
    timestamp: message.timestamp,
    id: message.id,
  });

  const messageType = message.type;
  const from = message.from; // Phone number of sender

  switch (messageType) {
    case 'text':
      if (message.text) {
        const textBody = message.text.body;
        console.log(`Text message from ${from}: ${textBody}`);
        // TODO: Process text message
        // You can add logic here to respond to specific keywords
      }
      break;

    case 'button':
      if (message.button) {
        const buttonPayload = message.button.payload;
        const buttonText = message.button.text;
        console.log(`Button response from ${from}: ${buttonText} (${buttonPayload})`);
        // TODO: Handle button responses
      }
      break;

    case 'interactive':
      if (message.interactive?.type === 'button_reply' && message.interactive.button_reply) {
        const buttonReply = message.interactive.button_reply;
        console.log(`Interactive button from ${from}: ${buttonReply.title}`);
        // TODO: Handle interactive button
      } else if (message.interactive?.type === 'list_reply' && message.interactive.list_reply) {
        const listReply = message.interactive.list_reply;
        console.log(`List selection from ${from}: ${listReply.title}`);
        // TODO: Handle list selection
      }
      break;

    case 'image':
    case 'video':
    case 'audio':
    case 'document':
      console.log(`Media message (${messageType}) from ${from}`);
      // TODO: Handle media messages
      break;

    default:
      console.log(`Unsupported message type: ${messageType}`);
  }
}

// Handle message status updates
async function handleStatusUpdate(status: WhatsAppStatus) {
  const messageId = status.id;
  const statusType = status.status; // sent, delivered, read, failed
  const timestamp = status.timestamp;
  const recipientId = status.recipient_id;

  console.log('📊 Status update:', {
    messageId,
    status: statusType,
    recipient: recipientId,
    timestamp,
  });

  switch (statusType) {
    case 'sent':
      console.log(`✅ Message ${messageId} sent successfully`);
      // TODO: Update message status in database
      break;

    case 'delivered':
      console.log(`📬 Message ${messageId} delivered`);
      // TODO: Update message status in database
      break;

    case 'read':
      console.log(`👁️ Message ${messageId} read`);
      // TODO: Update message status in database
      break;

    case 'failed':
      const errors = status.errors;
      console.error(`❌ Message ${messageId} failed:`, errors);
      // TODO: Handle failed message, maybe retry or notify admin
      break;

    default:
      console.log(`Unknown status: ${statusType}`);
  }
}
