// webhookLib.js
import axios from 'axios';

const defaultWebhookUrl = 'YOUR_DEFAULT_WEBHOOK_URL_HERE';

export const makeWebhook = async (type, action, message, value, url = defaultWebhookUrl) => {
  try {
    const response = await axios.post(url, {
      type,
      action,
      message,
      value
    });

    return {
      type: response.data.type,
      action: response.data.action,
      data: response.data.data.map(item => ({
        name: item.name,
        value: item.value
      }))
    };
  } catch (error) {
    console.error('Error making webhook call:', error);
    throw error;
  }
};