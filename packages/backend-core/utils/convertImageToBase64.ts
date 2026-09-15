import axios from 'axios';

const convertImageToBase64 = async (
  imageUrl: string,
): Promise<string | null> => {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const contentType = response.headers['content-type'];
    if (contentType && base64) {
      return `data:${contentType};base64,${base64}`;
    }
    return null;
  } catch (error) {
    console.error(`Converting image to base64 with issue: ${error}`);
    throw new Error(`Converting image to base64 with issue: ${error}`);
  }
};

export { convertImageToBase64 };
