import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { createFirestoreListing, updateFirestoreListing } from '../services/listingService';
import { MaterialCategory, MaterialListing } from '../types';
import { getMaterialImageUrl, getCategoryPlaceholderSvg, getPossibleUses } from '../utils/materialImages';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  X,
  Upload,
  PlusCircle,
  Sparkles,
  Layers,
  MapPin,
  Scale,
  ShieldCheck,
  Tag,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Camera,
  Check,
} from 'lucide-react';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: (listing: MaterialListing) => void;
  initialListing?: MaterialListing | null;
}

const CATEGORIES: MaterialCategory[] = [
  'Agro & Organic',
  'Food Processing Waste',
  'Paper',
  'Plastic',
  'Industrial By-products',
  'Other Reusable Materials',
];

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onListingCreated,
  initialListing = null,
}) => {
  const { user, profile } = useAuth();

  const isEditing = Boolean(initialListing && initialListing.id);

  const [materialName, setMaterialName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('Agro & Organic');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Kg');
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState('1 kg');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // AI Vision Validation state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [validation, setValidation] = useState<{
    hasValidated: boolean;
    isValidating: boolean;
    expectedMaterial: string;
    detectedMaterial: string;
    isMatch: boolean;
    confidence: 'High' | 'Medium' | 'Low';
    explanation: string;
    mismatchMessage: string | null;
    error: string | null;
  }>({
    hasValidated: false,
    isValidating: false,
    expectedMaterial: '',
    detectedMaterial: '',
    isMatch: false,
    confidence: 'Low',
    explanation: '',
    mismatchMessage: null,
    error: null,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const validationTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialListing) {
        setMaterialName(initialListing.materialName || '');
        setCategory(initialListing.category || 'Agro & Organic');
        setDescription(initialListing.description || '');
        setQuantity(initialListing.quantity || '');
        setUnit(initialListing.unit || 'Kg');
        setMinimumOrderQuantity(initialListing.minimumOrderQuantity || initialListing.minOrder || '1 kg');
        setPrice(initialListing.pricePerUnit || initialListing.price || '');
        setLocation(initialListing.location || profile?.location || '');
        setImageUrl(initialListing.imageUrl || '');
        setImagePreview(initialListing.imageUrl || null);
        setValidation({
          hasValidated: true,
          isValidating: false,
          expectedMaterial: initialListing.materialName || '',
          detectedMaterial: initialListing.materialName || '',
          isMatch: true,
          confidence: 'High',
          explanation: `Pre-verified listing asset for ${initialListing.materialName}`,
          mismatchMessage: null,
          error: null,
        });
      } else {
        setMaterialName('');
        setCategory('Agro & Organic');
        setDescription('');
        setQuantity('');
        setUnit('Kg');
        setMinimumOrderQuantity('1 kg');
        setPrice('');
        setLocation(profile?.location || 'Chennai, Tamil Nadu');
        setImageUrl('');
        setImagePreview(null);
        setValidation({
          hasValidated: false,
          isValidating: false,
          expectedMaterial: '',
          detectedMaterial: '',
          isMatch: false,
          confidence: 'Low',
          explanation: '',
          mismatchMessage: null,
          error: null,
        });
      }
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialListing, profile]);

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Execute AI image vs material validation
  const validateImageWithMaterial = async (
    targetImage: string,
    targetMaterialName: string,
    mimeType: string = 'image/jpeg'
  ) => {
    const trimmedName = targetMaterialName.trim();
    if (!targetImage) {
      return;
    }

    setValidation((prev) => ({
      ...prev,
      isValidating: true,
      expectedMaterial: trimmedName,
      error: null,
    }));

    try {
      const isBase64 = targetImage.startsWith('data:image/');
      const payload: any = {
        expectedMaterial: trimmedName || 'Circular Material',
        mimeType,
      };

      if (isBase64) {
        payload.imageBase64 = targetImage;
      } else {
        payload.imageUrl = targetImage;
      }

      const response = await fetch('/api/gemini/validate-material-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'AI verification service returned an error.');
      }

      const data = await response.json();

      // If seller hadn't entered a material name yet and uploaded an image, auto-fill it
      if (!trimmedName && data.detectedMaterial && data.detectedMaterial !== 'Unknown' && data.detectedMaterial !== 'Unclear / Ambiguous') {
        setMaterialName(data.detectedMaterial);
      }

      // Check if auto-generated description could be useful
      if (!description.trim() && data.detectedMaterial && data.isMatch) {
        setDescription(`High-grade circular feedstock of clean, sorted ${data.detectedMaterial}. Verified via WORTHX AI Vision.`);
      }

      setValidation({
        hasValidated: true,
        isValidating: false,
        expectedMaterial: trimmedName || data.expectedMaterial,
        detectedMaterial: data.detectedMaterial || 'Unknown',
        isMatch: Boolean(data.isMatch),
        confidence: data.confidence || 'Medium',
        explanation: data.explanation || '',
        mismatchMessage: data.mismatchMessage || (data.isMatch ? null : 'Image does not match the selected material.'),
        error: null,
      });
    } catch (err: any) {
      console.error('Validation failed:', err);
      setValidation({
        hasValidated: true,
        isValidating: false,
        expectedMaterial: trimmedName,
        detectedMaterial: 'Unclear',
        isMatch: false,
        confidence: 'Low',
        explanation: 'Material could not be verified clearly.',
        mismatchMessage: 'Material could not be verified clearly. Please upload a clearer image of the material.',
        error: err.message,
      });
    }
  };

  // Re-trigger validation when material name changes if an image is present
  const handleMaterialNameChange = (newName: string) => {
    setMaterialName(newName);
    const activeImage = imagePreview || imageUrl;
    if (activeImage && activeImage.trim()) {
      // Invalidate current match state immediately so publish is blocked while typing
      setValidation((prev) => ({
        ...prev,
        isMatch: false,
        isValidating: true,
      }));

      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      validationTimeoutRef.current = setTimeout(() => {
        if (newName.trim()) {
          validateImageWithMaterial(activeImage, newName);
        } else {
          setValidation((prev) => ({
            ...prev,
            isValidating: false,
            hasValidated: false,
            isMatch: false,
          }));
        }
      }, 700);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMessage('Image size should be under 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageUrl(result);
        validateImageWithMaterial(result, materialName, file.type || 'image/jpeg');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoCaptured = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageUrl(result);
      validateImageWithMaterial(result, materialName, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  // Quick test sample loader for rapid testing of all prompt test cases
  const handleSelectSampleTestImage = (sampleName: string, sampleUrl: string) => {
    setImagePreview(sampleUrl);
    setImageUrl(sampleUrl);
    validateImageWithMaterial(sampleUrl, materialName || sampleName);
  };

  // Preview source
  const previewSource = imagePreview || imageUrl || null;

  // Strict publish requirement check:
  // 1. Material name is provided
  // 2. Image is provided
  // 3. AI analysis succeeds
  // 4. Image matches the selected material
  // 5. Confidence is sufficient (High or Medium, never Low)
  const isImageProvided = Boolean(previewSource && previewSource.trim());
  const isNameProvided = Boolean(materialName && materialName.trim().length > 0);
  const isValidationPassed =
    isNameProvided &&
    isImageProvided &&
    validation.hasValidated &&
    !validation.isValidating &&
    validation.isMatch === true &&
    validation.confidence !== 'Low';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('You must be signed in to manage material listings.');
      return;
    }

    if (!materialName.trim() || !description.trim() || !quantity.trim() || !price.trim() || !location.trim()) {
      setErrorMessage('Please fill in all required material specifications.');
      return;
    }

    setLoading(true);
    try {
      // Determine relevant material image
      const finalImageUrl = imageUrl.trim() || getMaterialImageUrl(materialName.trim(), category);

      // Clean price to guarantee INR (₹)
      const cleanPriceRaw = price.trim().replace(/^\$/, ''); // strip any accidental $
      const formattedPrice = cleanPriceRaw.startsWith('₹') ? cleanPriceRaw : `₹${cleanPriceRaw}`;
      const pricePerUnit = formattedPrice.includes('/') ? formattedPrice : `${formattedPrice}/${unit.toLowerCase()}`;

      // Clean minimum order quantity
      const cleanMinOrder = minimumOrderQuantity.trim() || `1 ${unit}`;

      if (isEditing && initialListing) {
        const updatedFields: Partial<MaterialListing> = {
          materialName: materialName.trim(),
          category,
          description: description.trim(),
          quantity: quantity.trim(),
          unit: unit.trim(),
          minimumOrderQuantity: cleanMinOrder,
          minOrder: cleanMinOrder,
          pricePerUnit: pricePerUnit,
          price: pricePerUnit,
          location: location.trim(),
          imageUrl: finalImageUrl,
          possibleUses: getPossibleUses(materialName.trim()),
        };

        await updateFirestoreListing(initialListing.id, updatedFields);

        const updatedListing: MaterialListing = {
          ...initialListing,
          ...updatedFields,
          updatedAt: new Date().toISOString(),
        };

        setSuccessMessage('Listing updated successfully in Firestore!');
        setTimeout(() => {
          setLoading(false);
          onListingCreated(updatedListing);
          onClose();
        }, 600);
      } else {
        // Requirement 14 Firestore structure
        const newListing = await createFirestoreListing({
          sellerId: user.uid,
          sellerName: profile?.fullName || user.email?.split('@')[0] || 'Seller',
          materialName: materialName.trim(),
          category,
          description: description.trim(),
          quantity: quantity.trim(),
          unit: unit.trim(),
          minimumOrderQuantity: cleanMinOrder,
          minOrder: cleanMinOrder,
          pricePerUnit: pricePerUnit,
          price: pricePerUnit,
          location: location.trim(),
          imageUrl: finalImageUrl,
          availability: 'Available',
          isDemo: false,
          moistureContent: 'Standard specification',
          purityGrade: 'Industrial recovery grade',
          applications: ['Circular transformation', 'Raw material recovery'],
          possibleUses: getPossibleUses(materialName.trim()),
        });

        setSuccessMessage('Listing published successfully to the WORTHX marketplace!');
        setTimeout(() => {
          setLoading(false);
          onListingCreated(newListing);
          onClose();
        }, 750);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to save listing. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 cursor-default"
      >
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-bold shadow-xs">
              {isEditing ? (
                <Edit3 className="w-5 h-5 text-emerald-400" />
              ) : (
                <PlusCircle className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 leading-tight">
                {isEditing ? 'Edit Material Listing' : 'Create Material Listing'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Update specifications in Firestore' : 'Publish by-products directly to Firestore'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Material Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Material Name *
              </label>
              {validation.hasValidated && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  validation.isMatch && validation.confidence !== 'Low'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {validation.isMatch && validation.confidence !== 'Low' ? (
                    <>✓ AI Verified</>
                  ) : (
                    <>✗ Needs Valid Image</>
                  )}
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={materialName}
              onChange={(e) => handleMaterialNameChange(e.target.value)}
              placeholder="e.g. Coconut Shell, Orange Peel, Eggshell, Plastic Bottles..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-800 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Category & Price Per Unit (INR ₹) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-emerald-800 focus:bg-white focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Price per Unit (₹ INR) *
              </label>
              <input
                type="text"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. ₹20/kg"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-800 focus:bg-white focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Quantity, Unit, & Minimum Order Quantity (Requirement 13) */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Available Qty *
              </label>
              <input
                type="text"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 1,000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unit *
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. Kg, Tons"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Min Order Qty *
              </label>
              <input
                type="text"
                required
                value={minimumOrderQuantity}
                onChange={(e) => setMinimumOrderQuantity(e.target.value)}
                placeholder="e.g. 25 kg"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-800 focus:bg-white focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State (e.g. Pollachi, Tamil Nadu or Chennai)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-800 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Specifications *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail material condition, moisture level, purity, batch frequency, packaging (bulk bags, baled)..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-800 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Image Upload & AI Validation Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Material Image (Required for AI Verification) *
                </label>
                <p className="text-[11px] text-slate-500">
                  AI Vision will inspect the image to verify it matches "{materialName || 'entered material'}".
                </p>
              </div>
              {previewSource && !validation.isValidating && (
                <button
                  type="button"
                  onClick={() => {
                    if (previewSource && materialName.trim()) {
                      validateImageWithMaterial(previewSource, materialName);
                    }
                  }}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Re-verify Image
                </button>
              )}
            </div>

            {/* Upload Buttons & URL Input */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-300" />
                Live Camera
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-800" />
                Upload Photo
              </button>

              <div className="flex-1 min-w-[200px] flex items-center gap-1">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setImageUrl(val);
                    if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/')) {
                      setImagePreview(val);
                    }
                  }}
                  placeholder="Or paste direct image URL..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-emerald-800 focus:bg-white focus:outline-none"
                />
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      if (imageUrl.trim()) {
                        setImagePreview(imageUrl.trim());
                        validateImageWithMaterial(imageUrl.trim(), materialName);
                      }
                    }}
                    className="px-2.5 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shrink-0 cursor-pointer"
                    title="Verify this URL with AI Vision"
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>

            {/* Quick Test Samples Bar */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Quick Test Samples (Verify Match / Mismatch):
                </span>
                <span className="text-[10px] text-slate-400">Click to test vision AI</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    name: 'Coconut Shell',
                    label: '🥥 Coconut Shell',
                    url: '/images/coconut-shell.jpg',
                  },
                  {
                    name: 'Coconut Husk',
                    label: '🥥 Coconut Husk & Coir',
                    url: '/images/coconut-husk.jpg',
                  },
                  {
                    name: 'Orange Peel',
                    label: '🍊 Orange Peel',
                    url: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=800&q=80',
                  },
                  {
                    name: 'Eggshell',
                    label: '🥚 Eggshell',
                    url: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=800&q=80',
                  },
                  {
                    name: 'Plastic Bottle',
                    label: '🧴 Plastic Bottle',
                    url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=800&q=80',
                  },
                  {
                    name: 'Unclear / Blurry',
                    label: '🌫 Blurry / Unclear',
                    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="b"><feGaussianBlur stdDeviation="35"/></filter><rect width="300" height="300" fill="%23222222"/><circle cx="150" cy="150" r="100" fill="%233a3a3a" filter="url(%23b)"/></svg>',
                  },
                ].map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => handleSelectSampleTestImage(sample.name, sample.url)}
                    className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Vision analyzing state */}
            {validation.isValidating && (
              <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200 text-xs text-blue-900 flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-blue-700 shrink-0" />
                <div>
                  <p className="font-extrabold text-blue-950 text-sm">
                    AI Vision Analyzing Uploaded Image...
                  </p>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    Comparing uploaded image against expected material: <strong>"{materialName || 'entered material'}"</strong>
                  </p>
                </div>
              </div>
            )}

            {/* AI Validation Result - MATCH CASE */}
            {validation.hasValidated && !validation.isValidating && validation.isMatch && validation.confidence !== 'Low' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-xs space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                      ✓
                    </span>
                    <span className="font-black text-emerald-950 text-sm tracking-tight">
                      Material Match
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-emerald-200 text-emerald-950 border border-emerald-300">
                    {validation.confidence} Confidence
                  </span>
                </div>

                <div className="pl-8 space-y-1 text-emerald-950">
                  <p className="font-bold flex items-center gap-1.5 text-xs text-emerald-900">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Image appears to show <strong>{materialName || validation.expectedMaterial}</strong></span>
                  </p>
                  <p className="font-semibold flex items-center gap-1.5 text-xs text-emerald-800">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>Seller can continue</span>
                  </p>
                  {validation.explanation && (
                    <p className="text-[11px] text-emerald-800/80 pt-1 italic border-t border-emerald-200/60 mt-1">
                      {validation.explanation}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* AI Validation Result - MISMATCH CASE */}
            {validation.hasValidated && !validation.isValidating && !validation.isMatch && validation.confidence !== 'Low' && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-xs space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                      ✗
                    </span>
                    <span className="font-black text-rose-950 text-sm tracking-tight">
                      Material Mismatch
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase bg-rose-200 text-rose-950">
                      MISMATCH
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase bg-slate-200 text-slate-800">
                      {validation.confidence} Confidence
                    </span>
                  </div>
                </div>

                <div className="pl-8 space-y-1.5 text-rose-950">
                  <p className="font-bold text-xs text-rose-900">
                    Image does not match the selected material.
                  </p>
                  <p className="text-xs text-rose-900 leading-relaxed">
                    Your listing says <strong className="font-black text-rose-950 underline decoration-rose-400">{materialName || validation.expectedMaterial}</strong>, but the uploaded image appears to show <strong className="font-black text-rose-950 underline decoration-rose-400">{validation.detectedMaterial}</strong>.
                  </p>
                  <p className="text-xs font-semibold text-rose-800">
                    Please upload an image of the material you want to sell.
                  </p>
                  <p className="text-[11px] font-bold text-rose-600 bg-rose-100/60 px-2 py-1 rounded-md border border-rose-200/60 inline-block">
                    Publishing is disabled until a matching image is uploaded.
                  </p>
                </div>
              </div>
            )}

            {/* AI Validation Result - UNCLEAR / UNCERTAIN CONFIDENCE CASE */}
            {validation.hasValidated && !validation.isValidating && validation.confidence === 'Low' && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="font-black text-amber-950 text-sm tracking-tight">
                      Material could not be verified clearly.
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-amber-200 text-amber-950 border border-amber-300">
                    Low Confidence
                  </span>
                </div>

                <div className="pl-7 space-y-1 text-amber-950">
                  <p className="text-xs font-bold text-amber-900">
                    Please upload a clearer image of the material.
                  </p>
                  <p className="text-[11px] text-amber-800">
                    The photo is too blurry, dark, or indistinct for AI Vision to confidently certify. Publishing remains disabled until a clear photo is uploaded.
                  </p>
                </div>
              </div>
            )}

            {/* Image Preview Box */}
            {previewSource && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                <img
                  src={previewSource}
                  alt="Material preview"
                  onError={(e) => {
                    e.currentTarget.src = getCategoryPlaceholderSvg(materialName, category);
                  }}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-white shrink-0 shadow-2xs"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-extrabold text-slate-800 truncate">
                      Uploaded Material Photo
                    </p>
                    {validation.hasValidated && (
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                        validation.isMatch && validation.confidence !== 'Low'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {validation.isMatch && validation.confidence !== 'Low' ? 'MATCH ✓' : 'MISMATCH ✗'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {validation.hasValidated
                      ? `Detected as: ${validation.detectedMaterial}`
                      : 'Pending AI visual inspection'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImageUrl('');
                    setValidation({
                      hasValidated: false,
                      isValidating: false,
                      expectedMaterial: '',
                      detectedMaterial: '',
                      isMatch: false,
                      confidence: 'Low',
                      explanation: '',
                      mismatchMessage: null,
                      error: null,
                    });
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                  title="Remove uploaded image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Validation Status Indicator / Reason why Publish is disabled */}
              <div className="text-[11px] font-medium">
                {!isNameProvided ? (
                  <span className="text-slate-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    Enter Material Name above to begin
                  </span>
                ) : !isImageProvided ? (
                  <span className="text-amber-700 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    Upload or snap a photo of the material to validate
                  </span>
                ) : validation.isValidating ? (
                  <span className="text-blue-700 flex items-center gap-1 font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    AI Vision is validating your image...
                  </span>
                ) : !validation.isMatch ? (
                  <span className="text-rose-700 flex items-center gap-1 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    Publishing disabled: Image does not match "{materialName}"
                  </span>
                ) : validation.confidence === 'Low' ? (
                  <span className="text-amber-800 flex items-center gap-1 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Publishing disabled: Image could not be verified clearly
                  </span>
                ) : (
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    AI Match Verified: Ready to publish
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValidationPassed || loading || validation.isValidating}
                  title={
                    !isValidationPassed
                      ? 'Publishing is disabled until the image matches the material name'
                      : 'Publish listing to marketplace'
                  }
                  className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-900"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                      {isEditing ? 'Saving Changes...' : 'Publishing & Stamping Passport...'}
                    </>
                  ) : (
                    <>
                      {isEditing ? 'Save Changes' : 'Publish Listing'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </form>

      </div>

      {/* Real-time Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
        onSwitchToFileUpload={() => fileInputRef.current?.click()}
      />
    </div>
  );
};
