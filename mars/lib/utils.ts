import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes messages for Groq API by removing extra metadata 
 * and ensuring only expected keys are present.
 */
/**
 * Ensures that all messages sent to LLM have valid image_url protocols.
 * Groq only supports http, https, and data:image/ protocols.
 * Any other image_urls (like ref: or file:) will be converted to text descriptions.
 * It also cleans up extra metadata for API safety.
 */
export function sanitizeMessages(messages: any[]): any[] {
  return messages.map((m) => {
    if (!Array.isArray(m.content)) {
      return {
        role: m.role,
        content: m.content,
      };
    }

    return {
      role: m.role,
      content: m.content.map((part: any) => {
        if (part.type === 'image_url') {
          const url = part.image_url?.url || '';
          const isValidProtocol =
            url.startsWith('http://') ||
            url.startsWith('https://') ||
            url.startsWith('data:image/');

          if (!isValidProtocol) {
            const fileName = url.startsWith('ref:') ? url.replace('ref:', '') : 'attached file';
            return {
              type: 'text',
              text: `[File Attachment: ${fileName}]`,
            };
          }
        }
        return part;
      }),
    };
  });
}
