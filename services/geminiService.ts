
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  /**
   * Obtém recomendações de produtos com base na consulta do usuário.
   */
  async getProductRecommendations(query: string, availableProducts: any[]) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "O serviço de IA está temporariamente indisponível no ambiente de demonstração estático. Por favor, verifique a configuração da chave de API.";
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const context = JSON.stringify(availableProducts.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category })));
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é um assistente da StoreHub. Com base nos produtos: ${context}, responda a dúvida do usuário: "${query}". Recomende os melhores produtos de forma amigável e profissional. Responda em Português do Brasil.`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini AI Error:", error);
      return "Houve um erro na comunicação com o núcleo de inteligência artificial.";
    }
  }

  /**
   * Gera uma imagem de marketing para o produto.
   */
  async generateProductImage(prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1") {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Digital product marketing image for: ${prompt}. Professional, high quality, neon aesthetics.` }]
        },
        config: {
          imageConfig: {
            aspectRatio
          }
        }
      });

      for (const part of response.candidates?.[0]?.content.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    } catch (error) {
      console.error("Image Generation Error:", error);
    }
    return null;
  }

  /**
   * Transcreve áudio para texto utilizando o modelo especializado em áudio nativo.
   */
  async transcribeAudio(audioBase64: string) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "Serviço de áudio indisponível.";

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        contents: {
          parts: [
            { inlineData: { data: audioBase64, mimeType: 'audio/pcm;rate=16000' } },
            { text: "Transcreva este áudio para texto." }
          ]
        }
      });
      return response.text;
    } catch (error) {
      console.error("Transcription Error:", error);
      return "Erro ao processar áudio.";
    }
  }
}

export const geminiService = new GeminiService();
