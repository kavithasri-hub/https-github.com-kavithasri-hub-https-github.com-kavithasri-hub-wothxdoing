import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
// Allow payload up to 15MB for camera / high-resolution image uploads
app.use(express.json({ limit: '15mb' }));

const port = Number(process.env.PORT) || 3000;

// Server-side initialization of Gemini API using @google/genai SDK
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Endpoint for AI Material Visual Identification
app.post('/api/gemini/identify-material', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided for visual analysis.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Image identification could not be completed. Please try again or continue with text search.',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();

    // Models ordered by reliability and capacity for multimodal vision analysis
    const visionModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: any = null;
    let responseText = '';

    const systemPrompt = `You are an AI material discovery engine for WORTHX, a circular economy resource marketplace.
Analyze the visual content of the uploaded image carefully and accurately.

Your task:
1. Examine what object or material is physically present in the photo.
2. Determine if the image depicts a secondary raw material, agricultural by-product, industrial waste stream, or post-consumer recyclable feedstock.

PRIMARY WORTHX CATEGORIES & EXAMPLES:
- "Coconut Shell" (cracked hard coconut shells, halved dry coconut shells, endocarp)
- "Coconut Husk" (raw fibrous coconut husk, coir fiber, dry coir pith)
- "Eggshell" (crushed or whole bio-calcium eggshells)
- "Orange Peel" (citrus rinds, dried or fresh orange/lemon peels)
- "Plastic Bottles" (PET bottles, beverage plastic bottles, plastic container scrap, rPET flakes)
- "Paper Waste" (baled OCC cardboard, shredded ledger paper, kraft packaging waste)
- "Banana Peel" (banana skins, fruit processing residues)
- "Agricultural Waste" (paddy straw, sugarcane bagasse, wheat/mustard stalk, rice husk pellets)
- "Metal Scrap" (recycled industrial scrap metal, steel offcuts, aluminum turnings, copper wire scrap, industrial metal scraps)
- Other circular materials: "Coffee Grounds", "Sawdust", "Textile Scrap", "Glass Scrap", "Rubber Scrap", etc.

NON-MATERIAL CONSUMER ITEMS:
If the image shows a personal electronic device (laptop, phone, monitor), furniture, vehicle, live animal, human selfie, prepared restaurant meal, or room interior:
- Set isCircularMaterial to false
- Set identifiedMaterial to "Unknown"
- In nonMaterialDetected, specify the detected item (e.g. "Laptop / Computer")
- Set confidence to "Low"
- In reasoning, explain that it is an everyday consumer item and not a circular secondary feedstock.

Return ONLY a valid JSON object in this exact structure:
{
  "isCircularMaterial": boolean,
  "identifiedMaterial": string,
  "nonMaterialDetected": string | null,
  "category": "Agro & Organic" | "Food Processing Waste" | "Paper" | "Plastic" | "Industrial By-products" | "Recyclable / Industrial Scrap" | "Other Reusable Materials",
  "confidence": "High" | "Medium" | "Low",
  "reasoning": "Clear 1-2 sentence description explaining what was visually detected in the photo",
  "possibleUses": [
    "Possible application 1",
    "Possible application 2",
    "Possible application 3",
    "Possible application 4"
  ]
}`;

    // Try models in cascade if one encounters high demand (503/429)
    for (const model of visionModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: systemPrompt,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          responseText = response.text.trim();
          break; // successfully received response
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Vision model ${model} failed, trying next available model...`, err?.message || err);
      }
    }

    if (!responseText) {
      console.error('All vision models failed for image identification:', lastError);
      return res.status(500).json({
        error: 'Image identification could not be completed. Please try again or continue with text search.',
        details: lastError?.message,
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = {
        isCircularMaterial: false,
        identifiedMaterial: 'Unknown',
        nonMaterialDetected: null,
        confidence: 'Low',
        category: 'Other Reusable Materials',
        reasoning: 'Visual inspection did not match a standardized material profile.',
        possibleUses: [],
      };
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error('Gemini visual identification failure:', err);
    return res.status(500).json({
      error: 'Image identification could not be completed. Please try again or continue with text search.',
      details: err.message,
    });
  }
});

// Endpoint for AI Listing Image & Material Validation
app.post('/api/gemini/validate-material-listing', async (req, res) => {
  try {
    const { imageBase64, imageUrl, mimeType = 'image/jpeg', expectedMaterial } = req.body;

    if (!expectedMaterial || typeof expectedMaterial !== 'string' || !expectedMaterial.trim()) {
      return res.status(400).json({
        error: 'Please enter a Material Name before validating the image.',
      });
    }

    if (!imageBase64 && !imageUrl) {
      return res.status(400).json({
        error: 'No image provided for visual validation.',
      });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'AI Vision validation service is currently unavailable. Please check API key setup.',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    let cleanBase64 = '';
    let finalMimeType = mimeType;

    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.*)$/);
      if (match) {
        finalMimeType = match[1];
        cleanBase64 = match[2].trim();
      } else {
        cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
      }
    } else if (imageUrl) {
      if (imageUrl.startsWith('data:image/')) {
        const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.*)$/);
        if (match) {
          finalMimeType = match[1];
          cleanBase64 = match[2].trim();
        } else {
          cleanBase64 = imageUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
        }
      } else {
        // Fetch external image URL and convert to base64
        try {
          const fetchRes = await fetch(imageUrl, {
            headers: { 'User-Agent': 'WORTHX-Image-Validator' },
          });
          if (!fetchRes.ok) {
            throw new Error(`Failed to load image from URL: ${fetchRes.statusText}`);
          }
          const arrayBuffer = await fetchRes.arrayBuffer();
          cleanBase64 = Buffer.from(arrayBuffer).toString('base64');
          finalMimeType = fetchRes.headers.get('content-type') || 'image/jpeg';
        } catch (fetchErr: any) {
          return res.status(400).json({
            error: `Unable to download image for AI validation: ${fetchErr.message}`,
          });
        }
      }
    }

    if (!cleanBase64) {
      return res.status(400).json({
        error: 'Invalid or missing image payload.',
      });
    }

    const trimmedExpected = expectedMaterial.trim();

    const systemPrompt = `You are the AI Vision Material Validation Engine for WORTHX, a circular economy resource marketplace.
You must critically inspect the uploaded image and compare what is physically present in the photo against the seller's entered Material Name.

Expected Material Name from Seller: "${trimmedExpected}"

RULES & INSTRUCTIONS:
1. Examine the actual uploaded photo carefully. Identify what physical material, object, or scene is depicted.
2. UNCLEAR / UNCERTAIN / LOW CONFIDENCE RULE:
   - If the image is blurry, heavily degraded, too dark, out-of-focus, indistinct, or impossible to determine with certainty:
     Set "confidence" to "Low"
     Set "isMatch" to false
     Set "detectedMaterial" to "Unclear / Ambiguous"
     Set "explanation" to "The uploaded image is too blurry, dark, or indistinct to reliably verify the material."
     Set "mismatchMessage" to "Material could not be verified clearly. Please upload a clearer image of the material."
     Do NOT guess or approve uncertain images.
3. COMPARISON & ACCURACY (DYNAMIC COMPARISON FOR ANY MATERIAL):
   - Compare the detected physical item against "${trimmedExpected}".
   - MATCH: The image genuinely shows "${trimmedExpected}" or an accepted synonym, sub-grade, or raw form (e.g. "Coconut Shell" vs broken/cracked coconut shells; "Eggshell" vs crushed eggshells/calcium flakes; "Plastic Bottles" vs PET bottles; "Orange Peel" vs citrus rinds).
     - Set "isMatch" to true
     - Set "confidence" to "High" (or "Medium" if standard quality)
     - Set "explanation" to "Image appears to show ${trimmedExpected}."
     - Set "mismatchMessage" to null
   - MISMATCH: The image depicts a completely different material, by-product, or object (e.g. seller entered "Coconut Shell", but photo shows "Orange Peel" or "Plastic Bottle"; seller entered "Eggshell", but photo shows "Plastic Bottle"; seller entered "Orange Peel", but photo shows "Coconut Shell"; or image shows everyday personal items like laptops, phones, furniture, clothing, selfies, food plates).
     - Set "isMatch" to false
     - Set "confidence" to "High" (or "Medium")
     - Set "explanation" to "Your listing says ${trimmedExpected}, but the uploaded image appears to show " + detectedMaterial + "."
     - Set "mismatchMessage" to "Your listing says ${trimmedExpected}, but the uploaded image appears to show " + detectedMaterial + ". Please upload an image of the material you want to sell."
4. Be precise and objective. Do not simply trust the text. Actually inspect visual evidence.

Return ONLY a JSON object in this exact format:
{
  "detectedMaterial": string,
  "expectedMaterial": "${trimmedExpected}",
  "isMatch": boolean,
  "confidence": "High" | "Medium" | "Low",
  "explanation": string,
  "mismatchMessage": string | null
}`;

    const visionModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: any = null;
    let responseText = '';

    for (const model of visionModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: finalMimeType,
                  data: cleanBase64,
                },
              },
              {
                text: systemPrompt,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          responseText = response.text.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Validation model ${model} failed, trying next model...`, err?.message || err);
      }
    }

    if (!responseText) {
      console.warn('Vision analysis could not process image:', lastError?.message || lastError);
      return res.json({
        expectedMaterial: trimmedExpected,
        detectedMaterial: 'Unclear / Indistinct',
        isMatch: false,
        confidence: 'Low',
        explanation: 'Material could not be verified clearly from the provided image.',
        mismatchMessage: 'Material could not be verified clearly. Please upload a clearer image of the material.',
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = {
        detectedMaterial: 'Unclear',
        expectedMaterial: trimmedExpected,
        isMatch: false,
        confidence: 'Low',
        explanation: 'Material could not be verified clearly.',
        mismatchMessage: 'Material could not be verified clearly. Please upload a clearer image of the material.',
      };
    }

    // Safety checks on fields
    if (parsed.confidence === 'Low') {
      parsed.isMatch = false;
      if (!parsed.mismatchMessage) {
        parsed.mismatchMessage = 'Material could not be verified clearly. Please upload a clearer image of the material.';
      }
    }

    return res.json({
      expectedMaterial: trimmedExpected,
      detectedMaterial: parsed.detectedMaterial || 'Unknown',
      isMatch: Boolean(parsed.isMatch),
      confidence: parsed.confidence || 'Medium',
      explanation: parsed.explanation || '',
      mismatchMessage: parsed.mismatchMessage || (parsed.isMatch ? null : `Image does not match the selected material.`),
    });
  } catch (err: any) {
    console.error('Listing image validation error:', err);
    return res.status(500).json({
      error: 'Material validation encountered an unexpected error.',
      details: err.message,
    });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`WORTHX Full-stack Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to initialize WORTHX server:', err);
});
